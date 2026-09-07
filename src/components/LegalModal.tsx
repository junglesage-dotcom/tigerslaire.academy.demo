import { useState } from 'react';

const LEGAL_CONTENT = {
  privacy: "Tiger's Lair Academy respects your privacy. We collect only the data necessary to provide our educational services...",
  terms: "By accessing Tiger's Lair Academy, you agree to abide by our community guidelines and intellectual property policies...",
  refund: "Due to the digital nature of our courses, refunds are only processed within 48 hours of enrollment if less than 20% of the course has been accessed...",
};

export default function LegalModal({ type, onClose }: { type: keyof typeof LEGAL_CONTENT | null, onClose: () => void }) {
  if (!type) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/90 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-bone/10 bg-coal p-8 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="font-display text-2xl font-bold text-amber mb-4 capitalize">{type.replace('_', ' ')} Policy</h2>
        <p className="text-smoke leading-relaxed whitespace-pre-wrap">{LEGAL_CONTENT[type]}</p>
        <button onClick={onClose} className="mt-6 w-full rounded-md bg-amber py-2 font-display text-sm font-bold text-ink">Close</button>
      </div>
    </div>
  );
}