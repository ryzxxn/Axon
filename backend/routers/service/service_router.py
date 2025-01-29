from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from service.yt_transcript import get_yt_transcript, addYoutubeTranscriptToVector
from utils.logger import logger
from utils.supabase import supabase
from uuid import uuid4
from datetime import datetime

router = APIRouter()

class SubtitleRequest(BaseModel):
    video_url: str
    user_id: str

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
            .maybe_single()  # Use maybe_single to handle no rows returned
            .execute()
        )

        if existing_data_response:
            # If video_id exists, return the existing data
            existing_data = existing_data_response.data
            return {
                "summary":existing_data['summarized_text'],
                "title": existing_data['title'],
                "thumbnail": existing_data['thumbnail'],
                "transcript": existing_data['transcript'],
                "video_id": existing_data['video_id']
            }

        # Fetch the transcript and metadata
        result = get_yt_transcript(request.video_url)

        # Check if all required keys are present and transcript is not empty
        required_keys = ['title', 'thumbnail', 'transcript', 'video_id', 'summary']
        if all(key in result for key in required_keys) and result['transcript']:
            logger.info(f'{result}')
            logger.info(f'{result.keys()}')

            # If video_id does not exist, insert the new data
            data = {
                "user_id": request.user_id,
                "title": result['title'],
                "thumbnail": result['thumbnail'],
                "transcript": result['transcript'],
                "video_id": result['video_id'],
                "summarized_text": result['summary']
            }
            #add to vector DB
            await addYoutubeTranscriptToVector(request.user_id, result['video_id'], result['summary'])
            response = supabase.table('youtube_summary').insert(data).execute()

            # Check for errors in the response
            if response is None:
                error_message = response.get('msg', 'Failed to insert data into Supabase')
                logger.error(f'Supabase insert error: {error_message}')
                raise RuntimeError(error_message)

            # logger.info(f'Data inserted successfully: {response.data}')
            return result
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

def extract_video_id(video_url: str) -> str:
    """
    Extracts the video ID from a YouTube URL.

    Args:
        video_url (str): The YouTube video URL.

    Returns:
        str: The video ID.

    Raises:
        ValueError: If the URL is invalid or does not contain a video ID.
    """
    try:
        from urllib.parse import urlparse, parse_qs
        parsed_url = urlparse(video_url)
        video_id = parse_qs(parsed_url.query).get("v", [None])[0]
        if not video_id:
            raise ValueError("Video ID not found in the URL.")
        return video_id
    except Exception as e:
        raise ValueError(f"Invalid YouTube URL: {e}")


class VideoSummary(BaseModel):
    title: str
    thumbnail: str
    video_id: str

@router.get("/videos", response_model=list[VideoSummary])
async def get_user_videos(user_id: str):
    try:
        # Fetch all videos scanned by the user
        response = (
            supabase.table('youtube_summary')
            .select('title, thumbnail, video_id')
            .eq('user_id', user_id)
            .execute()
        )

        if response.data:
            return response.data
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
        if response.status_code != 200:
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

class QuizeRequest(BaseModel):
    user_id: str
@router.post("/generateQuiz")
async def generateQuiz(request: QuizeRequest):
    print('')

@router.get("/test")
async def test():
    return {"message":"api works"}