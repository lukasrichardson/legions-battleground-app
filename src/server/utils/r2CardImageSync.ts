import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export const TOOLBOX_IMAGE_HOST = "api.legionstoolbox.com";
export const TOOLBOX_UPLOADS_PREFIX = "/wp-content/uploads/";
const IMAGE_CONTENT_TYPE = /^image\/(avif|jpeg|png|webp)$/i;

export type SyncStatus = "uploaded" | "skipped" | "invalid" | "failed";

export type ImageSyncResult = {
  sourceUrl: string;
  objectKey?: string;
  status: SyncStatus;
  reason?: string;
  referenceUpdates?: { cards: number; decks: number };
};

export type SyncOptions = {
  bucket: string;
  client: S3Client;
  dryRun: boolean;
  refresh: boolean;
  retries?: number;
  timeoutMs?: number;
};

export function toR2ObjectKey(sourceUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(sourceUrl);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || url.hostname !== TOOLBOX_IMAGE_HOST) return null;
  if (!url.pathname.startsWith(TOOLBOX_UPLOADS_PREFIX)) return null;
  if (!/\.(avif|jpe?g|png|webp)$/i.test(url.pathname)) return null;

  // The bucket keeps card files directly under cards/, without Toolbox's WordPress folders.
  const filename = url.pathname.slice(url.pathname.lastIndexOf("/") + 1);
  return `cards/${filename}`;
}

export function toPublicR2Url(publicBaseUrl: string, objectKey: string): string {
  return `${publicBaseUrl.replace(/\/+$/, "")}/${objectKey}`;
}

export function collectToolboxImageUrls(value: unknown, urls = new Set<string>()): Set<string> {
  if (typeof value === "string") {
    if (toR2ObjectKey(value)) urls.add(value);
    return urls;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectToolboxImageUrls(item, urls));
    return urls;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectToolboxImageUrls(item, urls));
  }
  return urls;
}

/** Combine current catalogue URLs with historical URLs stored in Mongo. */
export function mergeToolboxImageUrls(...urlLists: readonly string[][]): string[] {
  const urls = new Set<string>();
  for (const urlList of urlLists) {
    for (const url of urlList) {
      if (toR2ObjectKey(url)) urls.add(url);
    }
  }
  return [...urls];
}

export function findObjectKeyCollisions(sourceUrls: readonly string[]): Map<string, string[]> {
  const sourcesByKey = new Map<string, string[]>();
  for (const sourceUrl of sourceUrls) {
    const objectKey = toR2ObjectKey(sourceUrl);
    if (!objectKey) continue;
    const sources = sourcesByKey.get(objectKey) || [];
    sources.push(sourceUrl);
    sourcesByKey.set(objectKey, sources);
  }
  return new Map([...sourcesByKey].filter(([, sources]) => sources.length > 1));
}

async function withRetry<T>(operation: () => Promise<T>, attempts: number): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
      }
    }
  }
  throw lastError;
}

function objectIsMissing(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const details = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return ["NotFound", "NoSuchKey", "404"].includes(String(details.name)) || details.$metadata?.httpStatusCode === 404;
}

export async function syncImage(sourceUrl: string, options: SyncOptions): Promise<ImageSyncResult> {
  const objectKey = toR2ObjectKey(sourceUrl);
  if (!objectKey) return { sourceUrl, status: "invalid", reason: "Not an allowed Toolbox image URL" };

  try {
    if (!options.refresh) {
      try {
        await options.client.send(new HeadObjectCommand({ Bucket: options.bucket, Key: objectKey }));
        return { sourceUrl, objectKey, status: "skipped", reason: "Already exists in R2" };
      } catch (error) {
        if (!objectIsMissing(error)) throw error;
      }
    }

    if (options.dryRun) return { sourceUrl, objectKey, status: "uploaded", reason: "Dry run: would upload" };

    const response = await withRetry(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000);
      try {
        const result = await fetch(sourceUrl, { signal: controller.signal });
        if (!result.ok) throw new Error(`Toolbox returned HTTP ${result.status}`);
        return result;
      } finally {
        clearTimeout(timeout);
      }
    }, options.retries ?? 3);

    const contentType = response.headers.get("content-type")?.split(";", 1)[0] || "";
    if (!IMAGE_CONTENT_TYPE.test(contentType)) {
      return { sourceUrl, objectKey, status: "invalid", reason: `Unexpected content type: ${contentType || "missing"}` };
    }

    const body = Buffer.from(await response.arrayBuffer());
    await withRetry(
      () => options.client.send(new PutObjectCommand({
        Bucket: options.bucket,
        Key: objectKey,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
        Metadata: { source: sourceUrl },
      })),
      options.retries ?? 3,
    );
    return { sourceUrl, objectKey, status: "uploaded" };
  } catch (error) {
    return { sourceUrl, objectKey, status: "failed", reason: error instanceof Error ? error.message : String(error) };
  }
}

export async function mapWithConcurrency<T, R>(
  values: readonly T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;
  const worker = async () => {
    while (true) {
      const index = nextIndex++;
      if (index >= values.length) return;
      results[index] = await mapper(values[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(Math.max(1, concurrency), values.length) }, worker));
  return results;
}
