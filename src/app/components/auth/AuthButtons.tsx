"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/client/ui/button";
import { cn } from "@/client/lib/utils";
import AliasEditor from "./AliasEditor";

type AuthButtonsProps = {
  signInLabel?: string;
  signInClassName?: string;
};

export default function AuthButtons({
  signInLabel = "Sign in",
  signInClassName,
}: AuthButtonsProps) {
  const { data: session, status } = useSession();
  const [aliasEditorOpen, setAliasEditorOpen] = useState(false);
  const [alias, setAlias] = useState<string | null>(null);
  const loading = status === "loading";

  useEffect(() => {
    if (!session) {
      setAlias(null);
      return;
    }

    const loadAlias = async () => {
      try {
        const response = await fetch("/api/me/alias");
        const data = await response.json() as { alias: string | null };
        setAlias(response.ok ? data.alias : null);
      } catch {
        setAlias(null);
      }
    };
    void loadAlias();
  }, [session]);

  if (loading) return null;

  return session ? (
    <div className="flex items-center gap-2 justify-center">
      <span className="max-w-32 truncate text-sm text-white/80">{alias || session.user?.name || session.user?.email}</span>
      <div className="relative">
        <Button variant="ghost" size="sm" className="text-white" onClick={() => setAliasEditorOpen((open) => !open)}>
          {alias ? "Edit username" : "Set username"}
        </Button>
        {aliasEditorOpen && <AliasEditor onClose={() => setAliasEditorOpen(false)} onSaved={setAlias} />}
      </div>
      <Button variant="ghost" className="text-white" onClick={() => signOut()}>
        Sign out
      </Button>
    </div>
  ) : (
    <Button className={cn("bg-white/10 text-white", signInClassName)} onClick={() => signIn()}>
      {signInLabel}
    </Button>
  );
}
