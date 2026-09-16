import { Crown, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AiActionButtonProps {
  isPro: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export function AiActionButton({ isPro, isLoading, onClick }: AiActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-white/60 hover:bg-white/10 hover:text-white"
            onClick={onClick}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : !isPro ? (
              <Crown />
            ) : (
              <Sparkles />
            )}
          </Button>
        }
      />
      {!isPro && <TooltipContent>AI features require Pro subscription</TooltipContent>}
    </Tooltip>
  );
}
