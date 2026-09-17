import { customRenderAsync, screen } from '@web/testing/custom-render';
import type { ReactNode } from 'react';

import { PageIntro } from './page-intro';

const { heroSlotMock } = vi.hoisted(() => ({
  heroSlotMock: vi.fn(({ id }: { id: string }): ReactNode => (
    <div data-testid="hero-slot">{id}</div>
  )),
}));

vi.mock('@web/modules/hero-slot', () => ({
  HeroSlot: heroSlotMock,
}));

const setup = customRenderAsync(PageIntro, {
  hero: undefined,
  headingBlock: {
    heading: 'Notes on building things',
    supportingText: undefined,
  },
  hasTrailingSpace: undefined,
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${PageIntro.name}/>`, () => {
  it('renders the hero and not the heading when a hero resolves to content', async () => {
    await setup({
      hero: { id: 'hero-1', type: 'module_hero' },
      headingBlock: {
        heading: 'Notes on building things',
        supportingText: undefined,
      },
    });

    expect(screen.getByTestId('hero-slot')).toHaveTextContent('hero-1');
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('forwards id, type, locale, and tenant to HeroSlot', async () => {
    await setup({ hero: { id: 'hero-1', type: 'module_hero' } });

    expect(heroSlotMock).toHaveBeenCalledWith({
      id: 'hero-1',
      type: 'module_hero',
      locale: 'en',
      tenant: 'tenant-1',
    });
  });

  it('renders the PageHeading when there is no hero and a heading is given', async () => {
    await setup({
      headingBlock: {
        heading: 'Notes on building things',
        supportingText: 'Essays and notes from the team.',
      },
    });

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Notes on building things',
      }),
    ).toBeVisible();
    expect(screen.getByText('Essays and notes from the team.')).toBeVisible();
    expect(heroSlotMock).not.toHaveBeenCalled();
  });

  it('falls back to the PageHeading when the hero resolves to nothing', async () => {
    heroSlotMock.mockReturnValueOnce(null);

    await setup({
      hero: { id: 'hero-1', type: 'module_hero' },
      headingBlock: {
        heading: 'Notes on building things',
        supportingText: undefined,
      },
    });

    expect(screen.queryByTestId('hero-slot')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Notes on building things',
      }),
    ).toBeVisible();
  });
});
