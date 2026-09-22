"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/client/ui/button";
import { cn } from "@/client/lib/utils";

type AuthButtonsProps = {
  signInLabel?: string;
  signInClassName?: string;
};

export default function AuthButtons({
  signInLabel = "Sign in",
  signInClassName,
}: AuthButtonsProps) {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  if (loading) return null;

  return session ? (
    <div className="flex items-center gap-2 justify-center">
      <span className="text-white/80 text-sm">Signed In As: {session.user?.name || session.user?.email}</span>
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
