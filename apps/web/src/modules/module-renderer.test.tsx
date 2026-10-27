import { faker } from '@faker-js/faker';
import {
  customRender,
  customRenderAsync,
  screen,
} from '@web/testing/custom-render';
import { logger } from '@web/utils/logger/logger';

import { renderHeroModule, renderModules } from './module-renderer';

faker.seed(6011);

const { STUB_TEST_ID, STUB_PAGE_TEST_ID, StubModule, StubHeroModule } =
  vi.hoisted(() => {
    const stubTestId = 'stub-module';
    const stubPageTestId = 'stub-page';

    return {
      STUB_TEST_ID: stubTestId,
      STUB_PAGE_TEST_ID: stubPageTestId,
      StubModule: ({
        id,
        context,
      }: {
        id: string;
        context?: { page?: number };
      }) => (
        <>
          <div data-testid={stubTestId}>{id}</div>
          <output data-testid={stubPageTestId}>{context?.page}</output>
        </>
      ),
      StubHeroModule: async ({ id }: { id: string }) => (
        <div data-testid={stubTestId}>{id}</div>
      ),
    };
  });

const moduleMap = {
  module_cta: StubModule,
  module_postList: StubModule,
};

const heroMap = {
  module_hero: StubHeroModule,
};

const MOCK_CTA_ID = faker.string.uuid();
const MOCK_POST_LIST_ID = faker.string.uuid();
const MOCK_HERO_ID = faker.string.uuid();
const MOCK_PAGE = faker.number.int({ min: 2, max: 9 });
const MOCK_UNKNOWN_MODULE_TYPE = 'module_unknown';
const MOCK_UNKNOWN_HERO_TYPE = 'module_heroUnknown';

const setupModules = customRender(renderModules, {
  modules: [{ type: 'module_cta', id: MOCK_CTA_ID }],
  map: moduleMap,
});

const setupHero = customRenderAsync(renderHeroModule, {
  hero: { id: MOCK_HERO_ID, type: 'module_hero' },
  map: heroMap,
});

describe(renderModules, () => {
  it('renders the mapped component for a known module type with its id', () => {
    setupModules();

    const stub = screen.getByTestId(STUB_TEST_ID);

    expect(stub).toHaveTextContent(MOCK_CTA_ID);
  });

  it('forwards the caller-provided context to the module component', () => {
    setupModules({ context: { page: MOCK_PAGE } });

    const page = screen.getByTestId(STUB_PAGE_TEST_ID);

    expect(page).toHaveTextContent(String(MOCK_PAGE));
  });

  it('renders nothing for an unknown module type and warns once', () => {
    const { container } = setupModules({
      modules: [
        { type: MOCK_UNKNOWN_MODULE_TYPE as never, id: faker.string.uuid() },
      ],
    });

    expect(container).toBeEmptyDOMElement();
    expect(vi.mocked(logger.warn)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
      'module_renderer.unknown_module_type',
      { moduleType: MOCK_UNKNOWN_MODULE_TYPE },
    );
  });

  it('renders every module in the given order', () => {
    setupModules({
      modules: [
        { type: 'module_cta', id: MOCK_CTA_ID },
        { type: 'module_postList', id: MOCK_POST_LIST_ID },
      ],
    });

    const stubs = screen.getAllByTestId(STUB_TEST_ID);
    const renderedIds = stubs.map((stub) => stub.textContent);

    expect(renderedIds).toEqual([MOCK_CTA_ID, MOCK_POST_LIST_ID]);
  });
});

describe(renderHeroModule, () => {
  it('dispatches to the registered hero component for a known type', async () => {
    await setupHero();

    const stub = screen.getByTestId(STUB_TEST_ID);

    expect(stub).toHaveTextContent(MOCK_HERO_ID);
  });

  it('renders nothing for a hero type the map does not know and warns once', async () => {
    const { container } = await setupHero({
      hero: { id: MOCK_HERO_ID, type: MOCK_UNKNOWN_HERO_TYPE as never },
    });

    expect(container).toBeEmptyDOMElement();
    expect(vi.mocked(logger.warn)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
      'hero_slot.unknown_hero_type',
      { heroType: MOCK_UNKNOWN_HERO_TYPE },
    );
  });
});
