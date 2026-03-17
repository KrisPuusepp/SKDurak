// src/storage.ts
import fs from "fs/promises";
import path from "path";
import { mkdirSync } from "fs";

export async function readJsonFile<T>(filepath: string, fallback: T): Promise<T>
{
  try
  {
    const raw = await fs.readFile(filepath, "utf8");
    return JSON.parse(raw) as T;
  } catch (err)
  {
    // if file doesn't exist or parse fails, return fallback
    return fallback;
  }
}

export async function writeJsonFileAtomic(filepath: string, data: unknown): Promise<void>
{
  const dir = path.dirname(filepath);
  mkdirSync(dir, { recursive: true });
  const tmp = `${filepath}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, filepath);
}