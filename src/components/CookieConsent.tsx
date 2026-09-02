import { useEffect, useState } from "react";
import { IconClaw } from "./Icons";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem("tigerslair_cookie_consent");
    if (!hasConsented) {
      // Show banner after a short delay for a smooth entrance
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("tigerslair_cookie_consent", "true");
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem("tigerslair_cookie_consent", "false");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6">
      <div className="mx-auto max-w-4xl rounded-xl border border-bone/10 bg-coal/95 backdrop-blur-md shadow-2xl p-5 sm:p-6 animate-in slide-in-from-bottom-5 fade-in duration-500">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber/10 text-amber">
            <IconClaw className="h-5 w-5" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-display text-base font-bold text-bone mb-1">
              We Value Your Privacy
            </h3>
            <p className="text-sm text-smoke leading-relaxed">
              We use essential cookies to ensure the platform functions correctly, and analytics cookies to help us improve your learning experience. 
              By clicking "Accept All", you consent to our use of cookies. Read our{" "}
              <button className="text-amber underline hover:text-amber/80 transition-colors">
                Cookie Policy
              </button>{" "}
              for more details.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
            <button
              onClick={handleDecline}
              className="rounded-md border border-bone/20 px-5 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-bone hover:bg-bone/5 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="stripe-btn rounded-md bg-amber px-5 py-2.5 font-display text-xs font-extrabold uppercase tracking-widest text-ink transition-transform hover:-translate-y-0.5"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}