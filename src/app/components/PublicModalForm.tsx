import { type ReactNode } from "react";
import { Card, CardContent } from "@/client/ui/card";

export const publicModalFieldClassName = "space-y-2";
export const publicModalLabelClassName = "block text-sm font-semibold text-white";
export const publicModalInputClassName = "h-12 w-full border-white/20 bg-white/10 text-white placeholder:text-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-60";
export const publicModalSelectClassName = "h-12 w-full border-white/20 bg-white/10 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400";

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
      {description && <p className="mx-auto mb-6 max-w-md text-center text-base leading-relaxed text-gray-300">{description}</p>}
      <Card className="border-white/20 bg-white/10 shadow-2xl backdrop-blur-sm">
        <CardContent className="p-6 sm:p-8">{children}</CardContent>
      </Card>
      {afterForm}
    </div>
  );
}
