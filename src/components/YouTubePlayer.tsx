import { getYouTubeEmbedUrl } from "../lib/youtube";

export default function YouTubePlayer({ url, title }: { url: string; title: string }) {
  const embedUrl = getYouTubeEmbedUrl(url);
  
  if (!embedUrl) return null;
  
  return (
    <div className="my-4 overflow-hidden rounded-lg border border-bone/10 bg-ink">
      <div className="relative aspect-video">
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
      <div className="p-3">
        <p className="text-xs text-smoke">🎬 Video: {title}</p>
      </div>
    </div>
  );
}