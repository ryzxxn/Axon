from youtube_transcript_api import YouTubeTranscriptApi # type: ignore
from urllib.parse import urlparse, parse_qs
import yt_dlp # type: ignore
import google.generativeai as genai # type: ignore
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
    ydl_opts = {
        'quiet': True,
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

def get_yt_transcript(video_url: str) -> dict:
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
        # Try fetching the transcript in English
        transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=['en'])
        transcript_text = "\n".join([entry['text'] for entry in transcript])
        summarized_text = yt_summarize(transcript_text)
    except Exception as e:
        # If English transcript is not available, try fetching in any available language
        try:
            transcript = YouTubeTranscriptApi.get_transcript(video_id)
            transcript_text = "\n".join([entry['text'] for entry in transcript])
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
    response = model.generate_content(f'Summerize the text: {transcript_text}')

    return response.text