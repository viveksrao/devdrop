import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  parseEditorPreferences,
  type EditorPreferences,
} from "@/lib/constants/editor-preferences";

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: Date;
  hasPassword: boolean;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      password: true,
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    createdAt: user.createdAt,
    hasPassword: !!user.password,
  };
}

export async function getEditorPreferences(userId: string): Promise<EditorPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { editorPreferences: true },
  });

  return parseEditorPreferences(user?.editorPreferences);
}

export async function updateEditorPreferences(
  userId: string,
  preferences: EditorPreferences
): Promise<EditorPreferences> {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { editorPreferences: preferences as unknown as Prisma.InputJsonValue },
    select: { editorPreferences: true },
  });

  return parseEditorPreferences(updated.editorPreferences);
}
