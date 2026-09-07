import { useState } from "react";
import { api } from "../lib/api";
import { useStore } from "../lib/store";

interface QuizQ { id: string; question: string; options: string[]; answer: number }

export default function QuizEditor({ courseId, quiz, onChanged }: { courseId: string; quiz: QuizQ[]; onChanged: () => void }) {
  const { toast } = useStore();
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, QuizQ>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newQ, setNewQ] = useState<QuizQ>({ id: "", question: "", options: ["", "", "", ""], answer: 0 });

  const draftOf = (q: QuizQ): QuizQ => drafts[q.id] || q;
  const patchDraft = (id: string, p: Partial<QuizQ>) =>
    setDrafts(prev => ({ ...prev, [id]: { ...(prev[id] || quiz.find(x => x.id === id) || ({} as QuizQ)), ...p } }));

  const saveQuestion = async (q: QuizQ) => {
    const d = draftOf(q);
    if (!d.question?.trim() || (d.options || []).some(o => !o?.trim())) return toast("Question text and all four options are required");
    setSavingId(q.id);
    try {
      await api.updateQuizQuestion(courseId, q.id, { question: d.question, options: d.options, answer: d.answer });
      toast("Question updated");
      setDrafts(prev => { const n = { ...prev }; delete n[q.id]; return n; });
      onChanged();
    } catch (e: any) { toast(e.message); } finally { setSavingId(null); }
  };

  const deleteQuestion = async (q: QuizQ) => {
    if (!confirm("Delete this quiz question? This cannot be undone.")) return;
    try {
      await api.deleteQuizQuestion(courseId, q.id);
      toast("Question deleted");
      onChanged();
    } catch (e: any) { toast(e.message); }
  };

  const addQuestion = async () => {
    if (!newQ.question.trim() || newQ.options.some(o => !o.trim())) return toast("Question text and all four options are required");
    try {
      await api.addQuizQuestion(courseId, { question: newQ.question, options: newQ.options, answer: newQ.answer, orderIndex: quiz.length });
      toast("Question added to gate quiz");
      setNewQ({ id: "", question: "", options: ["", "", "", ""], answer: 0 });
      onChanged();
    } catch (e: any) { toast(e.message); }
  };

  return (
    <div className="rounded-xl border border-bone/10 bg-coal p-6">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between text-left">
        <h2 className="font-display text-xl font-bold text-amber">Gate Quiz Editor</h2>
        <span className="text-bone">{open ? "▲" : "▼"} <span className="text-xs text-smoke ml-1">{quiz.length} questions</span></span>
      </button>

      {open && (
        <div className="mt-6 space-y-4">
          {quiz.length === 0 && <p className="text-sm text-smoke">No questions yet — add the first one below.</p>}

          {quiz.map((q, qi) => {
            const d = draftOf(q);
            return (
              <div key={q.id} className="rounded-lg border border-bone/5 bg-ink p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-smoke">Q{qi + 1}</span>
                  <button onClick={() => deleteQuestion(q)} className="text-xs text-alert hover:underline font-bold">Delete</button>
                </div>
                <textarea
                  rows={2}
                  className="w-full rounded border border-bone/10 bg-coal p-2 text-sm text-bone focus:border-amber outline-none"
                  value={d.question}
                  onChange={e => patchDraft(q.id, { question: e.target.value })}
                />
                <div className="space-y-2">
                  {(d.options || []).map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${q.id}`}
                        checked={d.answer === oi}
                        onChange={() => patchDraft(q.id, { answer: oi })}
                        className="h-4 w-4 accent-mint"
                        title="Mark as correct answer"
                      />
                      <input
                        className="flex-1 rounded border border-bone/10 bg-coal p-2 text-sm text-bone focus:border-amber outline-none"
                        value={opt}
                        onChange={e => {
                          const opts = [...(d.options || [])];
                          opts[oi] = e.target.value;
                          patchDraft(q.id, { options: opts });
                        }}
                        placeholder={`Option ${oi + 1}`}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-smoke">Select the radio button next to the correct option.</p>
                <button
                  onClick={() => saveQuestion(q)}
                  disabled={savingId === q.id}
                  className="rounded-md bg-mint px-4 py-2 text-xs font-bold uppercase tracking-widest text-ink hover:bg-mint/90 disabled:opacity-60"
                >
                  {savingId === q.id ? "Saving..." : "Save Changes"}
                </button>
              </div>
            );
          })}

          <div className="rounded-lg border border-dashed border-bone/20 p-4 space-y-3">
            <p className="font-display text-sm font-bold text-bone">Add New Question</p>
            <textarea
              rows={2}
              className="w-full rounded border border-bone/10 bg-coal p-2 text-sm text-bone focus:border-amber outline-none"
              value={newQ.question}
              onChange={e => setNewQ({ ...newQ, question: e.target.value })}
              placeholder="Question text..."
            />
            <div className="space-y-2">
              {newQ.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct-new"
                    checked={newQ.answer === oi}
                    onChange={() => setNewQ({ ...newQ, answer: oi })}
                    className="h-4 w-4 accent-mint"
                  />
                  <input
                    className="flex-1 rounded border border-bone/10 bg-coal p-2 text-sm text-bone focus:border-amber outline-none"
                    value={opt}
                    onChange={e => {
                      const opts = [...newQ.options];
                      opts[oi] = e.target.value;
                      setNewQ({ ...newQ, options: opts });
                    }}
                    placeholder={`Option ${oi + 1}`}
                  />
                </div>
              ))}
            </div>
            <button onClick={addQuestion} className="rounded-md bg-amber px-4 py-2 text-xs font-bold uppercase tracking-widest text-ink hover:bg-amber/90">
              Add Question
            </button>
          </div>
        </div>
      )}
    </div>
  );
}