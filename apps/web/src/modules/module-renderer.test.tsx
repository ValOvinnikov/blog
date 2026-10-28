import { faker } from '@faker-js/faker';
import { MODULE_RENDERER_LOG } from '@web/constants/module-renderer';
import { isModuleEntitled } from '@web/server/settings-features/is-module-entitled/is-module-entitled';
import {
  customRenderAsync,
  customRenderServerAsync,
  screen,
} from '@web/testing/custom-render';
import { logger } from '@web/utils/logger/logger';

import {
  type IRenderModulesProps,
  renderHeroModule,
  renderModules,
} from './module-renderer';

faker.seed(6011);

vi.mock('@web/server/settings-features/is-module-entitled/is-module-entitled');

const isModuleEntitledMock = vi.mocked(isModuleEntitled);

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
  module_stats: StubModule,
};

const heroMap = {
  module_hero: StubHeroModule,
};

const MOCK_CTA_ID = faker.string.uuid();
const MOCK_POST_LIST_ID = faker.string.uuid();
const MOCK_STATS_ID = faker.string.uuid();
const MOCK_HERO_ID = faker.string.uuid();
const MOCK_PAGE = faker.number.int({ min: 2, max: 9 });
const MOCK_UNKNOWN_MODULE_TYPE = 'module_unknown';
const MOCK_UNKNOWN_HERO_TYPE = 'module_heroUnknown';

const setupModules = customRenderServerAsync(
  async (props: IRenderModulesProps) => renderModules(props),
  {
    modules: [{ type: 'module_cta', id: MOCK_CTA_ID }],
    map: moduleMap,
  },
);

const entitleOnly =
  (...entitledTypes: string[]) =>
  async (moduleType: string) =>
    entitledTypes.includes(moduleType);

beforeEach(() => {
  isModuleEntitledMock.mockReset();
  isModuleEntitledMock.mockResolvedValue(true);
});

const setupHero = customRenderAsync(renderHeroModule, {
  hero: { id: MOCK_HERO_ID, type: 'module_hero' },
  map: heroMap,
});

describe(renderModules, () => {
  it('renders the mapped component for a known module type with its id', async () => {
    await setupModules();

    const stub = screen.getByTestId(STUB_TEST_ID);

    expect(stub).toHaveTextContent(MOCK_CTA_ID);
  });

  it('forwards the caller-provided context to the module component', async () => {
    await setupModules({ context: { page: MOCK_PAGE } });

    const page = screen.getByTestId(STUB_PAGE_TEST_ID);

    expect(page).toHaveTextContent(String(MOCK_PAGE));
  });

  it('renders nothing for an unknown module type and warns once', async () => {
    const { container } = await setupModules({
      modules: [
        { type: MOCK_UNKNOWN_MODULE_TYPE as never, id: faker.string.uuid() },
      ],
    });

    expect(container).toBeEmptyDOMElement();
    expect(vi.mocked(logger.warn)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
      MODULE_RENDERER_LOG.UNKNOWN_MODULE_TYPE,
      { moduleType: MOCK_UNKNOWN_MODULE_TYPE },
    );
  });

  it('renders every module in the given order', async () => {
    await setupModules({
      modules: [
        { type: 'module_cta', id: MOCK_CTA_ID },
        { type: 'module_postList', id: MOCK_POST_LIST_ID },
      ],
    });

    const stubs = screen.getAllByTestId(STUB_TEST_ID);
    const renderedIds = stubs.map((stub) => stub.textContent);

    expect(renderedIds).toEqual([MOCK_CTA_ID, MOCK_POST_LIST_ID]);
  });

  it('skips a module the tenant is not entitled to and renders the rest in order', async () => {
    isModuleEntitledMock.mockImplementation(
      entitleOnly('module_cta', 'module_postList'),
    );

    await setupModules({
      modules: [
        { type: 'module_cta', id: MOCK_CTA_ID },
        { type: 'module_stats', id: MOCK_STATS_ID },
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
      MODULE_RENDERER_LOG.UNKNOWN_HERO_TYPE,
      { heroType: MOCK_UNKNOWN_HERO_TYPE },
    );
  });

  it('renders nothing for a hero the tenant is not entitled to', async () => {
    isModuleEntitledMock.mockResolvedValue(false);

    const { container } = await setupHero();

    expect(container).toBeEmptyDOMElement();
  });
});
