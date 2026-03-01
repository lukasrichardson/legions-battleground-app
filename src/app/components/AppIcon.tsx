import { cn } from "@/client/lib/utils";
import {
  CircleHelp,
  Dice6,
  DoorOpen,
  RefreshCcw,
  Settings2,
  Shuffle,
  SquarePen,
  Users
} from "lucide-react";

export type AppIconName =
  | "tools"
  | "roll-d6"
  | "help"
  | "mulligan"
  | "switch-player"
  | "leave-game"
  | "change-decks"
  | "edit-deck"
  | "reset-game";

const iconMap = {
  "tools": Settings2,
  "roll-d6": Dice6,
  "help": CircleHelp,
  "mulligan": RefreshCcw,
  "switch-player": Users,
  "leave-game": DoorOpen,
  "change-decks": Shuffle,
  "edit-deck": SquarePen,
  "reset-game": RefreshCcw
} as const;

export default function AppIcon({
  name,
  className,
  size = 16,
  strokeWidth = 2
}: {
  name: AppIconName;
  className?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const Icon = iconMap[name];

  return (
    <Icon
      className={cn("shrink-0", className)}
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden="true"
    />
  );
}
