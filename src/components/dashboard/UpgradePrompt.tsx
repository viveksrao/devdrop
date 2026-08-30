import { ITEM_TYPE_ICONS } from "@/lib/constants/item-types";
import { BillingSection } from "@/components/settings/BillingSection";

interface UpgradePromptProps {
  typeName: string;
  label: string;
}

export function UpgradePrompt({ typeName, label }: UpgradePromptProps) {
  const Icon = ITEM_TYPE_ICONS[typeName];

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-12 text-center">
      {Icon && <Icon className="size-10 text-muted-foreground" />}
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{label} is a Pro feature</h2>
        <p className="text-sm text-muted-foreground">
          Upgrade to Pro to upload and store {label.toLowerCase()}.
        </p>
      </div>
      <BillingSection isPro={false} />
    </div>
  );
}
