export type StoredFile = {
  url: string;
};

export interface StorageProvider {
  saveImage(buffer: Buffer, extension: string): Promise<StoredFile>;
}
