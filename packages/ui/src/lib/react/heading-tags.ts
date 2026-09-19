export const HEADING_LEVELS = [1, 2, 3, 4] as const;
export type THeadingLevel = (typeof HEADING_LEVELS)[number];
export type THeadingTag = 'h1' | 'h2' | 'h3' | 'h4';

export const headingTags: Record<THeadingLevel, THeadingTag> = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
};
