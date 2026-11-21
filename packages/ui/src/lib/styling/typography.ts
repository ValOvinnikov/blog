import { TEXT_ROLE, type TTextRole } from '@shinefold/config';

const TITLE = 'font-display font-heading text-text';
const SUBTLE_MONO = 'font-mono text-text-subtle';

export const TYPOGRAPHY: Record<TTextRole, string> = {
  [TEXT_ROLE.HERO_TITLE]: `${TITLE} text-hero heading-case`,
  [TEXT_ROLE.POST_TITLE]: `${TITLE} text-post-title heading-case`,
  [TEXT_ROLE.PAGE_TITLE]: `${TITLE} text-title-2xl heading-case`,
  [TEXT_ROLE.SECTION_TITLE]: `${TITLE} text-title-section heading-case`,
  // Steps up only inside an ancestor marked `@container/card`, keeping its own line-height rather than `text-lg`'s.
  [TEXT_ROLE.CARD_TITLE]: `${TITLE} text-card-title @3xs/card:text-lg leading-(--text-card-title--line-height)`,
  [TEXT_ROLE.ITEM_TITLE]: `${TITLE} text-prose-h3`,
  [TEXT_ROLE.DIALOG_TITLE]: `${TITLE} text-xl leading-tight tracking-tight`,
  // Deliberately smaller than the post and section titles at every viewport width, so an in-article h2 never outsizes the page's own title.
  [TEXT_ROLE.PROSE_H2]: `${TITLE} text-prose-h2`,
  [TEXT_ROLE.PROSE_H3]: `${TITLE} text-prose-h3`,
  [TEXT_ROLE.PROSE_H4]: `${TITLE} text-prose-h4`,
  [TEXT_ROLE.TABLE_TITLE]: `${TITLE} text-copy`,
  [TEXT_ROLE.INTRO]: 'font-read text-prose text-text-muted',
  [TEXT_ROLE.BODY]: 'font-read text-prose leading-[1.7] text-text',
  [TEXT_ROLE.MESSAGE]: 'font-read text-lead leading-[1.72] text-text',
  [TEXT_ROLE.CARD_BODY]: 'font-read text-lead text-text-muted',
  [TEXT_ROLE.META]: `${SUBTLE_MONO} text-meta`,
  [TEXT_ROLE.EYEBROW]:
    'font-mono text-label font-medium uppercase tracking-eyebrow text-brand-primary',
  [TEXT_ROLE.LABEL]:
    'font-mono text-label font-medium uppercase tracking-label',
  [TEXT_ROLE.FOOTNOTE]: 'font-read text-caption text-text-subtle',
  [TEXT_ROLE.CAPTION]: SUBTLE_MONO,
  [TEXT_ROLE.QUOTE]: 'font-read italic text-prose text-text',
  [TEXT_ROLE.ATTRIBUTION]: 'font-medium text-text',
  [TEXT_ROLE.FIGURE]:
    'font-display font-semibold text-text text-2xl @md/figures:text-3xl @4xl/figures:text-4xl',
  [TEXT_ROLE.FIGURE_LABEL]: 'text-sm font-medium text-text',
};
