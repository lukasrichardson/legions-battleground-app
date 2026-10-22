import BanlistItem, {
  BanlistStatus,
} from "@/shared/interfaces/BanlistItem.mongo";

export function getCardStatus(items: BanlistItem[], title: string) {
  return items.find((item) => item.name === title) ?? null;
}

const styles: Partial<Record<BanlistStatus, string>> = {
  [BanlistStatus.SUSPENDED]: "border-red-300/30 bg-red-400/10 text-red-200",
  [BanlistStatus.RESTRICTED]:
    "border-amber-300/30 bg-amber-400/10 text-amber-100",
  [BanlistStatus.LIMITED]:
    "border-violet-300/30 bg-violet-400/10 text-violet-100",
};

export default function CardStatusBadge({
  item,
  numeric = false,
}: {
  item: BanlistItem | null;
  numeric?: boolean;
}) {
  if (!item || !styles[item.status]) return null;
  const counts = {
    [BanlistStatus.SUSPENDED]: 0,
    [BanlistStatus.RESTRICTED]: 1,
    [BanlistStatus.LIMITED]: 2,
  };
  const numericStyles = {
    [BanlistStatus.SUSPENDED]: "bg-red-500",
    [BanlistStatus.RESTRICTED]: "bg-yellow-500",
    [BanlistStatus.LIMITED]: "bg-purple-500",
  };
  return (
    <span
      aria-label={item.status}
      className={
        numeric
          ? `inline-block rounded px-1 py-0.5 text-[16px] text-white ${numericStyles[item.status as keyof typeof numericStyles]}`
          : `inline-block max-w-full rounded border px-1.5 py-1 text-xs capitalize ${styles[item.status]}`
      }
    >
      {numeric ? counts[item.status as keyof typeof counts] : item.status}
    </span>
  );
}
