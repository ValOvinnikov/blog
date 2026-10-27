import {
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  LINK_TYPE,
} from '@blog/config/constants';
import { faker } from '@faker-js/faker';

import {
  buildCtaButton,
  detectOrderingIssues,
  type TLegacyCtaAction,
  type TOrderingIssue,
} from './transform';

faker.seed(6019);

const MOCK_ACTION_KEY = faker.string.uuid();
const MOCK_LINK_ID = faker.string.uuid();
const MOCK_URL = faker.internet.url();

const mockActions = (variants: (string | undefined)[]): TLegacyCtaAction[] =>
  variants.map((variant) => ({ _key: faker.string.uuid(), variant }));

const { PRIMARY, SECONDARY } = CTA_ACTION_VARIANT;

describe(buildCtaButton, () => {
  it('preserves the original key, variant and appearance', () => {
    const action: TLegacyCtaAction = {
      _key: MOCK_ACTION_KEY,
      variant: PRIMARY,
      appearance: CTA_ACTION_APPEARANCE.CONTAINED,
      link: { linkType: LINK_TYPE.EXTERNAL, url: MOCK_URL },
    };

    expect(buildCtaButton(action, MOCK_LINK_ID)).toEqual({
      _key: MOCK_ACTION_KEY,
      _type: 'ctaButton',
      variant: PRIMARY,
      appearance: CTA_ACTION_APPEARANCE.CONTAINED,
      link: { _type: 'reference', _ref: MOCK_LINK_ID },
    });
  });
});

describe(detectOrderingIssues, () => {
  it.each([
    { title: 'an empty array', variants: [] },
    { title: 'a single Primary', variants: [PRIMARY] },
    { title: 'a Primary then a Secondary', variants: [PRIMARY, SECONDARY] },
  ])('reports nothing for $title', ({ variants }) => {
    expect(detectOrderingIssues(mockActions(variants))).toEqual([]);
  });

  it.each<{
    title: string;
    variants: (string | undefined)[];
    issues: TOrderingIssue[];
  }>([
    {
      title: 'a duplicate variant',
      variants: [SECONDARY, SECONDARY],
      issues: [{ type: 'DUPLICATE_VARIANT', variant: SECONDARY }],
    },
    {
      title: 'a Primary that is not first',
      variants: [SECONDARY, PRIMARY],
      issues: [{ type: 'PRIMARY_NOT_FIRST' }],
    },
    {
      title: 'more than two buttons',
      variants: [PRIMARY, SECONDARY, undefined],
      issues: [{ type: 'TOO_MANY_BUTTONS', count: 3 }],
    },
    {
      title: 'every issue at once',
      variants: [SECONDARY, SECONDARY, PRIMARY],
      issues: [
        { type: 'TOO_MANY_BUTTONS', count: 3 },
        { type: 'DUPLICATE_VARIANT', variant: SECONDARY },
        { type: 'PRIMARY_NOT_FIRST' },
      ],
    },
  ])('flags $title', ({ variants, issues }) => {
    expect(detectOrderingIssues(mockActions(variants))).toEqual(issues);
  });
});
