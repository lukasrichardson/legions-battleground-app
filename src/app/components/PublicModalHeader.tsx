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
  blue: "from-blue-500 to-blue-600",
  green: "from-green-500 to-green-600",
};

/** Shared header treatment for public modal flows; intentionally separate from the game modal foundation. */
export default function PublicModalHeader({ title, icon, onClose, closeLabel, tone = "blue", disabled = false }: PublicModalHeaderProps) {
  return (
    <div className="flex w-full items-center justify-between gap-4 p-6 pb-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${iconToneClasses[tone]}`}>
          <AppIcon name={icon} className="text-white" size={20} />
        </div>
        <h2 className="truncate text-xl font-bold text-white">{title}</h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        disabled={disabled}
        className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      >
        <AppIcon name="close" size={24} />
      </button>
    </div>
  );
}
