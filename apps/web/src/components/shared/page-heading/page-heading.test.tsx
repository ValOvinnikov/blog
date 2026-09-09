import { CONTENT_ALIGNMENT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';

import { PageHeading } from './page-heading';

const setup = customRender(PageHeading, {
  heading: 'Notes on building things',
  supportingText: undefined,
  align: undefined,
  visual: undefined,
});

describe(PageHeading, () => {
  it('renders the heading as an h1', () => {
    setup();

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Notes on building things',
      }),
    ).toBeVisible();
  });

  it('renders no supporting paragraph when supportingText is absent', () => {
    setup();

    expect(screen.queryByText(/./, { selector: 'p' })).not.toBeInTheDocument();
  });

  it('renders the supporting text when given', () => {
    setup({ supportingText: 'Essays and notes from the team.' });

    expect(screen.getByText('Essays and notes from the team.')).toBeVisible();
  });

  it('aligns left by default', () => {
    setup();

    expect(
      screen.getByRole('heading', { name: 'Notes on building things' }),
    ).toHaveClass('text-left');
  });

  it('aligns the heading and supporting text center when align is CENTER', () => {
    setup({
      align: CONTENT_ALIGNMENT.CENTER,
      supportingText: 'Essays and notes from the team.',
    });

    expect(
      screen.getByRole('heading', { name: 'Notes on building things' }),
    ).toHaveClass('text-center');
    expect(screen.getByText('Essays and notes from the team.')).toHaveClass(
      'text-center',
    );
  });

  it('aligns the heading and supporting text right when align is RIGHT', () => {
    setup({
      align: CONTENT_ALIGNMENT.RIGHT,
      supportingText: 'Essays and notes from the team.',
    });

    expect(
      screen.getByRole('heading', { name: 'Notes on building things' }),
    ).toHaveClass('text-right');
    expect(screen.getByText('Essays and notes from the team.')).toHaveClass(
      'text-right',
    );
  });

  it('renders a plain h1 with no Heading-atom styling by default, matching the archive pages', () => {
    setup();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'Notes on building things',
    });

    expect(heading).toHaveClass('mb-6');
    expect(heading).not.toHaveClass('font-display');
    expect(heading).not.toHaveClass('font-medium');
    expect(heading).not.toHaveClass('text-title-2xl');
    expect(heading).not.toHaveClass('text-display');
  });

  it('renders the section-styled Heading atom when visual is "section", matching the landing page', () => {
    setup({ visual: 'section' });

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'Notes on building things',
    });

    expect(heading).toHaveClass('font-display');
    expect(heading).toHaveClass('font-medium');
    expect(heading).toHaveClass('text-title-2xl');
    expect(heading).toHaveClass('mb-6');
  });

  it('keeps the heading trailing margin by default, with no supporting text', () => {
    setup();

    expect(
      screen.getByRole('heading', { name: 'Notes on building things' }),
    ).toHaveClass('mb-6');
  });

  it('drops the heading trailing margin when hasTrailingSpace is false and there is no supporting text', () => {
    setup({ hasTrailingSpace: false });

    const heading = screen.getByRole('heading', {
      name: 'Notes on building things',
    });

    expect(heading).toHaveClass('mb-0');
    expect(heading).not.toHaveClass('mb-6');
  });

  it('keeps the heading margin but drops the supporting text margin when hasTrailingSpace is false and supporting text is given', () => {
    setup({
      supportingText: 'Essays and notes from the team.',
      hasTrailingSpace: false,
    });

    const heading = screen.getByRole('heading', {
      name: 'Notes on building things',
    });
    const supportingText = screen.getByText('Essays and notes from the team.');

    expect(heading).toHaveClass('mb-6');
    expect(supportingText).toHaveClass('mb-0');
    expect(supportingText).not.toHaveClass('mb-6');
  });

  it('keeps the supporting text trailing margin by default when supporting text is given', () => {
    setup({ supportingText: 'Essays and notes from the team.' });

    expect(screen.getByText('Essays and notes from the team.')).toHaveClass(
      'mb-6',
    );
  });
});
