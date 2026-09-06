import { useState } from "react";
import { api } from "../lib/api";
import { useStore } from "../lib/store";

interface FileUploadProps {
  courseId: string;
  lessonId: string;
  type: 'video' | 'document' | 'image' | 'audio';
  onUploadComplete: (resourceData: any) => void;
}

export default function FileUpload({ courseId, lessonId, type, onUploadComplete }: FileUploadProps) {
  const { toast } = useStore();
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploading(true);

    try {
      const res = await api.uploadResource(file, null, courseId, lessonId, type);
      toast(`${type} uploaded successfully!`);
      onUploadComplete(res.data);
      setFileName(""); // Reset input
    } catch (err: any) {
      toast(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
      // Reset the file input value so the same file can be selected again if needed
      if (e.target) e.target.value = "";
    }
  };

  const getAcceptTypes = () => {
    switch (type) {
      case 'video': return 'video/mp4,video/webm,video/ogg';
      case 'image': return 'image/png,image/jpeg,image/jpg,image/gif';
      case 'audio': return 'audio/mpeg,audio/wav,audio/ogg';
      default: return '.pdf,.doc,.docx,.txt,.zip';
    }
  };

  return (
    <div className="flex items-center gap-3">
      <label className="flex-1 cursor-pointer rounded-md border border-dashed border-bone/20 bg-ink p-3 text-center text-sm text-smoke hover:border-amber hover:text-amber transition-colors">
        {uploading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber border-t-transparent" />
            Uploading {fileName}...
          </span>
        ) : fileName ? (
          <span className="text-bone">✓ {fileName}</span>
        ) : (
          <span>Click to upload {type}</span>
        )}
        <input
          type="file"
          accept={getAcceptTypes()}
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>
    </div>
  );
}