import { IconX } from "./Icons";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-bone/10 bg-coal p-6 relative animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onCancel} 
          disabled={isLoading}
          className="absolute top-4 right-4 text-smoke hover:text-bone transition-colors"
        >
          <IconX className="h-5 w-5" />
        </button>

        <h3 className="font-display text-xl font-bold text-bone mb-2 pr-6">{title}</h3>
        <p className="text-sm text-smoke mb-6 leading-relaxed">{message}</p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-md border border-bone/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-bone hover:bg-bone/5 disabled:opacity-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-md px-4 py-2 text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-2 disabled:opacity-50 transition-colors ${
              isDestructive 
                ? 'bg-alert hover:bg-alert/90' 
                : 'bg-amber hover:bg-amber/90'
            }`}
          >
            {isLoading && (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-ink border-t-transparent" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}