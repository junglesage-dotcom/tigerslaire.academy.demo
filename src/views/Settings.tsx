import { useState } from "react";
import { api } from "../lib/api";
import { useStore } from "../lib/store";

export default function Settings() {
  const { user, toast, go, linkTelegram, unlinkTelegram } = useStore();
  
  // Profile state
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <p className="text-smoke">Please sign in to access settings.</p>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    if (!name.trim() || !email.trim()) {
      toast("Name and email are required");
      return;
    }
    setIsSavingProfile(true);
    try {
      await api.updateProfile({ name, email });
      toast("Profile updated successfully!");
    } catch (e: any) {
      toast(e.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast("All password fields are required");
      return;
    }
    if (newPassword.length < 6) {
      toast("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast("New passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      toast("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      toast(e.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleConnectTelegram = () => {
    const initData = (window as any).Telegram?.WebApp?.initData;
    if (initData) {
      linkTelegram(initData);
    } else {
      window.open(`https://t.me/jsagebutlerbot?start=link_${user.id}`, '_blank');
      toast("Please start a chat with the bot to complete linking.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-bone">My Account</h1>
          <p className="mt-1 text-sm text-smoke">Manage your profile, security, and integrations.</p>
        </div>
        <button
          onClick={() => go({ view: "dashboard" })}
          className="rounded-md border border-bone/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-bone hover:bg-bone/5"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="space-y-8">
        {/* Profile Section */}
        <section className="rounded-xl border border-bone/10 bg-coal p-6">
          <h2 className="font-display text-xl font-bold text-amber mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-smoke mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-bone/15 bg-ink px-3 py-2 text-bone focus:border-amber focus:outline-none"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-smoke mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-bone/15 bg-ink px-3 py-2 text-bone focus:border-amber focus:outline-none"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-smoke mb-1">Account Role</label>
              <input
                type="text"
                value={user.role}
                disabled
                className="w-full rounded-md border border-bone/15 bg-ink/50 px-3 py-2 text-smoke cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-smoke mb-1">Member Since</label>
              <input
                type="text"
                value={new Date(user.joined_at).toLocaleDateString()}
                disabled
                className="w-full rounded-md border border-bone/15 bg-ink/50 px-3 py-2 text-smoke cursor-not-allowed"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="w-full rounded-md bg-amber py-2.5 text-xs font-bold uppercase tracking-widest text-ink hover:bg-amber/90 disabled:opacity-50 transition-colors"
            >
              {isSavingProfile ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </section>

        {/* Password Section */}
        <section className="rounded-xl border border-bone/10 bg-coal p-6">
          <h2 className="font-display text-xl font-bold text-amber mb-4">Change Password</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-smoke mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-md border border-bone/15 bg-ink px-3 py-2 text-bone focus:border-amber focus:outline-none"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-smoke mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-md border border-bone/15 bg-ink px-3 py-2 text-bone focus:border-amber focus:outline-none"
                placeholder="Minimum 6 characters"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-smoke mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border border-bone/15 bg-ink px-3 py-2 text-bone focus:border-amber focus:outline-none"
                placeholder="Re-enter new password"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="w-full rounded-md bg-tgsky py-2.5 text-xs font-bold uppercase tracking-widest text-ink hover:bg-tgsky/90 disabled:opacity-50 transition-colors"
            >
              {isChangingPassword ? "Changing..." : "Change Password"}
            </button>
          </div>
        </section>

        {/* Telegram Integration Section */}
        <section className="rounded-xl border border-bone/10 bg-coal p-6">
          <h2 className="font-display text-xl font-bold text-amber mb-4">Telegram Integration</h2>
          <p className="text-sm text-smoke mb-4">
            Link your Telegram account to receive daily lesson drops, session reminders, and access the community bot.
          </p>
          
          {user.telegram_id ? (
            <div className="rounded-lg border border-mint/30 bg-mint/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-mint mb-1">✓ Connected</p>
                  <p className="text-sm text-bone">Telegram ID: {user.telegram_id}</p>
                </div>
                <button
                  onClick={async () => {
                    await unlinkTelegram();
                  }}
                  className="rounded-md border border-alert/30 px-4 py-2 text-xs font-bold uppercase tracking-widest text-alert hover:bg-alert/10 transition-colors"
                >
                  Unlink
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleConnectTelegram}
              className="w-full rounded-md bg-tgsky py-2.5 text-xs font-bold uppercase tracking-widest text-ink hover:bg-tgsky/90 transition-colors"
            >
              Link Telegram Account
            </button>
          )}
        </section>

        {/* Notification Preferences (Placeholder) */}
        <section className="rounded-xl border border-bone/10 bg-coal p-6 opacity-60">
          <h2 className="font-display text-xl font-bold text-amber mb-4">Notification Preferences</h2>
          <p className="text-sm text-smoke mb-4">
            Coming soon: Customize which notifications you receive via email and Telegram.
          </p>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-not-allowed">
              <input type="checkbox" disabled className="h-4 w-4 accent-amber" />
              <span className="text-sm text-smoke">Email me about new courses</span>
            </label>
            <label className="flex items-center gap-3 cursor-not-allowed">
              <input type="checkbox" disabled className="h-4 w-4 accent-amber" />
              <span className="text-sm text-smoke">Send me weekly progress summaries</span>
            </label>
            <label className="flex items-center gap-3 cursor-not-allowed">
              <input type="checkbox" disabled className="h-4 w-4 accent-amber" />
              <span className="text-sm text-smoke">Notify me about community meetups</span>
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}