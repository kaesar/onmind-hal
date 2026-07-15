import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Loader2, Terminal, RotateCcw } from "lucide-react";

export interface LogViewerProps {
  open: boolean;
  onClose: () => void;
  container: string;
}

export function LogViewer({ open, onClose, container }: LogViewerProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["logs", container],
    queryFn: async () => {
      const res = await fetch(`/api/logs?container=${encodeURIComponent(container)}&lines=300`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load logs");
      }
      return res.json();
    },
    enabled: open,
    refetchInterval: (query) => {
      if (!open || query.state.error) return false;
      return 6000;
    },
  });

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 flex h-[80vh] w-[80vw] max-w-5xl flex-col rounded-2xl border border-blue-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-blue-200 px-6 py-4 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50">
              <Terminal className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                Logs
              </h2>
              <p className="font-mono text-xs text-blue-400 dark:text-blue-500">
                {container}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm transition cursor-pointer hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm transition cursor-pointer hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
            >
              <X className="h-3.5 w-3.5" />
              Close
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-auto bg-slate-950 p-4">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-red-400">{error.message}</p>
            </div>
          ) : (
            <pre className="font-mono text-xs leading-relaxed text-green-400 whitespace-pre-wrap break-all">
              {data?.logs || "No logs available"}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
