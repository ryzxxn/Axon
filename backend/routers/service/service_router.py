from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from service.yt_transcript import get_yt_transcript
from service.yt_transcript import yt_summarize
from utils.logger import logger
from utils.supabase import supabase

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
            response = supabase.table('youtube_summary').insert(data).execute()

            # Check for errors in the response
            if response is None:
                error_message = response.get('msg', 'Failed to insert data into Supabase')
                logger.error(f'Supabase insert error: {error_message}')
                raise RuntimeError(error_message)

            logger.info(f'Data inserted successfully: {response.data}')
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
