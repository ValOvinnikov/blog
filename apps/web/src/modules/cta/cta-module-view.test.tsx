import { BRAND_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';

import { CtaModuleView } from './cta-module-view';

const setup = customRender(CtaModuleView, {
  id: 'cta-1',
  brandVariant: BRAND_VARIANT.PRIMARY,
  sectionHeader: {
    heading: 'Get started',
    supportingText: undefined,
    align: undefined,
  },
  action: undefined,
  layout: undefined,
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
});
