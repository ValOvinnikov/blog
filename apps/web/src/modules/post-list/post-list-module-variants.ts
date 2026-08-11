import { tv } from 'tailwind-variants';

/**
 * Drops `PostsSection`'s own top margin for this one call site — `Section`
 * now owns that spacing. `PostsSection` also renders outside the module
 * pipeline (archive pages) with its margin intact, so this stays local to
 * `post-list-module.tsx` rather than a change to the shared organism.
 */
export const postListModuleVariants = tv({
  base: ['mt-0'],
});
