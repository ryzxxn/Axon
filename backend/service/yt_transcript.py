from fastapi import HTTPException
import httpx
import os
from dotenv import load_dotenv
import google.generativeai as genai #type: ignore
import yt_dlp #type: ignore
from utils.logger import logger
import os
from dotenv import load_dotenv

load_dotenv()

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

def get_video_metadata(video_url: str) -> dict:
    """
    Fetches the metadata for a YouTube video using yt-dlp.

    Args:
        video_url (str): The YouTube video URL.

    Returns:
        dict: A dictionary containing the video title and thumbnail URL.

    Raises:
        RuntimeError: If fetching metadata fails.
    """

    script_dir = os.path.dirname(os.path.abspath(__file__))
    cookies_path = os.path.join(script_dir, 'cookies.txt')

    ydl_opts = {
        'quiet': True,
        'cookiefile': cookies_path,
        'username': os.getenv('YT_EMAIL'),
        'password': os.getenv('YT_PASSWORD'),
        'usenetrc': True
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(video_url, download=False)
        title = info_dict.get('title', None)
        thumbnail = info_dict.get('thumbnail', None)

        if not title or not thumbnail:
            raise RuntimeError("Failed to extract video metadata.")

        return {
            'title': title,
            'thumbnail': thumbnail
        }

async def fetch_transcript_from_api(video_url: str) -> str:
    """
    Fetches the transcript from the new API.

    Args:
        video_url (str): The YouTube video URL.

    Returns:
        str: The transcript text.

    Raises:
        RuntimeError: If fetching the transcript fails.
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://tactiq-apps-prod.tactiq.io/transcript",
            json={"videoUrl": video_url, "langCode": "en"},
            headers={"content-type": "application/json"},
        )
        if response:
            logger.info(f'{response}')

        transcript_data = response.json()
        text_only = " ".join(
            caption["text"] for caption in transcript_data.get("captions", [])
        )
        return text_only

async def get_yt_transcript(video_url: str) -> dict:
    """
    Fetches the transcript, title, and thumbnail for a YouTube video.

    Args:
        video_url (str): The YouTube video URL.

    Returns:
        dict: A dictionary containing the transcript, title, and thumbnail.

    Raises:
        RuntimeError: If fetching the transcript or metadata fails.
    """
    video_id = extract_video_id(video_url)

    try:
        # Fetch the transcript from the new API
        transcript_text = await fetch_transcript_from_api(video_url)
        summarized_text = yt_summarize(transcript_text)
    except Exception as e:
        raise RuntimeError(f"Failed to fetch transcript: {e}")

    # Fetch video metadata
    metadata = get_video_metadata(video_url)

    return {
        'transcript': transcript_text,
        'title': metadata['title'],
        'thumbnail': metadata['thumbnail'],
        'video_id': video_id,
        'summary': summarized_text
    }

def yt_summarize(transcript_text:str):
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(f'Summarize the text, covering every fact, sentences while preserving as much detail as possible: {transcript_text}')

    return response.text

async def addYoutubeTranscriptToVector(user_id: str, video_id: str, transcript: str):
    url = f"{os.getenv('BACKEND_URL')}/ingestVideo"  # Ensure the environment variable is set correctly

    # Use BytesIO to simulate the file upload in memory
    data = {'user_id': user_id, 'video_id': video_id, 'transcript': transcript}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data)
            response.raise_for_status()  # Raises an exception for 4xx/5xx responses
    except httpx.HTTPStatusError as exc:
        print(f"HTTP error occurred: {exc.response.status_code} - {exc.response.text}")
    except httpx.RequestError as exc:
        print(f"An error occurred while requesting {exc.request.url!r}: {exc}")
    except Exception as exc:
        print(f"An unexpected error occurred: {exc}")
    else:
        print("Transcript ingested successfully")

async def fetch_transcript_from_supabase(video_url: str) -> dict:
    SUPABASE_API_KEY = os.environ.get("SUPABASE_KEY")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://uuqdokzuopkpbfyianvu.supabase.co/functions/v1/fetch_transcript",
                json={"video_url": video_url},
                headers={
                    "content-type": "application/json",
                    "Authorization": f"Bearer {SUPABASE_API_KEY}"     
                    }
            )

            if response.status_code == 200:
                logger.info(response)
                return response.json()
            else:
                logger.error(f"Error fetching transcript: {response.status_code} - {response.text}")
                raise HTTPException(status_code=response.status_code, detail="Error fetching transcript")
    except httpx.RequestError as exc:
        logger.error(f"An error occurred while requesting {exc.request.url!r}: {exc}")
        raise HTTPException(status_code=500, detail="Error connecting to Supabase function")
