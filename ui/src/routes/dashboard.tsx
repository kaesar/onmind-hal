import { useState, useMemo, lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Play,
  Square,
  RotateCcw,
  RefreshCw,
  Database,
  Server,
  Shield,
  Zap,
  Box,
  Radio,
  Bell,
  Mail,
  Cloud,
  Lock,
  FileCode,
  List,
  Puzzle,
} from "lucide-react";
import type { ComponentType } from "react";
import { ThemeToggle } from "~/components/ThemeToggle";
import { LogViewer } from "~/components/LogViewer";
import { ContainersTable } from "~/components/ContainersTable";
import { ServicesSetEditor } from "~/components/ServicesSetEditor";
import { DropdownMenu, DropdownItem } from "~/components/DropdownMenu";

const FileEditor = lazy(() => import("~/components/FileEditor").then((m) => ({ default: m.FileEditor })));

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
  runtime: string;
}

function readServicesSet(): { id: string; name: string; container: string; icon: string; color: string }[] {
  try {
    const raw = localStorage.getItem("onmind-hal");
    if (!raw) return [];
    const data = JSON.parse(raw);
    return data.servicesSet || [];
  } catch {
    return [];
  }
}

const iconMap: Record<string, ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  postgresql: Database,
  redis: Server,
  rustfs: Box,
  kafka: Radio,
  tinyauth: Lock,
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
  onShowLogs,
  isPending,
}: {
  service: Service;
  onAction: (action: "start" | "stop" | "restart") => void;
  onShowLogs: (container: string) => void;
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
          <button
            onClick={() => onShowLogs(service.container)}
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition cursor-pointer hover:opacity-80 ${getStatusColor(service.status)}`}
            title={`View logs for ${service.container}`}
          >
            {service.status}
          </button>
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
  const [editorConfig, setEditorConfig] = useState<{
    title: string;
    filePath: string;
    apiEndpoint: string;
    mode?: "text" | "yaml" | "json";
  } | null>(null);
  const [logContainer, setLogContainer] = useState<string | null>(null);
  const [containersOpen, setContainersOpen] = useState(false);
  const [servicesSetOpen, setServicesSetOpen] = useState(false);
  const [customServices, setCustomServices] = useState(readServicesSet);

  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
  });

  const { data: containersData } = useQuery({
    queryKey: ["containers"],
    queryFn: async () => {
      const res = await fetch("/api/containers/");
      if (!res.ok) return { containers: [] };
      return res.json();
    },
    refetchInterval: 10000,
  });

  const allServices = useMemo(() => {
    const apiServices = data?.services || [];
    const containers: { name: string; state: string }[] = containersData?.containers || [];
    const containerMap = new Map(containers.map((c) => [c.name, c.state]));
    const custom: Service[] = customServices.map((s) => ({
      ...s,
      status: (containerMap.get(s.container) || "unknown") as Service["status"],
    }));
    return [...apiServices, ...custom];
  }, [data, customServices, containersData]);

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
      queryClient.invalidateQueries({ queryKey: ["containers"] });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["services"] });
        queryClient.invalidateQueries({ queryKey: ["containers"] });
      }, 6000);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["services"] });
        queryClient.invalidateQueries({ queryKey: ["containers"] });
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
    data?.services
      .filter((s) => s.status !== "running")
      .forEach((s) => mutation.mutate({ id: s.id, action: "start" }));
  };

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString()
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-blue-900 dark:text-blue-100">
            OnMind-HAL
          </h1>
          <p className="mt-1 text-sm text-blue-400 dark:text-blue-500">
            Container Services Dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu label="Actions">
            <DropdownItem
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["services"] })
              }
              icon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Refresh
            </DropdownItem>
            <DropdownItem
              onClick={handleStartAll}
              disabled={mutation.isPending}
              icon={<Play className="h-3.5 w-3.5" />}
            >
              Start All
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                setEditorConfig({
                  title: "Caddyfile Editor",
                  filePath: "~/ws/init/Caddyfile",
                  apiEndpoint: "/api/caddyfile",
                  mode: "groovy",
                });
                setEditorOpen(true);
              }}
              icon={<FileCode className="h-3.5 w-3.5" />}
            >
              Caddyfile
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                setEditorConfig({
                  title: "Cloudflared Config",
                  filePath: "~/ws/init/cloudflared/config.yml",
                  apiEndpoint: "/api/cloudflared",
                  mode: "yaml",
                });
                setEditorOpen(true);
              }}
              icon={<FileCode className="h-3.5 w-3.5" />}
            >
              Cloudflared
            </DropdownItem>
            <DropdownItem
              onClick={() => setServicesSetOpen(true)}
              icon={<Puzzle className="h-3.5 w-3.5" />}
            >
              Custom Services
            </DropdownItem>
            <DropdownItem
              onClick={() => setContainersOpen(true)}
              icon={<List className="h-3.5 w-3.5" />}
            >
              List Containers
            </DropdownItem>
          </DropdownMenu>
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
          {lastUpdated && (
            <div className="mb-4 text-xs text-blue-300 dark:text-blue-600">
              {data.runtime && (
                <span className="font-medium capitalize">{data.runtime}</span>
              )}{data.runtime && " - "}Last updated: {lastUpdated}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {allServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onAction={(action) => handleAction(service.id, action)}
                onShowLogs={(container) => setLogContainer(container)}
                isPending={mutation.isPending}
              />
            ))}
          </div>
        </>
      )}
      {editorConfig && (
        <Suspense fallback={null}>
          <FileEditor
            open={editorOpen}
            onClose={() => {
              setEditorOpen(false);
              setEditorConfig(null);
            }}
            title={editorConfig.title}
            filePath={editorConfig.filePath}
            apiEndpoint={editorConfig.apiEndpoint}
            mode={editorConfig.mode}
          />
        </Suspense>
      )}
      <LogViewer
        open={logContainer !== null}
        onClose={() => setLogContainer(null)}
        container={logContainer || ""}
      />
      <ContainersTable
        open={containersOpen}
        onClose={() => setContainersOpen(false)}
      />
      <ServicesSetEditor
        open={servicesSetOpen}
        onClose={() => setServicesSetOpen(false)}
        onSave={(services) => setCustomServices(services)}
      />
    </div>
  );
}
