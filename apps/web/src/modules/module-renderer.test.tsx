import {
  customRender,
  customRenderAsync,
  screen,
} from '@web/testing/custom-render';

import {
  ModuleRenderer,
  renderHeroModule,
  renderModules,
} from './module-renderer';

const { ctaModuleMock, postListModuleMock, heroModuleMock, loggerWarnMock } =
  vi.hoisted(() => ({
    ctaModuleMock: vi.fn(({ id }: { id: string; locale: string }) => (
      <div data-testid="stub-cta">{id}</div>
    )),
    postListModuleMock: vi.fn(({ id }: { id: string }) => (
      <div data-testid="stub-post-list">{id}</div>
    )),
    heroModuleMock: vi.fn(async ({ id }: { id: string }) => (
      <div data-testid="stub-hero">{id}</div>
    )),
    loggerWarnMock: vi.fn(),
  }));

vi.mock('./module-map', () => ({
  MODULE_MAP: {
    module_content: undefined,
    module_cta: ctaModuleMock,
    module_postList: postListModuleMock,
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

const moduleMap = {
  module_cta: ctaModuleMock,
  module_postList: postListModuleMock,
};

const heroMap = {
  module_hero: heroModuleMock,
};

describe(renderModules.name, () => {
  const setup = customRender(renderModules, {
    modules: [{ type: 'module_cta', id: 'cta-doc-id' }],
    map: moduleMap,
    locale: 'en',
    tenant: 'tenant-1',
  });

  it('renders the mapped component for a known module type with its id', () => {
    setup();

    expect(screen.getByTestId('stub-cta')).toHaveTextContent('cta-doc-id');
  });

  it('forwards id, locale, and tenant to every module component', () => {
    setup();

    expect(ctaModuleMock).toHaveBeenCalledWith(
      {
        id: 'cta-doc-id',
        locale: 'en',
        tenant: 'tenant-1',
      },
      undefined,
    );
  });

  it('forwards a caller-provided context, including page, to every module component', () => {
    setup({ context: { page: 2 } });

    expect(ctaModuleMock).toHaveBeenCalledWith(
      {
        id: 'cta-doc-id',
        locale: 'en',
        tenant: 'tenant-1',
        context: { page: 2 },
      },
      undefined,
    );
  });

  it('renders a module_postList entry through the given map', () => {
    setup({
      modules: [{ type: 'module_postList', id: 'post-list-id' }],
    });

    expect(screen.getByTestId('stub-post-list')).toHaveTextContent(
      'post-list-id',
    );
  });

  it('renders nothing for an unknown module type and warns once', () => {
    const { container } = setup({
      modules: [{ type: 'module_unknown' as never, id: 'x-id' }],
    });

    expect(container).toBeEmptyDOMElement();
    expect(loggerWarnMock).toHaveBeenCalledTimes(1);
    expect(loggerWarnMock).toHaveBeenCalledWith(
      'module_renderer.unknown_module_type',
      { moduleType: 'module_unknown' },
    );
  });

  it('renders every module keyed by its id, in the given order', () => {
    setup({
      modules: [
        { type: 'module_cta', id: 'cta-doc-id' },
        { type: 'module_postList', id: 'post-list-id' },
      ],
    });

    const stubs = screen.getAllByTestId(/^stub-/);
    expect(stubs.map((node) => node.textContent)).toEqual([
      'cta-doc-id',
      'post-list-id',
    ]);
  });
});

describe(renderHeroModule.name, () => {
  const setup = customRenderAsync(renderHeroModule, {
    hero: { id: 'hero-doc-id', type: 'module_hero' },
    map: heroMap,
    locale: 'en',
    tenant: 'tenant-1',
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

  it('renders nothing for a hero type the map does not know and warns once', async () => {
    const { container } = await setup({
      hero: { id: 'hero-doc-id', type: 'module_heroUnknown' as never },
    });

    expect(container).toBeEmptyDOMElement();
    expect(loggerWarnMock).toHaveBeenCalledTimes(1);
    expect(loggerWarnMock).toHaveBeenCalledWith('hero_slot.unknown_hero_type', {
      heroType: 'module_heroUnknown',
    });
  });
});

describe(`<${ModuleRenderer.name}/>`, () => {
  const setup = customRender(ModuleRenderer, {
    modules: [{ type: 'module_cta', id: 'cta-doc-id' }],
    locale: 'en',
    tenant: 'tenant-1',
  });

  it('renders through the global MODULE_MAP', () => {
    setup();

    expect(screen.getByTestId('stub-cta')).toHaveTextContent('cta-doc-id');
  });

  it('forwards a caller-provided context to the global MODULE_MAP', () => {
    setup({ context: { page: 2 } });

    expect(ctaModuleMock).toHaveBeenCalledWith(
      {
        id: 'cta-doc-id',
        locale: 'en',
        tenant: 'tenant-1',
        context: { page: 2 },
      },
      undefined,
    );
  });
});
