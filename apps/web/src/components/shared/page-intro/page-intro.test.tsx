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
  locale: 'en',
  tenant: 'tenant-1',
  children: undefined,
});

describe(PageIntro, () => {
  beforeEach(() => {
    heroSlotMock.mockClear();
  });

  it('renders the hero and not the children when a hero is set', () => {
    setup({
      hero: { id: 'hero-1', type: 'module_hero' },
      children: <div data-testid="fallback">fallback</div>,
    });

    expect(screen.getByTestId('hero-slot')).toHaveTextContent('hero-1');
    expect(screen.queryByTestId('fallback')).not.toBeInTheDocument();
  });

  it('forwards id, type, locale, and tenant to HeroSlot', () => {
    setup({ hero: { id: 'hero-1', type: 'module_hero' } });

    expect(heroSlotMock).toHaveBeenCalledWith(
      { id: 'hero-1', type: 'module_hero', locale: 'en', tenant: 'tenant-1' },
      undefined,
    );
  });

  it('renders the children when no hero is set', () => {
    setup({ children: <div data-testid="fallback">fallback</div> });

    expect(screen.getByTestId('fallback')).toBeVisible();
    expect(heroSlotMock).not.toHaveBeenCalled();
  });

  it('renders nothing when there is no hero and no children', () => {
    const { container } = setup();

    expect(container).toBeEmptyDOMElement();
    expect(heroSlotMock).not.toHaveBeenCalled();
  });
});
