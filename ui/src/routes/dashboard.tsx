import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Play,
  Square,
  RotateCcw,
  RefreshCw,
  Database,
  Server,
  HardDrive,
  Globe,
  Cpu,
  Shield,
  Layers,
  Zap,
  Box,
  Radio,
  Bell,
  Mail,
  Cloud,
  Lock,
  FileCode,
} from "lucide-react";
import type { ComponentType } from "react";
import { ThemeToggle } from "~/components/ThemeToggle";
import { FileEditor } from "~/components/FileEditor";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

interface Service {
  id: string;
  name: string;
  container: string;
  icon: string;
  status: "running" | "stopped" | "restarting" | "unknown";
  color: string;
}

interface ServicesResponse {
  services: Service[];
}

const iconMap: Record<string, ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  postgresql: Database,
  redis: Server,
  rustfs: Box,
  kafka: Radio,
  pocketid: Lock,
  ntfy: Bell,
  mailpit: Mail,
  cloudflared: Cloud,
  caddy: Shield,
  default: Zap,
};

function getServiceIcon(iconName: string): ComponentType<{ className?: string; style?: React.CSSProperties }> {
  return iconMap[iconName] || iconMap.default;
}

function getStatusColor(status: Service["status"]) {
  switch (status) {
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

function getStatusDot(status: Service["status"]) {
  switch (status) {
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

async function fetchServices(): Promise<ServicesResponse> {
  const res = await fetch("/api/services");
  if (!res.ok) throw new Error("Failed to fetch services");
  return res.json();
}

async function executeAction(
  id: string,
  action: "start" | "stop" | "restart"
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/services/${id}/${action}`, { method: "POST" });
  if (!res.ok) throw new Error(`Failed to ${action} service`);
  return res.json();
}

function ServiceCard({
  service,
  onAction,
  isPending,
}: {
  service: Service;
  onAction: (action: "start" | "stop" | "restart") => void;
  isPending: boolean;
}) {
  const Icon = getServiceIcon(service.icon);

  return (
    <div className="group relative rounded-2xl border border-blue-200 bg-white p-6 shadow-sm transition-all hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-500 dark:hover:bg-slate-700 dark:hover:shadow-lg dark:hover:shadow-blue-500/5">
      <div className="flex items-start justify-between">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${service.color}15` }}
        >
          <Icon className="h-7 w-7" style={{ color: service.color }} />
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${getStatusDot(service.status)}`}
          />
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(service.status)}`}
          >
            {service.status}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">{service.name}</h3>
        <p className="mt-0.5 font-mono text-sm text-blue-400 dark:text-blue-500">
          {service.container}
        </p>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          onClick={() => onAction("start")}
          disabled={isPending || service.status === "running"}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600 transition cursor-pointer hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-900 dark:hover:text-emerald-200"
        >
          <Play className="h-3.5 w-3.5" />
          Start
        </button>
        <button
          onClick={() => onAction("stop")}
          disabled={isPending || service.status === "stopped"}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition cursor-pointer hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 dark:hover:text-red-200"
        >
          <Square className="h-3.5 w-3.5" />
          Stop
        </button>
        <button
          onClick={() => onAction("restart")}
          disabled={isPending}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-600 transition cursor-pointer hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-900 dark:hover:text-amber-200"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restart
        </button>
      </div>
    </div>
  );
}

function Dashboard() {
  const queryClient = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
  });

  const mutation = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "start" | "stop" | "restart";
    }) => executeAction(id, action),
    onMutate: async ({ id, action }) => {
      await queryClient.cancelQueries({ queryKey: ["services"] });
      const previous = queryClient.getQueryData<ServicesResponse>([
        "services",
      ]);
      queryClient.setQueryData<ServicesResponse>(["services"], (old) => {
        if (!old) return old;
        return {
          ...old,
          services: old.services.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status: action === "stop" ? "stopped" : "restarting",
                }
              : s
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["services"], context.previous);
      }
    },
    onSettled: () => {
      // Recheck after 6s and 12s to catch state changes
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["services"] });
      }, 6000);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["services"] });
      }, 12000);
    },
  });

  const handleAction = (
    id: string,
    action: "start" | "stop" | "restart"
  ) => {
    mutation.mutate({ id, action });
  };

  const handleStartAll = () => {
    if (!data) return;
    data.services
      .filter((s) => s.status !== "running")
      .forEach((s) => mutation.mutate({ id: s.id, action: "start" }));
  };

  const now = new Date().toLocaleTimeString();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-blue-900 dark:text-blue-100">
            HAL-UI
          </h1>
          <p className="mt-1 text-sm text-blue-400 dark:text-blue-500">
            Service dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["services"] })
            }
            className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm transition cursor-pointer hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            onClick={handleStartAll}
            disabled={mutation.isPending}
            className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm transition cursor-pointer hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
          >
            <Play className="h-3.5 w-3.5" />
            Start All
          </button>
          <button
            onClick={() => setEditorOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm transition cursor-pointer hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
          >
            <FileCode className="h-3.5 w-3.5" />
            Caddyfile
          </button>
          <ThemeToggle />
        </div>
      </div>

      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          Error loading services. Make sure the API server is running.
        </div>
      )}

      {data && (
        <>
          <div className="mb-4 text-xs text-blue-300 dark:text-blue-600">
            Last updated: {now}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onAction={(action) => handleAction(service.id, action)}
                isPending={mutation.isPending}
              />
            ))}
          </div>
        </>
      )}
      <FileEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title="Caddyfile Editor"
        filePath="~/ws/init/Caddyfile"
        apiEndpoint="/api/caddyfile"
        mode="groovy"
      />
    </div>
  );
}
