import { getYouTubeEmbedUrl } from "../lib/youtube";

interface Resource {
  id: string;
  type: string;
  title: string;
  description?: string;
  source_url: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  file_size_bytes?: number;
  metadata?: any;
  access_level: string;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    video_youtube: '▶️',
    video_r2: '🎬',
    video_external: '📹',
    document_pdf: '📄',
    document_text: '📝',
    audio: '🎵',
    link_drive: '🔗',
    link_external: '🌐',
    assignment: '📋',
    image: '🖼️',
  };
  return icons[type] || '📎';
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    video_youtube: 'YouTube Video',
    video_r2: 'Video',
    video_external: 'External Video',
    document_pdf: 'PDF Document',
    document_text: 'Reading Material',
    audio: 'Audio',
    link_drive: 'Google Drive',
    link_external: 'External Link',
    assignment: 'Assignment',
    image: 'Image',
  };
  return labels[type] || 'Resource';
}

// Individual Renderers
function YouTubeRenderer({ resource }: { resource: Resource }) {
  const embedUrl = getYouTubeEmbedUrl(resource.source_url);
  if (!embedUrl) return <p className="text-alert text-sm">Invalid YouTube URL</p>;
  
  return (
    <div className="overflow-hidden rounded-lg border border-bone/10 bg-ink">
      <div className="relative aspect-video">
        <iframe
          src={embedUrl}
          title={resource.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
      <div className="p-3">
        <p className="text-sm font-bold text-bone">{resource.title}</p>
        {resource.description && <p className="mt-1 text-xs text-smoke">{resource.description}</p>}
      </div>
    </div>
  );
}

function VideoRenderer({ resource }: { resource: Resource }) {
  return (
    <div className="overflow-hidden rounded-lg border border-bone/10 bg-ink">
      <video
        src={resource.source_url}
        poster={resource.thumbnail_url}
        controls
        className="w-full aspect-video bg-black"
      >
        Your browser does not support the video tag.
      </video>
      <div className="p-3">
        <p className="text-sm font-bold text-bone">{resource.title}</p>
        <div className="mt-1 flex items-center gap-3 text-xs text-smoke">
          {resource.duration_seconds && <span>⏱ {formatDuration(resource.duration_seconds)}</span>}
          {resource.file_size_bytes && <span>💾 {formatFileSize(resource.file_size_bytes)}</span>}
        </div>
        {resource.description && <p className="mt-1 text-xs text-smoke">{resource.description}</p>}
      </div>
    </div>
  );
}

function PdfRenderer({ resource }: { resource: Resource }) {
  return (
    <div className="overflow-hidden rounded-lg border border-bone/10 bg-ink">
      <div className="relative aspect-[3/4] max-h-[600px]">
        <iframe
          src={resource.source_url}
          title={resource.title}
          className="absolute inset-0 h-full w-full"
        />
      </div>
      <div className="p-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-bone">{resource.title}</p>
          {resource.description && <p className="mt-1 text-xs text-smoke">{resource.description}</p>}
        </div>
        <a
          href={resource.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded bg-amber/20 px-3 py-1.5 text-xs font-bold text-amber hover:bg-amber/30"
        >
          Open ↗
        </a>
      </div>
    </div>
  );
}

function AudioRenderer({ resource }: { resource: Resource }) {
  return (
    <div className="rounded-lg border border-bone/10 bg-ink p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber/20 text-2xl">
          🎵
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-bone">{resource.title}</p>
          {resource.description && <p className="mt-1 text-xs text-smoke">{resource.description}</p>}
        </div>
      </div>
      <audio src={resource.source_url} controls className="w-full" />
    </div>
  );
}

function LinkRenderer({ resource }: { resource: Resource }) {
  const isDrive = resource.type === 'link_drive';
  const domain = (() => {
    try {
      return new URL(resource.source_url).hostname.replace('www.', '');
    } catch {
      return 'external';
    }
  })();
  
  return (
    <a
      href={resource.source_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg border border-bone/10 bg-ink p-4 hover:border-amber/30 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-2xl ${
          isDrive ? 'bg-tgsky/20' : 'bg-bone/10'
        }`}>
          {isDrive ? '📁' : '🌐'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-bone truncate">{resource.title}</p>
          <p className="text-xs text-smoke truncate">{domain}</p>
          {resource.description && <p className="mt-1 text-xs text-smoke line-clamp-2">{resource.description}</p>}
        </div>
        <span className="text-amber text-xl">→</span>
      </div>
    </a>
  );
}

function TextRenderer({ resource }: { resource: Resource }) {
  return (
    <div className="rounded-lg border border-bone/10 bg-ink p-6">
      <h3 className="font-display text-lg font-bold text-bone mb-2">{resource.title}</h3>
      {resource.description && (
        <div className="prose prose-invert prose-sm max-w-none text-bone/90 leading-relaxed whitespace-pre-wrap">
          {resource.description}
        </div>
      )}
    </div>
  );
}

function AssignmentRenderer({ resource }: { resource: Resource }) {
  return (
    <div className="rounded-lg border-2 border-amber/30 bg-amber/5 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber/20 text-xl">
          📋
        </div>
        <div className="flex-1">
          <p className="text-xs font-mono uppercase tracking-widest text-amber mb-1">Assignment</p>
          <p className="font-display text-lg font-bold text-bone">{resource.title}</p>
          {resource.description && (
            <p className="mt-2 text-sm text-bone/90 whitespace-pre-wrap">{resource.description}</p>
          )}
          {resource.source_url && (
            <a
              href={resource.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block rounded bg-amber px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink hover:bg-amber/90"
            >
              View Task →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ImageRenderer({ resource }: { resource: Resource }) {
  return (
    <div className="overflow-hidden rounded-lg border border-bone/10 bg-ink">
      <img
        src={resource.source_url}
        alt={resource.title}
        className="w-full"
      />
      <div className="p-3">
        <p className="text-sm font-bold text-bone">{resource.title}</p>
        {resource.description && <p className="mt-1 text-xs text-smoke">{resource.description}</p>}
      </div>
    </div>
  );
}

// Main Component
export default function ResourcePlayer({ resource }: { resource: Resource }) {
  const renderers: Record<string, React.FC<{ resource: Resource }>> = {
    video_youtube: YouTubeRenderer,
    video_r2: VideoRenderer,
    video_external: VideoRenderer,
    document_pdf: PdfRenderer,
    document_text: TextRenderer,
    audio: AudioRenderer,
    link_drive: LinkRenderer,
    link_external: LinkRenderer,
    assignment: AssignmentRenderer,
    image: ImageRenderer,
  };
  
  const Renderer = renderers[resource.type];
  if (!Renderer) {
    return (
      <div className="rounded-lg border border-bone/10 bg-ink p-4">
        <p className="text-sm text-smoke">Unsupported resource type: {resource.type}</p>
      </div>
    );
  }
  
  return (
    <div className="my-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-smoke">
        <span>{getTypeIcon(resource.type)}</span>
        <span className="font-mono uppercase tracking-wider">{getTypeLabel(resource.type)}</span>
        {resource.access_level === 'public' && (
          <span className="rounded bg-mint/20 px-1.5 py-0.5 text-[9px] font-bold text-mint">FREE PREVIEW</span>
        )}
      </div>
      <Renderer resource={resource} />
    </div>
  );
}