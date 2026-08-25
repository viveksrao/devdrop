"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Folder } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useItemDrawer } from "@/components/dashboard/ItemDrawerProvider";
import { ITEM_TYPE_ICONS } from "@/lib/constants/item-types";
import type { SearchData } from "@/lib/db/search";

interface GlobalSearchContextValue {
  open: () => void;
}

const GlobalSearchContext = createContext<GlobalSearchContextValue | null>(null);

export function useGlobalSearch(): GlobalSearchContextValue {
  const context = useContext(GlobalSearchContext);
  if (!context) {
    throw new Error("useGlobalSearch must be used within a GlobalSearchProvider");
  }
  return context;
}

export function GlobalSearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<SearchData | null>(null);
  const router = useRouter();
  const { openItem } = useItemDrawer();

  useEffect(() => {
    let cancelled = false;

    fetch("/api/search")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.success) setData(json.data as SearchData);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelectItem = useCallback(
    (itemId: string) => {
      setOpen(false);
      openItem(itemId);
    },
    [openItem]
  );

  const handleSelectCollection = useCallback(
    (collectionId: string) => {
      setOpen(false);
      router.push(`/collections/${collectionId}`);
    },
    [router]
  );

  return (
    <GlobalSearchContext.Provider value={{ open: () => setOpen(true) }}>
      {children}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Search items and collections"
      >
        <Command>
          <CommandInput placeholder="Search snippets, prompts, tags..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {data && data.items.length > 0 && (
              <CommandGroup heading="Items">
                {data.items.map((item) => {
                  const Icon = ITEM_TYPE_ICONS[item.itemType.name];
                  return (
                    <CommandItem
                      key={item.id}
                      value={`${item.title} ${item.contentPreview ?? ""}`}
                      keywords={[item.itemType.name]}
                      onSelect={() => handleSelectItem(item.id)}
                    >
                      {Icon && (
                        <Icon
                          className="size-4 shrink-0"
                          style={{ color: item.itemType.color }}
                        />
                      )}
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate">{item.title}</span>
                        {item.contentPreview && (
                          <span className="truncate text-xs text-muted-foreground">
                            {item.contentPreview}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
            {data && data.collections.length > 0 && (
              <CommandGroup heading="Collections">
                {data.collections.map((collection) => (
                  <CommandItem
                    key={collection.id}
                    value={collection.name}
                    onSelect={() => handleSelectCollection(collection.id)}
                  >
                    <Folder className="size-4 shrink-0" />
                    <span className="truncate">{collection.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </GlobalSearchContext.Provider>
  );
}
