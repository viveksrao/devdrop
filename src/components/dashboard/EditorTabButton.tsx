import { cn } from "@/lib/utils";

interface EditorTabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function EditorTabButton({ active, onClick, children }: EditorTabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-2 py-1 text-xs font-medium transition-colors",
        active ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"
      )}
    >
      {children}
    </button>
  );
}
