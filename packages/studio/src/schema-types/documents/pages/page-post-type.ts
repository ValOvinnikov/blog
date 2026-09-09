/**
 * `page_post`'s own `_type` name, in its own file so `objects/link.ts` —
 * which `page-post.ts` pulls in transitively through its CTA module — can
 * reference it without an import cycle back through `page-post.ts`.
 */
export const PAGE_POST_TYPE = 'page_post';
