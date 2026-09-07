import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useStore } from "../lib/store";
import { IconClaw } from "../components/Icons";

export default function VerifyCertificate({ certId }: { certId?: string }) {
  const { go } = useStore();
  const [input, setInput] = useState(certId || "");
  const [result, setResult] = useState<any>(null);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const check = async (id?: string) => {
    const cid = (id ?? input).trim();
    if (!cid) return;
    setLoading(true);
    setChecked(false);
    setResult(null);
    try {
      const res = await api.verifyCertificate(cid);
      setResult(res);
    } catch {
      setResult({ valid: false });
    } finally {
      setChecked(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (certId) check(certId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certId]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
      <button onClick={() => go({ view: "home" })} className="mb-8 flex items-center gap-2 text-sm text-smoke hover:text-amber transition-colors">
        <span>←</span><span>Back to Home</span>
      </button>

      <div className="rounded-2xl border border-bone/10 bg-coal p-8 sm:p-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber text-ink"><IconClaw className="h-5 w-5" /></div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-smoke">Official Verification</p>
            <h1 className="font-display text-2xl font-extrabold text-bone">Certificate Checker</h1>
          </div>
        </div>
        <p className="text-sm text-smoke mb-6">Enter a Tiger's Lair certificate ID (e.g. TL-PY101-483920) to confirm its authenticity.</p>

        <form onSubmit={(e) => { e.preventDefault(); check(); }} className="flex flex-col sm:flex-row gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="TL-XXXX-000000"
            className="flex-1 rounded-md border border-bone/15 bg-ink px-4 py-3 font-mono text-sm text-bone placeholder:text-smoke/50 outline-none focus:border-amber"
          />
          <button type="submit" disabled={loading} className="rounded-md bg-amber px-6 py-3 font-display text-xs font-extrabold uppercase tracking-widest text-ink disabled:opacity-60">
            {loading ? "Checking..." : "Verify"}
          </button>
        </form>

        {checked && result?.valid && (
          <div className="mt-6 rounded-xl border border-mint/30 bg-mint/5 p-6">
            <p className="font-display text-lg font-extrabold text-mint mb-3">✓ Authentic Certificate</p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-smoke">Holder</dt><dd className="font-bold text-bone text-right">{result.data.holder_name}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-smoke">Course</dt><dd className="font-bold text-bone text-right">{result.data.course_title} ({result.data.course_code})</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-smoke">Gate Quiz Score</dt><dd className="font-bold text-bone text-right">{result.data.score}/{result.data.total}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-smoke">Issued</dt><dd className="font-bold text-bone text-right">{new Date(result.data.issued_at).toLocaleDateString()}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-smoke">Certificate ID</dt><dd className="font-mono text-xs text-amber text-right">{result.data.id}</dd></div>
            </dl>
          </div>
        )}

        {checked && result && !result.valid && (
          <div className="mt-6 rounded-xl border border-alert/30 bg-alert/5 p-6">
            <p className="font-display text-lg font-extrabold text-alert mb-2">✗ Not Found / Invalid</p>
            <p className="text-sm text-smoke">No certificate matches this ID. Check the spelling, or contact support@tigerslair.academy if you believe this is an error.</p>
          </div>
        )}
      </div>
    </div>
  );
}