import AppIcon, { type AppIconName } from "./AppIcon";

type PublicModalHeaderProps = {
  title: string;
  icon: AppIconName;
  onClose: () => void;
  closeLabel: string;
  tone?: "blue" | "green";
  disabled?: boolean;
};

const iconToneClasses = {
  blue: "border-sky-200/45 bg-sky-300/15 text-sky-100",
  green: "border-emerald-200/45 bg-emerald-300/15 text-emerald-100",
};

/** Shared header treatment for public modal flows; intentionally separate from the game modal foundation. */
export default function PublicModalHeader({ title, icon, onClose, closeLabel, tone = "blue", disabled = false }: PublicModalHeaderProps) {
  return (
    <div className="flex w-full items-center justify-between gap-4 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center border ${iconToneClasses[tone]}`}>
          <AppIcon name={icon} size={18} />
        </div>
        <h2 className="truncate text-lg font-semibold tracking-wide text-white">{title}</h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        disabled={disabled}
        className="grid size-11 shrink-0 cursor-pointer place-items-center border border-transparent text-slate-400 transition-colors duration-200 hover:border-sky-200/35 hover:bg-blue-400/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
      >
        <AppIcon name="close" size={24} />
      </button>
    </div>
  );
}
