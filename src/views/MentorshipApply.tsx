import { useEffect, useState } from "react";
import { useStore } from "../lib/store";
import { api } from "../lib/api";

export default function MentorshipApply() {
  const { go, toast } = useStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    categoryId: "",
    customCategory: "",
    goals: "",
    experience: "",
    availability: "",
    preferredFormat: "zoom"
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getCategories().then(res => setCategories(res.data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) return toast("Please select a category");
    if (formData.categoryId === "custom" && !formData.customCategory) return toast("Please describe your custom needs");
    
    setSubmitting(true);
    try {
      await api.applyMentorship(formData);
      toast("Application submitted successfully!");
      go({ view: "mentorship-dashboard" });
    } catch (err: any) {
      toast(err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-3xl font-extrabold text-bone mb-2">Apply for Mentorship</h1>
      <p className="text-smoke mb-8">Tell us about your goals and we'll match you with the right guide.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-smoke mb-2">Category</label>
          <select
            required
            className="w-full rounded-md border border-bone/10 bg-ink p-3 text-sm text-bone focus:border-amber focus:outline-none"
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {formData.categoryId === "custom" && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-smoke mb-2">Describe Your Custom Needs</label>
            <input
              required
              className="w-full rounded-md border border-bone/10 bg-ink p-3 text-sm text-bone focus:border-amber focus:outline-none"
              placeholder="e.g., AI ethics, blockchain development, etc."
              value={formData.customCategory}
              onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-smoke mb-2">Your Goals</label>
          <textarea
            required
            rows={3}
            className="w-full rounded-md border border-bone/10 bg-ink p-3 text-sm text-bone focus:border-amber focus:outline-none"
            placeholder="What do you want to achieve through this mentorship?"
            value={formData.goals}
            onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-smoke mb-2">Your Experience</label>
          <textarea
            required
            rows={3}
            className="w-full rounded-md border border-bone/10 bg-ink p-3 text-sm text-bone focus:border-amber focus:outline-none"
            placeholder="Briefly describe your current skill level and background."
            value={formData.experience}
            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-smoke mb-2">Availability</label>
          <textarea
            required
            rows={2}
            className="w-full rounded-md border border-bone/10 bg-ink p-3 text-sm text-bone focus:border-amber focus:outline-none"
            placeholder="e.g., Weekdays after 6 PM, weekends"
            value={formData.availability}
            onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-smoke mb-2">Preferred Format</label>
          <select
            className="w-full rounded-md border border-bone/10 bg-ink p-3 text-sm text-bone focus:border-amber focus:outline-none"
            value={formData.preferredFormat}
            onChange={(e) => setFormData({ ...formData, preferredFormat: e.target.value })}
          >
            <option value="zoom">Zoom</option>
            <option value="meet">Google Meet</option>
            <option value="phone">Phone Call</option>
            <option value="in-person">In-Person</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full stripe-btn rounded-md bg-amber py-3 font-display text-sm font-extrabold uppercase tracking-widest text-ink disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
}