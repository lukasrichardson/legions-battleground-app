import { type ReactNode } from "react";
import { Card, CardContent } from "@/client/ui/card";

export const publicModalFieldClassName = "space-y-2";
export const publicModalLabelClassName = "block text-sm font-semibold text-slate-100";
export const publicModalInputClassName = "h-12 w-full border-sky-200/20 bg-slate-950/45 text-white placeholder:text-slate-500 transition-colors hover:border-sky-200/40 focus:border-sky-300/70 focus:ring-2 focus:ring-sky-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-60";
export const publicModalSelectClassName = "h-12 w-full border-sky-200/20 bg-slate-950/45 text-white transition-colors hover:border-sky-200/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300";

type PublicModalFormProps = {
  children: ReactNode;
  description?: ReactNode;
  afterForm?: ReactNode;
};

/**
 * Shared form surface for account, deck, and lobby modals shown outside a game.
 * Kept separate from the generic Modal because the game uses that foundation too.
 */
export default function PublicModalForm({ children, description, afterForm }: PublicModalFormProps) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      {description && <p className="mx-auto mb-6 max-w-md text-center text-base leading-relaxed text-slate-300">{description}</p>}
      <Card className="border-sky-200/25 bg-slate-950/35 shadow-[inset_0_1px_0_rgba(186,230,253,.08),0_12px_28px_rgba(0,0,0,.22)] backdrop-blur-sm">
        <CardContent className="p-6 sm:p-8">{children}</CardContent>
      </Card>
      {afterForm}
    </div>
  );
}
