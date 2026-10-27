import { faker } from '@faker-js/faker';
import type { Path } from 'sanity/migrate';

import { isInlineLinkPath, renameInlineLinkType } from './transform';

faker.seed(6018);

const LEGACY_LINK_TYPE = 'link';
const INLINE_LINK_TYPE = 'inlineLink';
const MOCK_KEY = faker.string.uuid();
const MOCK_BLOCK_KEY = faker.string.uuid();
const MOCK_MARK_KEY = faker.string.uuid();
const MOCK_LABEL = faker.lorem.words();
const MOCK_URL = faker.internet.url();

const FOOTER_SOCIAL_PATH: Path = ['social', { _key: MOCK_KEY }];
const HERO_SECONDARY_ACTION_PATH: Path = ['secondaryAction'];
const CTA_ACTION_LINK_PATH: Path = [
  'actions',
  'actions',
  { _key: MOCK_KEY },
  'link',
];
const HERO_BLOG_SECONDARY_LINK_PATH: Path = ['secondaryAction', 'link'];
const CTA_CONTENT_ANNOTATION_PATH: Path = [
  'content',
  { _key: MOCK_BLOCK_KEY },
  'markDefs',
  { _key: MOCK_MARK_KEY },
];
const RICH_TEXT_ANNOTATION_PATH: Path = [
  'body',
  { _key: MOCK_BLOCK_KEY },
  'markDefs',
  { _key: MOCK_MARK_KEY },
];

describe(isInlineLinkPath, () => {
  it.each<[string, Path]>([
    ['a keyed element of settings_footer.social[]', FOOTER_SOCIAL_PATH],
    [
      'a keyed element of settings_navigation.items[]',
      ['items', { _key: MOCK_KEY }],
    ],
    ['module_hero.secondaryAction', HERO_SECONDARY_ACTION_PATH],
    ['the link of an actionGroup ctaAction', CTA_ACTION_LINK_PATH],
    ['module_heroBlog.secondaryAction.link', HERO_BLOG_SECONDARY_LINK_PATH],
    [
      'a markDef annotation in module_cta.content[]',
      CTA_CONTENT_ANNOTATION_PATH,
    ],
  ])('is true for %s', (_location, path) => {
    expect(isInlineLinkPath(path)).toBe(true);
  });

  it.each<[string, Path]>([
    ['a richText markDefs annotation path', RICH_TEXT_ANNOTATION_PATH],
    ['a non-array, non-secondaryAction field', ['title']],
    [
      'a path nested deeper than the ctaAction link',
      [...CTA_ACTION_LINK_PATH, 'label'],
    ],
  ])('is false for %s', (_location, path) => {
    expect(isInlineLinkPath(path)).toBe(false);
  });
});

describe(renameInlineLinkType, () => {
  it.each<[string, Path]>([
    ['settings_footer.social[]', FOOTER_SOCIAL_PATH],
    ['module_hero.secondaryAction', HERO_SECONDARY_ACTION_PATH],
    ['an actionGroup ctaAction link', CTA_ACTION_LINK_PATH],
    ['module_heroBlog.secondaryAction.link', HERO_BLOG_SECONDARY_LINK_PATH],
    [
      'a markDef annotation in module_cta.content[]',
      CTA_CONTENT_ANNOTATION_PATH,
    ],
  ])('renames a legacy link at %s, keeping other fields', (_location, path) => {
    const node = { _type: LEGACY_LINK_TYPE, label: MOCK_LABEL, url: MOCK_URL };

    const result = renameInlineLinkType(node, path);

    expect(result).toEqual({ ...node, _type: INLINE_LINK_TYPE });
  });

  it('leaves a node already renamed to inlineLink alone', () => {
    const node = { _type: INLINE_LINK_TYPE, label: MOCK_LABEL };

    const result = renameInlineLinkType(node, HERO_SECONDARY_ACTION_PATH);

    expect(result).toBeUndefined();
  });

  it('leaves a richText markDefs link annotation alone', () => {
    const node = { _type: LEGACY_LINK_TYPE, href: MOCK_URL };

    const result = renameInlineLinkType(node, RICH_TEXT_ANNOTATION_PATH);

    expect(result).toBeUndefined();
  });

  it('leaves an unrelated object type at a known link path alone', () => {
    const node = { _type: 'socialLink', url: MOCK_URL };

    const result = renameInlineLinkType(node, FOOTER_SOCIAL_PATH);

    expect(result).toBeUndefined();
  });
});
