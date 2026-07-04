// Mock data for the dashboard UI. Temporary stand-in until the database is wired up.

export type ContentType = 'TEXT' | 'FILE' | 'URL';

export interface User {
  id: string;
  email: string;
  name: string;
  isPro: boolean;
}

export interface ItemType {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem: boolean;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  isFavorite: boolean;
  itemCount: number;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  contentType: ContentType;
  itemTypeId: string;
  isFavorite: boolean;
  isPinned: boolean;
  tags: string[];
  createdAt: string;
}

export const currentUser: User = {
  id: 'user-1',
  email: 'jordan@example.com',
  name: 'Jordan',
  isPro: false,
};

export const itemTypes: ItemType[] = [
  { id: 'type-snippet', name: 'snippet', icon: 'Code', color: '#3b82f6', isSystem: true },
  { id: 'type-prompt', name: 'prompt', icon: 'Sparkles', color: '#8b5cf6', isSystem: true },
  { id: 'type-command', name: 'command', icon: 'Terminal', color: '#f97316', isSystem: true },
  { id: 'type-note', name: 'note', icon: 'StickyNote', color: '#fde047', isSystem: true },
  { id: 'type-file', name: 'file', icon: 'File', color: '#6b7280', isSystem: true },
  { id: 'type-image', name: 'image', icon: 'Image', color: '#ec4899', isSystem: true },
  { id: 'type-link', name: 'link', icon: 'Link', color: '#10b981', isSystem: true },
];

export const collections: Collection[] = [
  { id: 'col-1', name: 'React Patterns', description: 'Reusable hooks, components & rendering tricks', isFavorite: true, itemCount: 24 },
  { id: 'col-2', name: 'Python Snippets', description: 'Data wrangling and scripting helpers', isFavorite: false, itemCount: 18 },
  { id: 'col-3', name: 'Context Files', description: 'System prompts & context for AI agents', isFavorite: true, itemCount: 9 },
  { id: 'col-4', name: 'Interview Prep', description: 'Algorithms, notes and behavioral answers', isFavorite: false, itemCount: 31 },
  { id: 'col-5', name: 'AI Prompts', description: 'Prompt library for daily workflows', isFavorite: true, itemCount: 42 },
  { id: 'col-6', name: 'Shell Commands', description: 'Git, docker and system one-liners', isFavorite: false, itemCount: 15 },
];

export const items: Item[] = [
  {
    id: 'item-1',
    title: 'useAuth hook',
    description: 'Custom hook wrapping session + user state',
    contentType: 'TEXT',
    itemTypeId: 'type-snippet',
    isFavorite: true,
    isPinned: true,
    tags: ['react', 'auth', 'hooks'],
    createdAt: '2026-07-01',
  },
  {
    id: 'item-2',
    title: 'Code review prompt',
    description: 'Thorough senior-level code review template',
    contentType: 'TEXT',
    itemTypeId: 'type-prompt',
    isFavorite: false,
    isPinned: true,
    tags: ['ai', 'review'],
    createdAt: '2026-07-01',
  },
  {
    id: 'item-3',
    title: 'git reset --hard HEAD~1',
    description: 'Undo the last commit and discard changes',
    contentType: 'TEXT',
    itemTypeId: 'type-command',
    isFavorite: false,
    isPinned: false,
    tags: ['git', 'danger'],
    createdAt: '2026-06-30',
  },
  {
    id: 'item-4',
    title: 'Sprint retro notes',
    description: 'Highlights and action items from the retro',
    contentType: 'TEXT',
    itemTypeId: 'type-note',
    isFavorite: false,
    isPinned: false,
    tags: ['team', 'process'],
    createdAt: '2026-06-29',
  },
  {
    id: 'item-5',
    title: 'Tailwind config reference',
    description: 'Official Tailwind v4 theme configuration docs',
    contentType: 'URL',
    itemTypeId: 'type-link',
    isFavorite: false,
    isPinned: false,
    tags: ['css', 'docs'],
    createdAt: '2026-06-28',
  },
  {
    id: 'item-6',
    title: 'agent-context.md',
    description: 'Base context file for the support agent',
    contentType: 'FILE',
    itemTypeId: 'type-file',
    isFavorite: false,
    isPinned: false,
    tags: ['ai', 'context'],
    createdAt: '2026-06-27',
  },
  {
    id: 'item-7',
    title: 'Debounce utility',
    description: 'Generic debounce with cancel support',
    contentType: 'TEXT',
    itemTypeId: 'type-snippet',
    isFavorite: false,
    isPinned: false,
    tags: ['utils', 'performance'],
    createdAt: '2026-06-26',
  },
  {
    id: 'item-8',
    title: 'Prompt optimizer meta-prompt',
    description: 'Rewrites a rough prompt into a precise one',
    contentType: 'TEXT',
    itemTypeId: 'type-prompt',
    isFavorite: false,
    isPinned: false,
    tags: ['ai', 'meta'],
    createdAt: '2026-06-25',
  },
  {
    id: 'item-9',
    title: 'API error boundary',
    description: 'React error boundary for API failures with retry',
    contentType: 'TEXT',
    itemTypeId: 'type-snippet',
    isFavorite: false,
    isPinned: false,
    tags: ['react', 'errors'],
    createdAt: '2026-06-24',
  },
  {
    id: 'item-10',
    title: 'Docker cleanup command',
    description: 'Prune unused containers, images and volumes',
    contentType: 'TEXT',
    itemTypeId: 'type-command',
    isFavorite: false,
    isPinned: false,
    tags: ['docker', 'cleanup'],
    createdAt: '2026-06-23',
  },
];
