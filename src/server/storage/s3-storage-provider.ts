import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import type { StorageProvider, StoredFile } from "./storage-provider";

export type S3StorageConfig = {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
};

/** Production adapter for any S3-compatible object store (AWS S3, R2,
 * Backblaze B2, MinIO, ...). Not exercised in local development — selected
 * only when STORAGE_PROVIDER=s3 and the STORAGE_S3_* env vars are set. */
export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;

  constructor(private readonly config: S3StorageConfig) {
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint || undefined,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async saveImage(buffer: Buffer, extension: string): Promise<StoredFile> {
    const safeExtension = extension.replace(/[^a-z0-9]/gi, "").slice(0, 5) || "jpg";
    const key = `meal-images/${randomUUID()}.${safeExtension}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: buffer,
        ContentType: `image/${safeExtension === "jpg" ? "jpeg" : safeExtension}`,
      }),
    );

    const base = this.config.endpoint
      ? `${this.config.endpoint}/${this.config.bucket}`
      : `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com`;

    return { url: `${base}/${key}` };
  }
}
