export type ResolverCacheEntry = unknown;

const cache = new Map<string, ResolverCacheEntry>();

export function setResolverCache(id: string, data: ResolverCacheEntry) {
  cache.set(id, data);
}

export function consumeResolverCache(id: string): ResolverCacheEntry | undefined {
  const data = cache.get(id);
  cache.delete(id);
  return data;
}
