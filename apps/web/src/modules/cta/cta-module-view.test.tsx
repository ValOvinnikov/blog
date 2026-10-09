import { customRender, screen } from '@web/testing/custom-render';
import {
  ctaActionsDemo,
  ctaContentDemo,
  makeCtaModuleData,
} from '@web/testing/modules/cta/fixtures';

import { CtaModuleView } from './cta-module-view';

vi.mock('@web/i18n/navigation');

const setup = customRender(CtaModuleView, {
  id: 'cta-1',
  ...makeCtaModuleData(),
});

describe(`<${CtaModuleView.name}/>`, () => {
  describe('with the default module data', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the section by its heading', () => {
      expect(screen.getByRole('region', { name: 'Get started' })).toBeVisible();
    });

    it('renders no image when none is authored', () => {
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  it('gives two instances of the same module distinct heading ids', () => {
    setup();
    setup();

    const headingIds = screen
      .getAllByRole('heading', {
        level: 2,
        name: 'Get started',
      })
      .map(({ id }) => id);
    expect(new Set(headingIds).size).toBe(2);
    expect(screen.getAllByRole('region', { name: 'Get started' })).toHaveLength(
      2,
    );
  });

  it('renders the authored ctaButtons as links, in order', () => {
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
});
