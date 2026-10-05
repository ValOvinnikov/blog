export type TSanityProjectRef = {
  projectId: string;
  dataset: string;
};

// Sized for "tens of tenants", not every tenant that has ever existed.
const MAX_CACHED_PROJECTS = 20;

function projectKey(project: TSanityProjectRef): string {
  return `${project.projectId}:${project.dataset}`;
}

/** A per-project LRU cache, so one process can serve many tenants without one project's client leaking into another's. */
export function createProjectCache<TEntry>() {
  const entries = new Map<string, TEntry>();

  return function getOrCreate(
    project: TSanityProjectRef,
    create: () => TEntry,
    isReusable: (entry: TEntry) => boolean = () => true,
  ): TEntry {
    const key = projectKey(project);
    const cached = entries.get(key);
    const entry =
      cached !== undefined && isReusable(cached) ? cached : create();

    entries.delete(key);
    entries.set(key, entry);
    if (entries.size > MAX_CACHED_PROJECTS) {
      const oldestKey = entries.keys().next().value;
      if (oldestKey !== undefined) entries.delete(oldestKey);
    }

    return entry;
  };
}
