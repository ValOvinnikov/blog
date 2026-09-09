import { customRender, screen } from '@web/testing/custom-render';

import { PageIntro } from './page-intro';

const { heroSlotMock } = vi.hoisted(() => ({
  heroSlotMock: vi.fn(({ id }: { id: string }) => (
    <div data-testid="hero-slot">{id}</div>
  )),
}));

vi.mock('@web/modules/hero-slot', () => ({
  HeroSlot: heroSlotMock,
}));

const setup = customRender(PageIntro, {
  hero: undefined,
  heading: undefined,
  supportingText: undefined,
  hasTrailingSpace: undefined,
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${PageIntro.name}/>`, () => {
  beforeEach(() => {
    heroSlotMock.mockClear();
  });

  it('renders the hero and not the heading when a hero is set', () => {
    setup({
      hero: { id: 'hero-1', type: 'module_hero' },
      heading: 'Notes on building things',
    });

    expect(screen.getByTestId('hero-slot')).toHaveTextContent('hero-1');
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('forwards id, type, locale, and tenant to HeroSlot', () => {
    setup({ hero: { id: 'hero-1', type: 'module_hero' } });

    expect(heroSlotMock).toHaveBeenCalledWith(
      { id: 'hero-1', type: 'module_hero', locale: 'en', tenant: 'tenant-1' },
      undefined,
    );
  });

  it('renders the PageHeading when there is no hero and a heading is given', () => {
    setup({
      heading: 'Notes on building things',
      supportingText: 'Essays and notes from the team.',
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

  it('renders nothing when there is no hero and no heading', () => {
    const { container } = setup();

    expect(container).toBeEmptyDOMElement();
    expect(heroSlotMock).not.toHaveBeenCalled();
  });
});
