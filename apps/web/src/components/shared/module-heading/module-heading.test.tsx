import { CONTENT_ALIGNMENT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';

import { ModuleHeading } from './module-heading';

const setup = customRender(ModuleHeading, {
  heading: 'Latest posts',
  supportingText: undefined,
  accessibleTitle: 'Posts',
  id: 'section-title',
  level: 2,
  align: undefined,
});

describe(`<${ModuleHeading.name}/>`, () => {
  it('renders the authored heading text at the given level and id', () => {
    setup();

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Latest posts',
    });
    expect(heading).toHaveAttribute('id', 'section-title');
    expect(heading).not.toHaveClass('sr-only');
  });

  it('renders the accessible title as a visually hidden fallback when heading is blank', () => {
    setup({ heading: '   ' });

    const heading = screen.getByRole('heading', { level: 2, name: 'Posts' });
    expect(heading).toHaveClass('sr-only');
  });

  it('renders the accessible title as a visually hidden fallback when heading is undefined', () => {
    setup({ heading: undefined });

    const heading = screen.getByRole('heading', { level: 2, name: 'Posts' });
    expect(heading).toHaveClass('sr-only');
  });

  it('renders the heading tag at the given level', () => {
    setup({ level: 3 });

    expect(
      screen.getByRole('heading', { level: 3, name: 'Latest posts' }),
    ).toBeInTheDocument();
  });

  it('renders no supporting text paragraph when supportingText is absent', () => {
    setup();

    expect(screen.queryByText(/./, { selector: 'p' })).not.toBeInTheDocument();
  });

  it('renders the supporting text when given', () => {
    setup({ supportingText: 'Fresh from the blog.' });

    expect(screen.getByText('Fresh from the blog.')).toBeVisible();
  });

  it('aligns left by default', () => {
    setup();

    expect(screen.getByRole('heading', { name: 'Latest posts' })).toHaveClass(
      'text-left',
    );
  });

  it('aligns the heading and supporting text center when align is CENTER', () => {
    setup({
      align: CONTENT_ALIGNMENT.CENTER,
      supportingText: 'Fresh from the blog.',
    });

    expect(screen.getByRole('heading', { name: 'Latest posts' })).toHaveClass(
      'text-center',
    );
    expect(screen.getByText('Fresh from the blog.')).toHaveClass('text-center');
  });

  it('aligns the heading and supporting text right when align is RIGHT', () => {
    setup({
      align: CONTENT_ALIGNMENT.RIGHT,
      supportingText: 'Fresh from the blog.',
    });

    expect(screen.getByRole('heading', { name: 'Latest posts' })).toHaveClass(
      'text-right',
    );
    expect(screen.getByText('Fresh from the blog.')).toHaveClass('text-right');
  });
});
