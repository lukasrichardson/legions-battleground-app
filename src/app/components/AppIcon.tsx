import { cn } from "@/client/lib/utils";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Circle,
  CircleHelp,
  CircleX,
  Dice6,
  DoorOpen,
  Hand,
  LockKeyhole,
  LogIn,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Scissors,
  ScrollText,
  Search,
  Settings2,
  Shuffle,
  SquarePen,
  Users,
  X,
  PlayingCardsFan,
  WalletCards,
  FolderSearch,
  Import
} from "lucide-react";

const iconMap = {
  tools: Settings2,
  "roll-d6": Dice6,
  help: CircleHelp,
  mulligan: RefreshCcw,
  "mulligan-hand": Hand,
  "switch-player": Users,
  "leave-game": DoorOpen,
  "change-decks": Shuffle,
  "edit-deck": SquarePen,
  "reset-game": RefreshCcw,
  create: Plus,
  import: Import,
  decks: WalletCards,
  "card-gallery": PlayingCardsFan,
  browse: FolderSearch,
  search: Search,
  close: X,
  error: CircleX,
  "sign-in-required": LockKeyhole,
  "join-room": LogIn,
  check: Check,
  "chevron-down": ChevronDown,
  "chevron-up": ChevronUp,
  "chevron-right": ChevronRight,
  more: MoreHorizontal,
  rock: Circle,
  paper: ScrollText,
  scissors: Scissors,
} as const;

export type AppIconName = keyof typeof iconMap;

export default function AppIcon({
  name,
  className,
  size = 16,
  strokeWidth = 2,
  "aria-label": ariaLabel
}: {
  name: AppIconName;
  className?: string;
  size?: number;
  strokeWidth?: number;
  "aria-label"?: string;
}) {
  const Icon = iconMap[name];

  return (
    <Icon
      className={cn("shrink-0", className)}
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
    />
  );
}
