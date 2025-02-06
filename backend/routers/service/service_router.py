from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from service.yt_transcript import addYoutubeTranscriptToVector, fetch_transcript_from_supabase, yt_summarize
from utils.logger import logger
from utils.supabase import supabase
from uuid import UUID, uuid4
from datetime import datetime
import yt_dlp #type: ignore

router = APIRouter()

class SubtitleRequest(BaseModel):
    video_url: str
    user_id: str


def extract_video_id(video_url: str) -> str:
    try:
        from urllib.parse import urlparse, parse_qs
        parsed_url = urlparse(video_url)
        video_id = parse_qs(parsed_url.query).get("v", [None])[0]
        if not video_id:
            raise ValueError("Video ID not found in the URL.")
        return video_id
    except Exception as e:
        raise ValueError(f"Invalid YouTube URL: {e}")
    

@router.post("/getyttranscript")
async def get_yt_transcript_api(request: SubtitleRequest):
    try:
        # Extract video_id from the video URL
        video_id = extract_video_id(request.video_url)

        # Check if the video_id already exists in the youtube_summary table
        existing_data_response = (
            supabase.table('youtube_summary')
            .select('*')
            .eq('video_id', video_id)
            .maybe_single()
            .execute()
        )

        if existing_data_response:
            # If video_id exists, return the existing data
            existing_data = existing_data_response.data
            logger.info(f'Existing data: {existing_data}')
            return {
                "summary": existing_data['summarized_text'],
                "title": existing_data['title'],
                "thumbnail": existing_data['thumbnail'],
                "transcript": existing_data['transcript'],
                "video_id": existing_data['video_id']
            }

        # Fetch the transcript and metadata
        result = await fetch_transcript_from_supabase(request.video_url)
        video_summary = yt_summarize(result['transcript'])

        logger.info(result['title'])

        # Ensure all required fields are in the result
        required_keys = ['transcript']
        if all(key in result for key in required_keys) and result['transcript']:
            logger.info(f'Result: {result}')
            logger.info(f'Keys in result: {result.keys()}')

            # Insert new data if the video_id does not exist
            data = {
                "title": result['title'],
                "transcript": result['transcript'],
                "video_id": video_id,
                "summarized_text": video_summary
            }

            # Add to vector DB (make sure this function works asynchronously)
            await addYoutubeTranscriptToVector(request.user_id, video_id, video_summary)

            # Insert into Supabase table
            response = supabase.table('youtube_summary').insert(data).execute()

            logger.info(f"CREATED ENTRY: {response}")

            if response is None:
                error_message = response.error.message or 'Failed to insert data into Supabase'
                logger.error(f'Supabase insert error: {error_message}')
                raise RuntimeError(error_message)

            # Handle user-yt-video relation
            data2 = {"user_id": request.user_id, "video_id": response.data[0]['id']}
            response_bridge = supabase.table('user_yt_video').insert(data2).execute()

            if response_bridge is None:
                error_message = response_bridge.error.message or 'Failed to link user and video.'
                logger.error(f'Supabase bridge insert error: {error_message}')
                raise RuntimeError(error_message)

            logger.info('Data inserted successfully')

            return {
                "summary": video_summary,
                "title": result['title'],
                "transcript": result['transcript'],
                "video_id": response.data[0]['id']
            }
        else:
            logger.error('Missing required keys or empty transcript in the result')
            raise HTTPException(status_code=400, detail="Missing required keys or empty transcript in the result")

    except ValueError as ve:
        logger.error(f'ValueError: {str(ve)}')
        raise HTTPException(status_code=400, detail=str(ve))
    except RuntimeError as re:
        logger.error(f'RuntimeError: {str(re)}')
        raise HTTPException(status_code=404, detail=str(re))
    except Exception as e:
        logger.error(f'Unexpected error: {str(e)}')
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


class VideoSummary(BaseModel):
    title: str
    thumbnail: str
    video_id: str

@router.get("/videos", response_model=list[VideoSummary])
async def get_user_videos(user_id: str):
    try:
        # Join user_yt_video with youtube_summary using video_id
        response = (
            supabase.table('user_yt_video')
            .select('youtube_summary(title, thumbnail, video_id)')
            .eq('user_id', user_id)
            .execute()
        )

        if response.data:
            return [entry["youtube_summary"] for entry in response.data]
        else:
            return []

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch videos: {str(e)}")
    
class VideoDetails(BaseModel):
    id:str
    title: str
    thumbnail: str
    transcript: str
    video_id: str
    summarized_text: str

@router.get("/video_details", response_model=VideoDetails)
async def get_video_details(video_id: str):
    try:
        # Fetch video details from the database
        response = (
            supabase.table('youtube_summary')
            .select('id, title, thumbnail, transcript, video_id, summarized_text')
            .eq('video_id', video_id)
            .single()
            .execute()
        )

        if response.data:
            return response.data
        else:
            raise HTTPException(status_code=404, detail="Video not found")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch video details: {str(e)}")
    
class ChatInitRequest(BaseModel):
    user_id: str
    video_id: str

@router.post("/initialize_chat")
async def initialize_chat(request: ChatInitRequest):
    # Check if a chat with the same user_id and video_id exists
    existing_chat = supabase.table("chat").select("id").eq("user_id", request.user_id).eq("video_id", request.video_id).execute()

    if existing_chat.data:
        # If a chat exists, return the existing chat_id
        chat_id = existing_chat.data[0]["id"]
    else:
        # If no chat exists, create a new chat
        chat_id = str(uuid4())
        chat_data = {
            "id": chat_id,
            "user_id": request.user_id,
            "video_id": request.video_id,
            "chat_content": [],
            "created_at": datetime.utcnow().isoformat()
        }
        response = supabase.table("chat").insert(chat_data).execute()
        if response.data:
            raise HTTPException(status_code=500, detail="Failed to initialize chat")

    return {"chat_id": chat_id}

class AddMessageRequest(BaseModel):
    chat_id: str
    user_id: str
    message: str
    sender: str

@router.post("/add_message")
async def add_message(request: AddMessageRequest):
    # Fetch the current chat content
    response = supabase.table("chat").select("chat_content").eq("id", request.chat_id).execute()
    if response is None:
        raise HTTPException(status_code=404, detail="Chat session not found")
    chat_content = response.data[0]["chat_content"]

    new_message = {
        "sender": request.sender,
        "message": request.message,
        "timestamp": str(datetime.now())  # Replace with actual timestamp
    }
    
    # Append the new message
    chat_content.append(new_message)
    
    # Update the chat session with the new chat content
    update_response = supabase.table("chat").update({"chat_content": chat_content}).eq("id", request.chat_id).execute()
    if update_response is None:
        raise HTTPException(status_code=500, detail="Failed to add message")
    return {"message": "Message added successfully"}

class ChatHistoryRequest(BaseModel):
    chat_id: int

@router.post("/get_chat_history")
async def get_chat_history(request: ChatInitRequest):
    response = supabase.table("chat").select("chat_content").eq("user_id", request.user_id).eq("video_id", request.video_id).execute()
    if response is None:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return {"chat_content": response.data[0]["chat_content"]}

@router.get("/test")
async def test():
    return {"message":"api works"}


class NoteCreate(BaseModel):
    title: str
    content: str
    user_id:str

@router.post("/create-note")
async def create_note(note: NoteCreate):
    try:
        note_id = uuid4()
        note_data = {
            "id": str(note_id),
            "title": note.title,
            "user_id": note.user_id,
            "note_content": note.content,
            "created_at": datetime.utcnow().isoformat(),
        }
        response = supabase.table('notes').insert(note_data).execute()

        if response is None:
            raise HTTPException(status_code=500, detail="Failed to create note")

        return {"id": str(note_id), "folder_id": str(response), "title": note.title, "content": response, "created_at": note_data["created_at"]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
class Note(BaseModel):
    id: UUID
    title: str
    user_id: UUID
    note_content: str
    created_at: datetime

@router.get("/get-user-notes/{user_id}", response_model=List[Note])
async def get_user_notes(user_id: UUID):
    try:
        # Query the notes table for notes associated with the given user_id
        response = supabase.table('notes').select('*').eq('user_id', str(user_id)).execute()

        if response is None:
            raise HTTPException(status_code=500, detail="Failed to fetch notes")

        notes = response.data  # Assuming response.data contains the list of notes
        return notes

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
class Note(BaseModel):
    id: str
    title: str
    content: str
    user_id: str

class AddToNoteRequest(BaseModel):
    note_id: str
    text: str
    user_id: str

class GetUserNotesRequest(BaseModel):
    user_id: str

def get_user_notes(user_id: str) -> List[Note]:
    # Query notes from Supabase
    response = supabase.table('notes').select('*').eq('user_id', user_id).execute()

    if 'data' not in response:
        raise HTTPException(status_code=404, detail="Notes not found")

    notes = response['data']
    return notes

@router.post("/add_to_note")
async def add_to_note(request: AddToNoteRequest):
    note_id = request.note_id
    text_to_add = request.text
    user_id = request.user_id

    logger.info(f'Adding text to note: {note_id} for user: {user_id}')

    # Check if the note exists for the user
    notes = get_user_notes(user_id)
    note_ids = [note['id'] for note in notes]

    if note_id not in note_ids:
        logger.error(f'Note not found: {note_id}')
        raise HTTPException(status_code=404, detail="Note not found")

    # Append the text to the note's content
    existing_content = notes[note_ids.index(note_id)]['note_content']
    new_content = f"{existing_content}\n{text_to_add}"

    response = supabase.table('notes').update({'note_content': new_content}).eq('id', note_id).execute()

@router.post("/get-user-notes", response_model=List[Note])
async def get_user_notes_endpoint(request: GetUserNotesRequest):
    user_id = request.user_id
    return get_user_notes(user_id)