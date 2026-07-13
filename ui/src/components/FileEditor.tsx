import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import pkg from "react-ace";
const AceEditor = pkg.default;
import { X, Save, FileCode, Loader2 } from "lucide-react";

import "ace-builds/src-noconflict/mode-text";
import "ace-builds/src-noconflict/mode-yaml";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/mode-groovy";
import "ace-builds/src-noconflict/theme-chrome";
import "ace-builds/src-noconflict/theme-twilight";

export interface FileEditorProps {
  open: boolean;
  onClose: () => void;
  title: string;
  filePath: string;
  apiEndpoint: string;
  mode?: "text" | "yaml" | "json";
}

export function FileEditor({
  open,
  onClose,
  title,
  filePath,
  apiEndpoint,
  mode = "text",
}: FileEditorProps) {
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [success, setSuccess] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("onmind-hal");
    let theme: string | undefined;
    if (raw) {
      try { theme = JSON.parse(raw).theme; } catch {}
    }
    if (theme) {
      setDarkMode(theme === "dark");
    } else {
      setDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["file-editor", apiEndpoint],
    queryFn: async () => {
      const res = await fetch(apiEndpoint);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load file");
      }
      return res.json();
    },
    enabled: open,
  });

  useEffect(() => {
    if (data?.content !== undefined) {
      setContent(data.content);
      setOriginalContent(data.content);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (newContent: string) => {
      const res = await fetch(apiEndpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save file");
      }
      return res.json();
    },
    onSuccess: () => {
      setOriginalContent(content);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const hasChanges = content !== originalContent;

  const handleSave = () => {
    saveMutation.mutate(content);
  };

  const handleClose = useCallback(() => {
    if (hasChanges) {
      if (!window.confirm("You have unsaved changes. Discard them?")) {
        return;
      }
    }
    onClose();
  }, [hasChanges, onClose]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (hasChanges && !saveMutation.isPending) {
          handleSave();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, hasChanges, saveMutation.isPending, handleClose]);

  if (!open) return null;

  const errorMessage = error?.message || saveMutation.error?.message || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative z-10 flex h-[90vh] w-[90vw] max-w-6xl flex-col rounded-2xl border border-blue-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-blue-200 px-6 py-4 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50">
              <FileCode className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                {title}
              </h2>
              <p className="font-mono text-xs text-blue-400 dark:text-blue-500">
                {filePath}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {success && (
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Saved
              </span>
            )}
            {errorMessage && (
              <span className="max-w-xs truncate text-sm font-medium text-red-600 dark:text-red-400">
                {errorMessage}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending || !hasChanges}
              className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm transition cursor-pointer hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save
            </button>
            <button
              onClick={handleClose}
              className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm transition cursor-pointer hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
            >
              <X className="h-3.5 w-3.5" />
              Close
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : error && !content ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-red-500 dark:text-red-400">
                {error.message}
              </p>
            </div>
          ) : (
            <AceEditor
              mode={mode}
              theme={darkMode ? "twilight" : "chrome"}
              onChange={setContent}
              value={content}
              name="file-editor"
              width="100%"
              height="100%"
              fontSize={14}
              showPrintMargin={false}
              showGutter={true}
              highlightActiveLine={true}
              setOptions={{
                showLineNumbers: true,
                tabSize: 4,
                useSoftTabs: true,
              }}
              style={{ borderRadius: "0 0 1rem 1rem" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
