import { customRenderAsync, screen } from '@web/testing/custom-render';

import { HeroSlot } from './hero-slot';

const { heroModuleMock, loggerWarnMock } = vi.hoisted(() => ({
  heroModuleMock: vi.fn(({ id }: { id: string }) => (
    <div data-testid="stub-hero">{id}</div>
  )),
  loggerWarnMock: vi.fn(),
}));

vi.mock('./hero-map', () => ({
  HERO_MAP: {
    module_hero: heroModuleMock,
  },
}));

vi.mock('@web/utils/logger/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: loggerWarnMock,
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

const setup = customRenderAsync(HeroSlot, {
  id: 'hero-doc-id',
  type: 'module_hero',
  locale: 'en',
  tenant: 'tenant-1',
});

describe('HeroSlot', () => {
  beforeEach(() => {
    heroModuleMock.mockClear();
    loggerWarnMock.mockClear();
  });

  it('dispatches to the registered hero component for a known type', async () => {
    await setup();

    expect(screen.getByTestId('stub-hero')).toHaveTextContent('hero-doc-id');
  });

  it('forwards id, locale, and tenant to the registered hero component', async () => {
    await setup();

    expect(heroModuleMock).toHaveBeenCalledWith({
      id: 'hero-doc-id',
      locale: 'en',
      tenant: 'tenant-1',
    });
  });

  it('renders nothing and warns for a hero type the map does not know', async () => {
    const { container } = await setup({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: 'module_heroUnknown' as any,
    });

    expect(container).toBeEmptyDOMElement();
    expect(loggerWarnMock).toHaveBeenCalledWith('hero_slot.unknown_hero_type', {
      heroType: 'module_heroUnknown',
    });
  });
});
