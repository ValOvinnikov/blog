import { customRender, screen } from '@web/testing/custom-render';
import {
  ctaActionsDemo,
  ctaContentDemo,
  makeCtaModuleData,
} from '@web/testing/modules/cta/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { CtaModuleView } from './cta-module-view';

const setup = customRender(CtaModuleView, {
  id: 'cta-1',
  ...makeCtaModuleData(),
});

describe(`<${CtaModuleView.name}/>`, () => {
  it('labels the section by a heading whose id derives from the module id', () => {
    setup();

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Get started',
    });
    expect(heading).toHaveAttribute('id', 'cta-cta-1');

    expect(screen.getByRole('region', { name: 'Get started' })).toBeVisible();
  });

  it('derives a distinct heading id from a distinct module id', () => {
    setup({
      id: 'cta-2',
      headingBlock: makeHeadingBlock({
        heading: 'Join us',
      }),
    });

    const heading = screen.getByRole('heading', { level: 2, name: 'Join us' });
    expect(heading).toHaveAttribute('id', 'cta-cta-2');
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

  it('renders no image when none is authored', () => {
    setup();

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
