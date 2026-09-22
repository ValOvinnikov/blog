import { BRAND_VARIANT, CONTENT_ALIGNMENT, CTA_VARIANT } from '@blog/config';
import { CtaModule } from '@blog/ui/organisms/cta-module';
import { customRender, screen } from '@web/testing/custom-render';
import {
  ctaActionsDemo,
  ctaContentDemo,
} from '@web/testing/modules/cta/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import type { ReactNode } from 'react';

import { CtaModuleView } from './cta-module-view';

vi.mock('@blog/ui/organisms/cta-module', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@blog/ui/organisms/cta-module')>();
  return {
    ...actual,
    CtaModule: vi.fn(actual.CtaModule),
  };
});

vi.mock('@web/components/shared/section', () => ({
  Section: ({
    brandVariant,
    titleId,
    children,
  }: {
    brandVariant: string;
    titleId?: string;
    children?: ReactNode;
  }) => (
    <section aria-labelledby={titleId} data-brand-variant={brandVariant}>
      {children}
    </section>
  ),
}));

const setup = customRender(CtaModuleView, {
  id: 'cta-1',
  variant: CTA_VARIANT.CALLOUT,
  brandVariant: BRAND_VARIANT.PRIMARY,
  bandTone: BRAND_VARIANT.SECONDARY,
  eyebrow: undefined,
  headingBlock: makeHeadingBlock({
    heading: 'Get started',
  }),
  content: undefined,
  image: undefined,
  contentPosition: undefined,
  contentAlignment: undefined,
  mobileMediaOrder: undefined,
  ctaButtons: [],
  footnote: undefined,
  layout: undefined,
});

describe(`<${CtaModuleView.name}/>`, () => {
  it('renders the heading with a unique id derived from the module id', () => {
    setup();

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Get started',
    });
    expect(heading).toHaveAttribute('id', 'cta-cta-1');

    const section = heading.closest('section');
    expect(section).toHaveAttribute('aria-labelledby', 'cta-cta-1');
  });

  it('derives a different heading id for a different module id, avoiding duplicate DOM ids', () => {
    setup({
      id: 'cta-2',
      headingBlock: makeHeadingBlock({
        heading: 'Join us',
      }),
    });

    const heading = screen.getByRole('heading', { level: 2, name: 'Join us' });
    expect(heading).toHaveAttribute('id', 'cta-cta-2');
  });

  it('renders the authored bandTone on the Section landmark', () => {
    setup();

    const section = screen
      .getByRole('heading', { level: 2 })
      .closest('section');
    expect(section).toHaveAttribute(
      'data-brand-variant',
      BRAND_VARIANT.SECONDARY,
    );
  });

  it('wires bandTone (Section band) independently of brandVariant (card tone)', () => {
    setup({
      bandTone: BRAND_VARIANT.SECONDARY,
      brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
    });

    const section = screen
      .getByRole('heading', { level: 2 })
      .closest('section');
    expect(section).toHaveAttribute(
      'data-brand-variant',
      BRAND_VARIANT.SECONDARY,
    );
  });

  it('renders authored primary and secondary ctaButtons through ActionGroup, in order', () => {
    setup({ ctaButtons: ctaActionsDemo });

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveTextContent('Subscribe now');
    expect(links[1]).toHaveTextContent('Learn more');
  });

  it('renders no buttons when ctaButtons is empty', () => {
    setup({ ctaButtons: [] });

    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('renders the optional content field via PortableText', () => {
    setup({ content: ctaContentDemo });

    expect(screen.getByText('14-day trial')).toBeVisible();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders no image slot when none is authored (Callout has no image)', () => {
    setup();

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('passes contentPosition and contentAlignment through to CtaModule', () => {
    setup({
      variant: CTA_VARIANT.SPLIT,
      contentPosition: CONTENT_ALIGNMENT.RIGHT,
      contentAlignment: CONTENT_ALIGNMENT.RIGHT,
    });

    expect(vi.mocked(CtaModule)).toHaveBeenLastCalledWith(
      expect.objectContaining({
        contentPosition: CONTENT_ALIGNMENT.RIGHT,
        contentAlignment: CONTENT_ALIGNMENT.RIGHT,
      }),
      undefined,
    );
  });
});
