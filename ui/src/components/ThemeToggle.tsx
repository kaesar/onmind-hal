import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("onmind-hal");
    let theme: string | undefined;
    if (raw) {
      try { theme = JSON.parse(raw).theme; } catch {}
    }
    const prefersDark =
      theme === "dark" ||
      (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    const raw = localStorage.getItem("onmind-hal");
    let obj: Record<string, unknown> = {};
    if (raw) { try { obj = JSON.parse(raw); } catch {} }
    obj.theme = next ? "dark" : "light";
    localStorage.setItem("onmind-hal", JSON.stringify(obj));
  };

  return (
    <button
      onClick={toggle}
      className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm transition cursor-pointer hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
      aria-label="Toggle dark mode"
    >
      {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
    </button>
  );
}
