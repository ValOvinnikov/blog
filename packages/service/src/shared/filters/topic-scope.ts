/**
 * `topic` is a single dereferenced reference (like `author`), so scoping by
 * topic is a direct equality check through the reference. `filterBy`'s
 * strong typing only covers paths on the raw (undereferenced) document
 * shape, so a dereferenced path like `topic->slug.current` still goes
 * through `filterRaw`.
 */
export const TOPIC_SCOPE_FILTER = 'topic->slug.current == $slug';
