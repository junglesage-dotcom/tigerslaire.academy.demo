import { useState } from "react";
import { api } from "../lib/api";
import { useStore } from "../lib/store";

interface ResourceInputProps {
  courseId: string;
  lessonId: string;
  type: 'video' | 'document' | 'image' | 'audio' | 'link';
  onResourceReady: (resourceData: any) => void;
}

export default function ResourceInput({ courseId, lessonId, type, onResourceReady }: ResourceInputProps) {
  const { toast } = useStore();
  const [mode, setMode] = useState<'file' | 'url'>('url'); // Default to URL for ease
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (mode === 'url' && !url) {
      toast("Please enter a valid URL");
      return;
    }
    if (mode === 'file' && !file) {
      toast("Please select a file");
      return;
    }

    setUploading(true);
    try {
      const res = await api.uploadResource(
        mode === 'file' ? file : null,
        mode === 'url' ? url : null,
        courseId,
        lessonId,
        type
      );
      toast("Resource added successfully!");
      onResourceReady(res.data);
      setUrl("");
      setFile(null);
    } catch (err: any) {
      toast(err.message || "Failed to add resource");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3 p-4 rounded-lg border border-bone/10 bg-ink">
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setMode('url')}
          className={`px-3 py-1 text-xs font-bold uppercase rounded ${mode === 'url' ? 'bg-amber text-ink' : 'text-smoke hover:text-bone'}`}
        >
          Paste Link (YouTube, Drive, etc.)
        </button>
        <button
          onClick={() => setMode('file')}
          className={`px-3 py-1 text-xs font-bold uppercase rounded ${mode === 'file' ? 'bg-amber text-ink' : 'text-smoke hover:text-bone'}`}
        >
          Upload File (R2)
        </button>
      </div>

      {mode === 'url' ? (
        <input
          type="url"
          placeholder="https://youtube.com/watch?v=... or https://drive.google.com/..."
          className="w-full rounded border border-bone/10 bg-coal p-2 text-sm text-bone focus:border-amber outline-none"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      ) : (
        <input
          type="file"
          className="w-full text-sm text-smoke file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-bold file:bg-amber file:text-ink hover:file:bg-amber/90"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      )}

      <button
        onClick={handleSubmit}
        disabled={uploading}
        className="w-full rounded bg-mint py-2 text-xs font-bold uppercase tracking-widest text-ink hover:bg-mint/90 disabled:opacity-50"
      >
        {uploading ? "Processing..." : "Add Resource"}
      </button>
    </div>
  );
}