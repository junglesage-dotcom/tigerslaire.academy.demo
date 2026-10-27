import { useMemo } from "react";

// Helper to convert standard links to embed links
function getEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
  
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  // Direct MP4
  if (url.endsWith('.mp4')) return url;

  return url;
}

export default function CourseIntroVideo({ videoUrl, courseTitle }: { videoUrl: string | null; courseTitle: string }) {
  const embedUrl = useMemo(() => getEmbedUrl(videoUrl), [videoUrl]);

  if (!embedUrl) return null;

  const isDirectVideo = embedUrl.endsWith('.mp4');

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-bone/10 bg-coal shadow-2xl">
      <div className="border-b border-bone/10 bg-ink/50 px-6 py-4">
        <h3 className="font-display text-lg font-bold text-amber">
          ▶️ Course Introduction: {courseTitle}
        </h3>
        <p className="text-xs text-smoke mt-1">Watch this brief overview before diving into Module 1.</p>
      </div>
      
      <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 Aspect Ratio */ }}>
        {isDirectVideo ? (
          <video 
            src={embedUrl} 
            controls 
            className="absolute inset-0 h-full w-full bg-black"
          />
        ) : (
          <iframe
            src={embedUrl}
            title={`${courseTitle} Introduction`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        )}
      </div>
    </div>
  );
}