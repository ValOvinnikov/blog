/** Read past the Data Cache: a revalidate webhook must see the values it was fired for. */
export function uncachedRead() {
  return { cache: 'no-store' as const };
}
