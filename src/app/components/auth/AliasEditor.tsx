"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/client/ui/button";
import { Input } from "@/client/ui/input";
import { InlineStatus } from "@/client/ui/inline-status";
import AppIcon from "../AppIcon";
import LoadingState from "../LoadingState";
import Modal from "../Modals/Modal";

type AliasResponse = { alias: string | null; error?: string };

type AliasEditorProps = {
  onClose: () => void;
  onSaved: (alias: string | null) => void;
};

export default function AliasEditor({ onClose, onSaved }: AliasEditorProps) {
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
        } else if (!response.ok) {
          setError(data.error ?? "Could not load username. You can still set one below.");
        }
      } catch {
        setError("Could not load username. You can still set one below.");
      } finally {
        setLoading(false);
      }
    };
    void loadAlias();
  }, []);

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

  return <Modal open closeModal={onClose} ariaLabel="Set Battleground username" closeOnBackdrop={!confirmingDelete && !saving} closeOnEscape={!confirmingDelete && !saving}
    modalHeader={
      <div className="flex min-h-14 flex-row items-center justify-between gap-3 py-2">
        <div className="flex items-center gap-3">
          <div>
          <h2 className="text-base font-semibold tracking-wide text-white">Battleground username</h2>
          </div>
        </div>
        <button type="button" onClick={onClose} disabled={confirmingDelete || saving} className="grid size-11 cursor-pointer place-items-center border border-transparent text-slate-400 transition-colors hover:border-sky-200/35 hover:bg-blue-400/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Close username editor">
          <AppIcon name="close" size={16} />
        </button>
      </div>}
    modalContent={<>
        {loading ? <LoadingState label="Loading username…" className="min-h-0 py-5" /> : <form className="space-y-3" onSubmit={saveAlias}>
          <label className="block text-sm font-semibold text-white">
            Username
          <Input
            value={alias}
            onChange={(event) => setAlias(event.target.value)}
            disabled={loading || saving}
            maxLength={24}
            autoComplete="nickname"
            placeholder="Choose your public name"
            className="mt-2 h-10 border-sky-200/20 bg-slate-950/45 text-white placeholder:text-slate-500 focus:border-sky-300/70 focus:ring-sky-300/20"
          />
          </label>
          <p className="text-xs leading-relaxed text-gray-400">3–24 letters, numbers, hyphens, or underscores. Usernames are case-insensitively unique.</p>
          {error && <InlineStatus variant="error">{error}</InlineStatus>}
          <Button type="submit" disabled={loading || saving || !alias.trim()} className="h-10 w-full border border-sky-200/45 bg-[#246fb8] font-semibold text-white shadow-[0_0_14px_rgba(79,169,255,.22)] hover:bg-[#338de0]">
            {saving ? "Saving…" : savedAlias ? "Update username" : "Set username"}
          </Button>
        </form>}
      </>}
    modalFooter={savedAlias ? (
      <div>
          {confirmingDelete ? (
            <div className="rounded-lg border border-red-400/30 bg-red-950/40 p-3 text-xs">
              <p className="text-red-100">Remove this username and use your provider name instead?</p>
              <div className="mt-2 flex justify-end gap-2">
                <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => setConfirmingDelete(false)} className="border border-sky-200/30 bg-slate-950/35 text-slate-100 hover:border-sky-200/60 hover:bg-blue-400/10 hover:text-white">Cancel</Button>
                <Button type="button" size="sm" variant="destructive" disabled={saving} onClick={deleteAlias} className="border border-rose-200/35 bg-rose-500/80 text-white hover:bg-rose-500">Remove username</Button>
              </div>
            </div>
          ) : (
            <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => setConfirmingDelete(true)} className="w-full border border-rose-200/25 bg-rose-500/5 text-rose-200 hover:border-rose-200/45 hover:bg-rose-500/15 hover:text-rose-100">
              Remove username
            </Button>
          )}
      </div>
    ) : undefined}
  />;
}
