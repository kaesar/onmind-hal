import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface DropdownMenuProps {
  label: string;
  children: React.ReactNode;
}

export function DropdownMenu({ label, children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm transition cursor-pointer hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
      >
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-48 rounded-xl border border-blue-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}

export function DropdownItem({ onClick, icon, children, disabled }: DropdownItemProps) {
  return (
    <button
      onClick={() => {
        onClick();
      }}
      disabled={disabled}
      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-blue-300 dark:hover:bg-slate-700"
    >
      {icon}
      {children}
    </button>
  );
}
