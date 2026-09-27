type LoadingStateProps = {
  label?: string;
  className?: string;
};

export default function LoadingState({ label = "Loading…", className = "" }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex min-h-24 w-full flex-col items-center justify-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-8 text-center ${className}`}
    >
      <span aria-hidden="true" className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-blue-300" />
      <span className="text-sm text-white/65">{label}</span>
    </div>
  );
}
