import { useState, useEffect, useCallback } from "react";
import { X, Save, Plus, Trash2, CheckCircle2, AlertCircle, Puzzle } from "lucide-react";

export interface ServicesSetEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (services: Service[]) => void;
}

export interface Service {
  id: string;
  name: string;
  container: string;
  icon: string;
  color: string;
}

const STORAGE_KEY = "onmind-hal";

function readServicesSet(): Service[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return data.servicesSet || [];
  } catch {
    return [];
  }
}

function writeServicesSet(services: Service[]) {
  const raw = localStorage.getItem(STORAGE_KEY);
  let data: Record<string, unknown> = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = {};
    }
  }
  data.servicesSet = services;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function createEmpty(): Service {
  return {
    id: `custom-${Date.now()}`,
    name: "New Service",
    container: "new-service",
    icon: "",
    color: "#6366f1",
  };
}

export function ServicesSetEditor({ open, onClose, onSave }: ServicesSetEditorProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      const loaded = readServicesSet();
      setServices(loaded);
      setJsonText(JSON.stringify(loaded, null, 2));
      setJsonMode(false);
      setJsonError(null);
      setSuccess(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const validateJson = useCallback((text: string): boolean => {
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        setJsonError("Root must be a JSON array");
        return false;
      }
      for (let i = 0; i < parsed.length; i++) {
        const s = parsed[i];
        if (!s.id || !s.name || !s.container) {
          setJsonError(`Item ${i}: missing required fields (id, name, container)`);
          return false;
        }
      }
      setJsonError(null);
      return true;
    } catch (e) {
      setJsonError(`Invalid JSON: ${(e as Error).message}`);
      return false;
    }
  }, []);

  const handleSave = () => {
    let toSave: Service[];
    if (jsonMode) {
      if (!validateJson(jsonText)) return;
      toSave = JSON.parse(jsonText);
    } else {
      toSave = services;
    }
    writeServicesSet(toSave);
    onSave(toSave);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const handleAdd = () => {
    const updated = [...services, createEmpty()];
    setServices(updated);
    setJsonText(JSON.stringify(updated, null, 2));
  };

  const handleRemove = (index: number) => {
    const updated = services.filter((_, i) => i !== index);
    setServices(updated);
    setJsonText(JSON.stringify(updated, null, 2));
  };

  const handleFieldChange = (index: number, field: keyof Service, value: string) => {
    const updated = services.map((s, i) => (i === index ? { ...s, [field]: value } : s));
    setServices(updated);
    setJsonText(JSON.stringify(updated, null, 2));
  };

  const switchToForm = () => {
    if (validateJson(jsonText)) {
      setServices(JSON.parse(jsonText));
      setJsonMode(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex h-[85vh] w-[90vw] max-w-3xl flex-col rounded-2xl border border-blue-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-blue-200 px-6 py-4 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50">
              <Puzzle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                Custom Services
              </h2>
              <p className="text-xs text-blue-400 dark:text-blue-500">
                Add extra services to your dashboard
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {success && (
              <span className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Saved
              </span>
            )}
            {jsonError && (
              <span className="flex max-w-xs items-center gap-1 truncate text-sm font-medium text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" /> {jsonError}
              </span>
            )}
            <button
              onClick={() => (jsonMode ? switchToForm() : setJsonMode(true))}
              className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm transition cursor-pointer hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
            >
              {jsonMode ? "Form" : "JSON"}
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm transition cursor-pointer hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
            >
              <Save className="h-3.5 w-3.5" />
              Save
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

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {jsonMode ? (
            <textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setJsonError(null);
              }}
              className="h-full w-full resize-none rounded-xl border border-blue-200 bg-blue-50/50 p-4 font-mono text-sm text-blue-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 dark:border-slate-600 dark:bg-slate-800 dark:text-blue-100 dark:focus:border-blue-500"
              spellCheck={false}
            />
          ) : (
            <div className="space-y-3">
              {services.length === 0 && (
                <p className="py-8 text-center text-sm text-blue-400 dark:text-blue-500">
                  No custom services yet. Click "Add" to create one.
                </p>
              )}
              {services.map((service, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="grid flex-1 grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-blue-500 dark:text-blue-400">Name</label>
                      <input
                        value={service.name}
                        onChange={(e) => handleFieldChange(index, "name", e.target.value)}
                        placeholder="e.g. MongoDB"
                        className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm text-blue-900 outline-none focus:border-blue-400 dark:border-slate-600 dark:bg-slate-900 dark:text-blue-100"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-blue-500 dark:text-blue-400">Container</label>
                      <input
                        value={service.container}
                        onChange={(e) => handleFieldChange(index, "container", e.target.value)}
                        placeholder="e.g. mongo"
                        className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 font-mono text-sm text-blue-900 outline-none focus:border-blue-400 dark:border-slate-600 dark:bg-slate-900 dark:text-blue-100"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-blue-500 dark:text-blue-400">ID</label>
                      <input
                        value={service.id}
                        onChange={(e) => handleFieldChange(index, "id", e.target.value)}
                        placeholder="e.g. mongodb"
                        className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 font-mono text-sm text-blue-900 outline-none focus:border-blue-400 dark:border-slate-600 dark:bg-slate-900 dark:text-blue-100"
                      />
                    </div>
                  </div>
                  {/* Color picker — not implemented yet, kept in data model as default
                  <input
                    type="color"
                    value={service.color}
                    onChange={(e) => handleFieldChange(index, "color", e.target.value)}
                    className="h-8 w-8 shrink-0 cursor-pointer rounded-lg border-0"
                    title="Color"
                  />
                  */}
                  <button
                    onClick={() => handleRemove(index)}
                    className="shrink-0 rounded-lg p-2 text-red-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={handleAdd}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-200 py-3 text-sm font-medium text-blue-400 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:hover:border-blue-500 dark:hover:text-blue-400"
              >
                <Plus className="h-4 w-4" />
                Add Service
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
