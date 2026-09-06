import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useStore } from "../lib/store";

interface ResourceViewerProps {
  resourceId: string;
  title: string;
  type: 'video' | 'document' | 'image' | 'audio' | 'link';
}

export default function ResourceViewer({ resourceId, title, type }: ResourceViewerProps) {
  const { toast } = useStore();
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadResource = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await api.getResourceStreamData(resourceId);
        
        if (isMounted) {
          // If it's an R2 file, the Worker streams it directly to this URL
          // We use the API endpoint itself as the src for the iframe/object
          if (res.data.type === 'r2' || !res.data.embedUrl) {
            setEmbedUrl(`${import.meta.env.VITE_API_BASE || 'https://tigerslair-academy.ehisferguson.workers.dev'}/api/resources/stream/${resourceId}`);
          } else {
            // If it's an external link, use the masked embed URL provided by the Worker
            setEmbedUrl(res.data.embedUrl);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load resource. Please ensure you are enrolled.");
          toast(err.message || "Failed to load resource");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadResource();

    return () => {
      isMounted = false;
    };
  }, [resourceId, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 rounded-lg border border-bone/10 bg-coal">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber border-t-transparent" />
          <p className="font-mono text-sm text-amber">Securing content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-alert/30 bg-alert/5 p-6 text-center">
        <p className="font-display text-lg font-bold text-alert mb-2">Access Restricted</p>
        <p className="text-sm text-smoke">{error}</p>
      </div>
    );
  }

  if (!embedUrl) return null;

  // Determine the best HTML element to render the content securely
  const isVideo = type === 'video' || embedUrl.includes('youtube') || embedUrl.includes('vimeo');
  const isDocument = type === 'document' || embedUrl.includes('docs.google.com');
  const isAudio = type === 'audio';
  const isImage = type === 'image';

  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg font-bold text-bone">{title}</h3>
      
      <div className="relative w-full overflow-hidden rounded-lg border border-bone/10 bg-black">
        {/* 16:9 Aspect Ratio Container for Videos and Document Viewers */}
        {(isVideo || isDocument) && (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={embedUrl}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title}
            />
          </div>
        )}

        {/* Audio Player */}
        {isAudio && (
          <div className="p-4">
            <audio controls className="w-full accent-amber">
              <source src={embedUrl} />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {/* Image Viewer */}
        {isImage && (
          <img 
            src={embedUrl} 
            alt={title} 
            className="w-full h-auto max-h-[600px] object-contain bg-ink"
            onContextMenu={(e) => e.preventDefault()} // Disable right-click save
          />
        )}
      </div>

      {/* Fallback Download/View Button (Optional, if you want to allow downloads) */}
      {!isVideo && !isDocument && (
        <a 
          href={embedUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-block rounded-md bg-amber px-4 py-2 text-xs font-bold uppercase tracking-widest text-ink hover:bg-amber/90"
        >
          Open {type} in New Tab
        </a>
      )}
    </div>
  );
}