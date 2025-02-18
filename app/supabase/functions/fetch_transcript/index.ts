import { serve } from "https://deno.land/std@0.140.0/http/server.ts";

// Constants for the API URL
const TACTIQ_API_URL = "https://tactiq-apps-prod.tactiq.io/transcript";

// Helper function to extract video ID from YouTube URL
function extractVideoId(videoUrl: string): string {
  const urlParams = new URLSearchParams(new URL(videoUrl).search);
  const videoId = urlParams.get('v');
  if (!videoId) {
    throw new Error("Video ID not found in the URL.");
  }
  return videoId;
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405 });
  }

  try {
    const { video_url } = await req.json();
    if (!video_url) {
      return new Response(JSON.stringify({ error: "Missing video_url" }), { status: 400 });
    }

    // Extract the video ID from the URL
    const videoId = extractVideoId(video_url);

    // Fetch transcript from the API
    const transcriptResponse = await fetch(TACTIQ_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl: video_url, langCode: "en" }),
    });

    if (!transcriptResponse.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch transcript" }), { status: transcriptResponse.status });
    }

    const transcriptData = await transcriptResponse.json();

    // Extract transcript text
    const transcriptText = transcriptData?.captions?.map((caption: { text: string }) => caption.text).join(" ") || "";

    // Return the transcript text
    return new Response(JSON.stringify({ transcript: transcriptText ,title: transcriptData.title}), { status: 200 });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: `Internal Server Error: ${error.message}` }), { status: 500 });
  }
});
