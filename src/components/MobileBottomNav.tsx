import { useStore } from "../lib/store";
import { IconClaw, IconBook, IconBars, IconPaw } from "../components/Icons";

export default function MobileBottomNav() {
  const { route, go, user, setAuthOpen } = useStore();

  // Don't render if user is on admin pages or course editor
  if (
    route.view === "admin" ||
    route.view === "course-editor" ||
    route.view === "verify" ||
    route.view === "legal"
  ) {
    return null;
  }

  const isActive = (view: string, altView?: string) =>
    route.view === view || route.view === altView;

  const navItems = [
    {
      label: "Home",
      view: "home",
      icon: IconClaw,
      active: isActive("home"),
      action: () => go({ view: "home" }),
    },
    {
      label: "Courses",
      view: "courses",
      icon: IconBook,
      active: isActive("courses", "course"),
      action: () => go({ view: "courses" }),
    },
    {
      label: "Dashboard",
      view: "dashboard",
      icon: IconBars,
      active: isActive("dashboard", "settings"),
      action: () => {
        if (user) go({ view: "dashboard" });
        else setAuthOpen(true);
      },
    },
    {
      label: user ? "Profile" : "Sign In",
      view: "profile",
      icon: IconPaw,
      active: isActive("settings"),
      action: () => {
        if (user) go({ view: "settings" });
        else setAuthOpen(true);
      },
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] border-t border-bone/10 bg-ink/95 backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              onClick={item.action}
              className={`flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 transition-colors ${
                item.active
                  ? "text-amber"
                  : "text-smoke hover:text-bone"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {item.label}
              </span>
              {item.active && (
                <span className="absolute bottom-0 h-0.5 w-8 rounded-t bg-amber" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}