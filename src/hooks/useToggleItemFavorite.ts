import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toggleItemFavorite } from "@/actions/items";

export function useToggleItemFavorite(itemId: string) {
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);

  async function toggleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    if (isToggling) return;
    setIsToggling(true);
    const result = await toggleItemFavorite(itemId);
    setIsToggling(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to update favorite");
      return;
    }

    router.refresh();
  }

  return { isToggling, toggleFavorite };
}
