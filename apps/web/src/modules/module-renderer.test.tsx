import {
  customRender,
  customRenderAsync,
  screen,
} from '@web/testing/custom-render';
import { logger } from '@web/utils/logger/logger';

import { renderHeroModule, renderModules } from './module-renderer';

const { ctaModuleMock, postListModuleMock, heroModuleMock } = vi.hoisted(
  () => ({
    ctaModuleMock: vi.fn(({ id }: { id: string }) => (
      <div data-testid="stub-cta">{id}</div>
    )),
    postListModuleMock: vi.fn(({ id }: { id: string }) => (
      <div data-testid="stub-post-list">{id}</div>
    )),
    heroModuleMock: vi.fn(async ({ id }: { id: string }) => (
      <div data-testid="stub-hero">{id}</div>
    )),
  }),
);

const loggerWarnMock = vi.mocked(logger.warn);

const moduleMap = {
  module_cta: ctaModuleMock,
  module_postList: postListModuleMock,
};

const heroMap = {
  module_hero: heroModuleMock,
};

const CTA_ID = 'cta-doc-id';
const POST_LIST_ID = 'post-list-id';
const HERO_ID = 'hero-doc-id';

describe(renderModules.name, () => {
  const setup = customRender(renderModules, {
    modules: [{ type: 'module_cta', id: CTA_ID }],
    map: moduleMap,
  });

  describe('with the default modules', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the mapped component for a known module type with its id', () => {
      expect(screen.getByTestId('stub-cta')).toHaveTextContent(CTA_ID);
    });

    it('forwards id to every module component', () => {
      expect(ctaModuleMock).toHaveBeenCalledWith(
        {
          id: CTA_ID,
        },
        undefined,
      );
    });
  });

  it('forwards a caller-provided context, including page, to every module component', () => {
    setup({ context: { page: 2 } });

    expect(ctaModuleMock).toHaveBeenCalledWith(
      {
        id: CTA_ID,
        context: { page: 2 },
      },
      undefined,
    );
  });

  it('renders a module_postList entry through the given map', () => {
    setup({
      modules: [{ type: 'module_postList', id: POST_LIST_ID }],
    });

    expect(screen.getByTestId('stub-post-list')).toHaveTextContent(
      POST_LIST_ID,
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
        { type: 'module_cta', id: CTA_ID },
        { type: 'module_postList', id: POST_LIST_ID },
      ],
    });

    const stubs = screen.getAllByTestId(/^stub-/);
    expect(stubs.map((node) => node.textContent)).toEqual([
      CTA_ID,
      POST_LIST_ID,
    ]);
  });
});

describe(renderHeroModule.name, () => {
  const setup = customRenderAsync(renderHeroModule, {
    hero: { id: HERO_ID, type: 'module_hero' },
    map: heroMap,
  });

  describe('with the default hero', () => {
    beforeEach(async () => {
      await setup();
    });

    it('dispatches to the registered hero component for a known type', async () => {
      expect(screen.getByTestId('stub-hero')).toHaveTextContent(HERO_ID);
    });

    it('forwards id to the registered hero component', async () => {
      expect(heroModuleMock).toHaveBeenCalledWith({
        id: HERO_ID,
      });
    });
  });

  it('renders nothing for a hero type the map does not know and warns once', async () => {
    const { container } = await setup({
      hero: { id: HERO_ID, type: 'module_heroUnknown' as never },
    });

    expect(container).toBeEmptyDOMElement();
    expect(loggerWarnMock).toHaveBeenCalledTimes(1);
    expect(loggerWarnMock).toHaveBeenCalledWith('hero_slot.unknown_hero_type', {
      heroType: 'module_heroUnknown',
    });
  });
});
