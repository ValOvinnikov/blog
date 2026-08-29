import { BRAND_VARIANT, CTA_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import {
  ctaActionsDemo,
  ctaContentDemo,
} from '@web/testing/modules/cta/fixtures';

import { CtaModuleView } from './cta-module-view';

const setup = customRender(CtaModuleView, {
  id: 'cta-1',
  variant: CTA_VARIANT.CALLOUT,
  brandVariant: BRAND_VARIANT.PRIMARY,
  eyebrow: undefined,
  sectionHeader: {
    heading: 'Get started',
    supportingText: undefined,
    align: undefined,
  },
  content: undefined,
  image: undefined,
  imageSide: undefined,
  mobileMediaOrder: undefined,
  actions: undefined,
  footnote: undefined,
  layout: undefined,
  baseUrl: 'https://cdn.sanity.io/images/test-project/test-dataset/',
});

describe(CtaModuleView, () => {
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
      sectionHeader: {
        heading: 'Join us',
        supportingText: undefined,
        align: undefined,
      },
    });

    const heading = screen.getByRole('heading', { level: 2, name: 'Join us' });
    expect(heading).toHaveAttribute('id', 'cta-cta-2');
  });

  it('pins the Section landmark to PRIMARY regardless of the authored brandVariant', () => {
    setup({ brandVariant: BRAND_VARIANT.BRAND_PRIMARY });

    const section = screen
      .getByRole('heading', { level: 2 })
      .closest('section');
    expect(section).toHaveClass('bg-primary');
    expect(section).not.toHaveClass('bg-brand-primary-muted');
  });

  it('renders authored actions through ActionGroup, in order', () => {
    setup({ actions: ctaActionsDemo });

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveTextContent('Subscribe now');
    expect(links[1]).toHaveTextContent('Learn more');
  });

  it('renders the optional content field via BasicTextRenderer', () => {
    setup({ content: ctaContentDemo });

    expect(screen.getByText('14-day trial')).toBeVisible();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders no image slot when none is authored (Callout has no image)', () => {
    setup();

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
