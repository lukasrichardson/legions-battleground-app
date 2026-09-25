"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/client/ui/button";
import { Input } from "@/client/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/client/ui/card";

type AliasResponse = { alias: string | null; error?: string };

type AliasEditorProps = {
  onClose: () => void;
  onSaved: (alias: string | null) => void;
};

export default function AliasEditor({ onClose, onSaved }: AliasEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [alias, setAlias] = useState("");
  const [savedAlias, setSavedAlias] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    const loadAlias = async () => {
      try {
        const response = await fetch("/api/me/alias");
        const data = await response.json() as AliasResponse;
        if (response.ok && data.alias) {
          setAlias(data.alias);
          setSavedAlias(data.alias);
        }
      } finally {
        setLoading(false);
      }
    };
    void loadAlias();
  }, []);

  useEffect(() => {
    const closeOnOutsidePointerDown = (event: PointerEvent) => {
      if (editorRef.current && !editorRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointerDown);
  }, [onClose]);

  const saveAlias = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/me/alias", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias }),
      });
      const data = await response.json() as AliasResponse;
      if (!response.ok) {
        setError(data.error ?? "Could not save username.");
        return;
      }
      const saved = data.alias ?? "";
      setAlias(saved);
      setSavedAlias(saved);
      onSaved(saved);
      onClose();
    } catch {
      setError("Could not save username. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const deleteAlias = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/me/alias", { method: "DELETE" });
      if (!response.ok) {
        setError("Could not remove username. Please try again.");
        return;
      }
      onSaved(null);
      onClose();
    } catch {
      setError("Could not remove username. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      ref={editorRef}
      role="dialog"
      aria-label="Set Battleground username"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          onClose();
        }
      }}
      className="absolute right-0 top-full mt-2 w-[min(22rem,calc(100vw-1rem))] overflow-hidden border-white/20 bg-slate-900/95 text-white shadow-2xl backdrop-blur-sm"
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b border-white/10 p-4 pb-3">
        <div className="flex items-center gap-3">
          <div>
            <CardTitle className="text-base text-white">Battleground username</CardTitle>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white" aria-label="Close username editor">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </CardHeader>
      <CardContent className="p-4 pt-4">
        <form className="space-y-3" onSubmit={saveAlias}>
          <label className="block text-sm font-semibold text-white">
            Username
          <Input
            value={alias}
            onChange={(event) => setAlias(event.target.value)}
            disabled={loading || saving}
            maxLength={24}
            autoComplete="nickname"
            placeholder="Choose your public name"
            className="mt-2 h-10 border-white/20 bg-white/10 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
          />
          </label>
          <p className="text-xs leading-relaxed text-gray-400">3–24 letters, numbers, hyphens, or underscores. Usernames are case-insensitively unique.</p>
          {error && <p className="rounded-lg border border-red-500/30 bg-red-500/20 p-3 text-sm font-medium text-red-300">{error}</p>}
          <Button type="submit" disabled={loading || saving || !alias.trim()} className="h-10 w-full bg-gradient-to-r from-blue-600 to-blue-700 font-semibold text-white hover:from-blue-700 hover:to-blue-800">
            {saving ? "Saving…" : savedAlias ? "Update username" : "Set username"}
          </Button>
        </form>
      </CardContent>
      {savedAlias && (
        <CardFooter className="block border-t border-white/10 p-4 pt-3">
          {confirmingDelete ? (
            <div className="rounded-lg border border-red-400/30 bg-red-950/40 p-3 text-xs">
              <p className="text-red-100">Remove this username and use your provider name instead?</p>
              <div className="mt-2 flex justify-end gap-2">
                <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => setConfirmingDelete(false)}>Cancel</Button>
                <Button type="button" size="sm" variant="destructive" disabled={saving} onClick={deleteAlias}>Remove username</Button>
              </div>
            </div>
          ) : (
            <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => setConfirmingDelete(true)} className="w-full text-red-300 hover:bg-red-950/40 hover:text-red-100">
              Remove username
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
