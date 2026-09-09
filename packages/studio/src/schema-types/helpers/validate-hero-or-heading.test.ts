import { validateHeroOrHeading } from '@blog/studio/schema-types/helpers/validate-hero-or-heading';
import type { DocumentRule, SanityDocument } from 'sanity';

type TCustomFn = (document: SanityDocument | undefined) => string | true;

type TMockRule = {
  level: 'error' | 'warning';
  fn?: TCustomFn;
  custom: (fn: TCustomFn) => TMockRule;
  warning: () => TMockRule;
};

const createMockRule = (
  level: TMockRule['level'] = 'error',
  fn?: TCustomFn,
): TMockRule => ({
  level,
  fn,
  custom: (nextFn) => createMockRule('error', nextFn),
  warning: () => createMockRule('warning', fn),
});

const asDocument = (doc: Record<string, unknown>): SanityDocument =>
  doc as unknown as SanityDocument;

const buildRules = () =>
  validateHeroOrHeading()(
    createMockRule() as unknown as DocumentRule,
  ) as unknown as TMockRule[];

describe(validateHeroOrHeading, () => {
  it('registers an error rule then a warning rule', () => {
    const rules = buildRules();

    expect(rules).toHaveLength(2);
    expect(rules[0]?.level).toBe('error');
    expect(rules[1]?.level).toBe('warning');
  });

  it('errors when neither hero nor heading is set', () => {
    const [requiredRule] = buildRules();

    expect(requiredRule?.fn?.(asDocument({}))).toBe('Add a hero or a heading');
  });

  it('passes when only hero is set', () => {
    const [requiredRule, notBothRule] = buildRules();
    const document = asDocument({ hero: { _ref: 'hero-1' } });

    expect(requiredRule?.fn?.(document)).toBe(true);
    expect(notBothRule?.fn?.(document)).toBe(true);
  });

  it('passes when only the heading is set', () => {
    const [requiredRule, notBothRule] = buildRules();
    const document = asDocument({ sectionHeader: { heading: 'Welcome' } });

    expect(requiredRule?.fn?.(document)).toBe(true);
    expect(notBothRule?.fn?.(document)).toBe(true);
  });

  it('warns when both hero and heading are set', () => {
    const [requiredRule, notBothRule] = buildRules();
    const document = asDocument({
      hero: { _ref: 'hero-1' },
      sectionHeader: { heading: 'Welcome' },
    });

    expect(requiredRule?.fn?.(document)).toBe(true);
    expect(notBothRule?.fn?.(document)).toBe('The hero hides the heading');
  });
});
