import { useState } from "react";
import { api } from "../lib/api";
import { useStore } from "../lib/store";

export default function CounselingBook() {
  const { go, toast } = useStore();
  const [formData, setFormData] = useState({
    topic: "",
    description: "",
    format: "zoom",
    meetingLink: "",
    location: "",
    scheduledAt: "",
    duration: 60
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.bookCounseling({
        ...formData,
        scheduledAt: new Date(formData.scheduledAt).getTime()
      });
      toast("Session booked successfully!");
      go({ view: "mentorship-dashboard" });
    } catch (err: any) {
      toast(err.message || "Failed to book session");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-3xl font-extrabold text-bone mb-2">Book a Counseling Session</h1>
      <p className="text-smoke mb-8">Schedule a 1-on-1 session tailored to your needs.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-smoke mb-2">Topic</label>
          <input
            required
            className="w-full rounded-md border border-bone/10 bg-ink p-3 text-sm text-bone focus:border-amber focus:outline-none"
            placeholder="e.g., Career Transition, Code Review"
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-smoke mb-2">Description</label>
          <textarea
            required
            rows={3}
            className="w-full rounded-md border border-bone/10 bg-ink p-3 text-sm text-bone focus:border-amber focus:outline-none"
            placeholder="Briefly describe what you want to achieve in this session."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-smoke mb-2">Format</label>
            <select
              className="w-full rounded-md border border-bone/10 bg-ink p-3 text-sm text-bone focus:border-amber focus:outline-none"
              value={formData.format}
              onChange={(e) => setFormData({ ...formData, format: e.target.value })}
            >
              <option value="zoom">Zoom</option>
              <option value="meet">Google Meet</option>
              <option value="phone">Phone Call</option>
              <option value="in-person">In-Person</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-smoke mb-2">Duration (mins)</label>
            <input
              type="number"
              className="w-full rounded-md border border-bone/10 bg-ink p-3 text-sm text-bone focus:border-amber focus:outline-none"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            />
          </div>
        </div>

        {formData.format === "in-person" ? (
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-smoke mb-2">Location</label>
            <input
              required
              className="w-full rounded-md border border-bone/10 bg-ink p-3 text-sm text-bone focus:border-amber focus:outline-none"
              placeholder="e.g., Lagos, Yaba Tech Hub"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-smoke mb-2">Meeting Link (Optional)</label>
            <input
              className="w-full rounded-md border border-bone/10 bg-ink p-3 text-sm text-bone focus:border-amber focus:outline-none"
              placeholder="https://zoom.us/j/..."
              value={formData.meetingLink}
              onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-smoke mb-2">Date & Time</label>
          <input
            type="datetime-local"
            required
            className="w-full rounded-md border border-bone/10 bg-ink p-3 text-sm text-bone focus:border-amber focus:outline-none [color-scheme:dark]"
            value={formData.scheduledAt}
            onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full stripe-btn rounded-md bg-amber py-3 font-display text-sm font-extrabold uppercase tracking-widest text-ink disabled:opacity-50"
        >
          {submitting ? "Booking..." : "Confirm Booking"}
        </button>
      </form>
    </div>
  );
}