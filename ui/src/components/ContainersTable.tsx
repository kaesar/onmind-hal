import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  Loader2,
  List,
  Search,
  Play,
  Square,
  RotateCcw,
} from "lucide-react";

export interface ContainersTableProps {
  open: boolean;
  onClose: () => void;
}

interface Container {
  id: string;
  name: string;
  image: string;
  status: string;
  state: "running" | "stopped" | "restarting" | "unknown";
  ports: string;
}

function getStateColor(state: Container["state"]) {
  switch (state) {
    case "running":
      return "bg-emerald-500/20 text-emerald-600 border-emerald-500/30 dark:text-emerald-400";
    case "stopped":
      return "bg-red-500/20 text-red-600 border-red-500/30 dark:text-red-400";
    case "restarting":
      return "bg-amber-500/20 text-amber-600 border-amber-500/30 dark:text-amber-400";
    default:
      return "bg-blue-500/20 text-blue-600 border-blue-500/30 dark:text-blue-400";
  }
}

function getStateDot(state: Container["state"]) {
  switch (state) {
    case "running":
      return "bg-emerald-400";
    case "stopped":
      return "bg-red-400";
    case "restarting":
      return "bg-amber-400 animate-pulse";
    default:
      return "bg-blue-400";
  }
}

export function ContainersTable({ open, onClose }: ContainersTableProps) {
  const [filter, setFilter] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["containers"],
    queryFn: async () => {
      const res = await fetch("/api/containers/");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load containers");
      }
      return res.json();
    },
    enabled: open,
    refetchInterval: (query) => {
      if (!open || query.state.error) return false;
      return 10000;
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

  useEffect(() => {
    if (!open) setFilter("");
  }, [open]);

  const containers: Container[] = data?.containers || [];
  const filtered = filter
    ? containers.filter(
        (c) =>
          c.name.toLowerCase().includes(filter.toLowerCase()) ||
          c.image.toLowerCase().includes(filter.toLowerCase())
      )
    : containers;

  const running = containers.filter((c) => c.state === "running").length;
  const stopped = containers.filter((c) => c.state === "stopped").length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 flex h-[85vh] w-[90vw] max-w-6xl flex-col rounded-2xl border border-blue-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-blue-200 px-6 py-4 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50">
              <List className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                Containers
              </h2>
              <p className="text-xs text-blue-400 dark:text-blue-500">
                {running} running &middot; {stopped} stopped &middot; {containers.length} total
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

        {/* Search */}
        <div className="border-b border-blue-100 px-6 py-3 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-300 dark:text-blue-600" />
            <input
              type="text"
              placeholder="Filter by name or image..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full rounded-lg border border-blue-200 bg-blue-50/50 py-2 pl-10 pr-4 text-sm text-blue-900 placeholder-blue-300 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 dark:border-slate-600 dark:bg-slate-800 dark:text-blue-100 dark:placeholder-blue-600 dark:focus:border-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-red-500 dark:text-red-400">
                {error.message}
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-blue-400 dark:text-blue-500">
                {filter ? "No containers match the filter" : "No containers found"}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-blue-100 bg-blue-50/80 text-xs font-medium uppercase tracking-wider text-blue-500 backdrop-blur dark:border-slate-700 dark:bg-slate-800/80 dark:text-blue-400">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Image</th>
                  <th className="px-6 py-3">Ports</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50 dark:divide-slate-800">
                {filtered.map((container) => (
                  <tr
                    key={container.id}
                    className="transition hover:bg-blue-50/50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-3">
                      <span className="font-medium text-blue-900 dark:text-blue-100">
                        {container.name}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="max-w-xs truncate font-mono text-xs text-blue-500 dark:text-blue-400">
                        {container.image}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-mono text-xs text-blue-500 dark:text-blue-400">
                        {container.ports || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${getStateDot(container.state)}`}
                        />
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getStateColor(container.state)}`}
                        >
                          {container.state}
                        </span>
                        <span className="text-xs text-blue-400 dark:text-blue-500">
                          {container.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-mono text-xs text-blue-400 dark:text-blue-500">
                        {container.id}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
