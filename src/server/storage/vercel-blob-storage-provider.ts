import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";

import type { StorageProvider, StoredFile } from "./storage-provider";

/** Vercel Blob adapter — used on Vercel where the filesystem is read-only.
 * Reads BLOB_READ_WRITE_TOKEN injected by the linked Blob store. Files get
 * random, unguessable pathnames (never derived from user input). */
export class VercelBlobStorageProvider implements StorageProvider {
  async saveImage(buffer: Buffer, extension: string): Promise<StoredFile> {
    const safeExtension = extension.replace(/[^a-z0-9]/gi, "").slice(0, 5) || "jpg";
    const pathname = `meal-images/${randomUUID()}.${safeExtension}`;

    const blob = await put(pathname, buffer, {
      access: "public",
      contentType: `image/${safeExtension === "jpg" ? "jpeg" : safeExtension}`,
    });

    return { url: blob.url };
  }
}
