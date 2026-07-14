import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { StorageProvider, StoredFile } from "./storage-provider";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/** Development adapter: writes to /public/uploads with a random, non-guessable
 * filename (never derived from user input) and serves it as a static file. */
export class LocalStorageProvider implements StorageProvider {
  async saveImage(buffer: Buffer, extension: string): Promise<StoredFile> {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const safeExtension = extension.replace(/[^a-z0-9]/gi, "").slice(0, 5) || "jpg";
    const filename = `${randomUUID()}.${safeExtension}`;
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);
    return { url: `/uploads/${filename}` };
  }
}
