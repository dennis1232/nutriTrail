import { env } from "@/server/env";
import { LocalStorageProvider } from "./local-storage-provider";
import { S3StorageProvider } from "./s3-storage-provider";
import type { StorageProvider } from "./storage-provider";

export function getStorageProvider(): StorageProvider {
  if (env.STORAGE_PROVIDER === "s3") {
    return new S3StorageProvider({
      bucket: env.STORAGE_S3_BUCKET,
      region: env.STORAGE_S3_REGION,
      accessKeyId: env.STORAGE_S3_ACCESS_KEY_ID,
      secretAccessKey: env.STORAGE_S3_SECRET_ACCESS_KEY,
      endpoint: env.STORAGE_S3_ENDPOINT || undefined,
    });
  }
  return new LocalStorageProvider();
}

export type { StorageProvider, StoredFile } from "./storage-provider";
