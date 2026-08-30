import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const systemItemTypes = [
  { name: "snippet", icon: "Code", color: "#3b82f6", isSystem: true },
  { name: "prompt", icon: "Sparkles", color: "#8b5cf6", isSystem: true },
  { name: "command", icon: "Terminal", color: "#f97316", isSystem: true },
  { name: "note", icon: "StickyNote", color: "#fde047", isSystem: true },
  { name: "file", icon: "File", color: "#6b7280", isSystem: true },
  { name: "image", icon: "Image", color: "#ec4899", isSystem: true },
  { name: "link", icon: "Link", color: "#10b981", isSystem: true },
];

async function seedSystemItemTypes() {
  console.log("Seeding system item types...");

  const types: Record<string, string> = {};

  for (const type of systemItemTypes) {
    let itemType = await prisma.itemType.findFirst({
      where: { name: type.name, userId: null },
    });

    if (!itemType) {
      itemType = await prisma.itemType.create({ data: type });
    }

    types[type.name] = itemType.id;
  }

  return types;
}

async function seedDemoUser() {
  console.log("Seeding demo user...");

  const hashedPassword = await bcrypt.hash("12345678", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@devstash.io" },
    update: {},
    create: {
      email: "demo@devstash.io",
      name: "Demo User",
      password: hashedPassword,
      isPro: false,
      emailVerified: new Date(),
    },
  });

  return user;
}

async function seedCollectionsAndItems(userId: string, types: Record<string, string>) {
  console.log("Seeding collections and items...");

  // Clear previously seeded items/collections for this user so the script is re-runnable.
  await prisma.item.deleteMany({ where: { userId } });
  await prisma.collection.deleteMany({ where: { userId } });

  // ============================================
  // React Patterns
  // ============================================
  const reactPatterns = await prisma.collection.create({
    data: {
      name: "React Patterns",
      description: "Reusable React patterns and hooks",
      userId,
      defaultTypeId: types.snippet,
    },
  });

  const reactSnippets = [
    {
      title: "useDebounce Hook",
      language: "typescript",
      content: `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debouncedValue;
}`,
    },
    {
      title: "useLocalStorage Hook",
      language: "typescript",
      content: `import { useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = (newValue: T) => {
    setValue(newValue);
    window.localStorage.setItem(key, JSON.stringify(newValue));
  };

  return [value, setStoredValue] as const;
}`,
    },
    {
      title: "Compound Component Pattern (Tabs)",
      language: "typescript",
      content: `import { createContext, useContext, useState, type ReactNode } from "react";

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs components must be used within <Tabs>");
  return context;
}

export function Tabs({ defaultTab, children }: { defaultTab: string; children: ReactNode }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>{children}</TabsContext.Provider>
  );
}

export function TabList({ children }: { children: ReactNode }) {
  return <div role="tablist">{children}</div>;
}

export function Tab({ id, children }: { id: string; children: ReactNode }) {
  const { activeTab, setActiveTab } = useTabsContext();
  return (
    <button role="tab" aria-selected={activeTab === id} onClick={() => setActiveTab(id)}>
      {children}
    </button>
  );
}

export function TabPanel({ id, children }: { id: string; children: ReactNode }) {
  const { activeTab } = useTabsContext();
  if (activeTab !== id) return null;
  return <div role="tabpanel">{children}</div>;
}`,
    },
  ];

  for (const snippet of reactSnippets) {
    await prisma.item.create({
      data: {
        title: snippet.title,
        contentType: "TEXT",
        content: snippet.content,
        language: snippet.language,
        userId,
        itemTypeId: types.snippet,
        collections: {
          create: { collectionId: reactPatterns.id },
        },
      },
    });
  }

  // ============================================
  // AI Workflows
  // ============================================
  const aiWorkflows = await prisma.collection.create({
    data: {
      name: "AI Workflows",
      description: "AI prompts and workflow automations",
      userId,
      defaultTypeId: types.prompt,
    },
  });

  const prompts = [
    {
      title: "Thorough Code Review Prompt",
      content: `Review the following code for:

1. Correctness - logic errors, edge cases, off-by-one errors
2. Security - injection risks, unvalidated input, auth checks
3. Performance - unnecessary re-renders, N+1 queries, inefficient loops
4. Readability - naming, structure, comments only where non-obvious

For each issue found, cite the file and line number, explain the concrete failure scenario, and suggest a fix. Do not comment on style preferences that don't affect correctness or maintainability.

Code:
{{paste code here}}`,
    },
    {
      title: "Generate Documentation from Code",
      content: `Generate clear, concise documentation for the following code. Include:

- A one-sentence summary of what it does
- Parameters/props with types and descriptions
- Return value or output
- One realistic usage example
- Any important caveats (side effects, thrown errors, async behavior)

Keep the tone direct and avoid restating what's obvious from the function signature.

Code:
{{paste code here}}`,
    },
    {
      title: "Refactor for Readability & Simplicity",
      content: `Refactor the following code to improve readability and reduce complexity, without changing its behavior.

Guidelines:
- Extract logic only where it removes real duplication, not for its own sake
- Prefer clear naming over comments
- Flag any dead code or unreachable branches you find
- Preserve existing patterns and conventions used elsewhere in the file
- List the changes you made and why, briefly

Code:
{{paste code here}}`,
    },
  ];

  for (const prompt of prompts) {
    await prisma.item.create({
      data: {
        title: prompt.title,
        contentType: "TEXT",
        content: prompt.content,
        userId,
        itemTypeId: types.prompt,
        collections: {
          create: { collectionId: aiWorkflows.id },
        },
      },
    });
  }

  // ============================================
  // Terminal Commands
  // ============================================
  const terminalCommands = await prisma.collection.create({
    data: {
      name: "Terminal Commands",
      description: "Useful shell commands for everyday development",
      userId,
      defaultTypeId: types.command,
    },
  });

  const commands = [
    {
      title: "Undo Last Commit (Keep Changes)",
      content: "git reset --soft HEAD~1",
      language: "bash",
    },
    {
      title: "Remove Dangling Docker Images",
      content: "docker image prune -f",
      language: "bash",
    },
    {
      title: "Find Process on Port",
      content: "lsof -i :3000",
      language: "bash",
    },
    {
      title: "Clean Install Node Modules",
      content: "rm -rf node_modules package-lock.json && npm install",
      language: "bash",
    },
  ];

  for (const command of commands) {
    await prisma.item.create({
      data: {
        title: command.title,
        contentType: "TEXT",
        content: command.content,
        language: command.language,
        userId,
        itemTypeId: types.command,
        collections: {
          create: { collectionId: terminalCommands.id },
        },
      },
    });
  }
}

async function main() {
  const types = await seedSystemItemTypes();
  const user = await seedDemoUser();
  await seedCollectionsAndItems(user.id, types);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
