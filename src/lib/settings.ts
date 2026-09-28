import { prisma } from "./prisma";
import type { Settings } from "@prisma/client";

export async function getSettings(): Promise<Settings> {
  const s = await prisma.settings.findUnique({ where: { id: 1 } });
  if (s) return s;
  return prisma.settings.create({ data: { id: 1 } });
}

export function parseList(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
