/**
 * @vitest-environment jsdom
 */
import {
  CAPABILITY,
  LOCALE_ISO_CODES,
  MODULE_PACK,
  SANITY_LOGIN_PROVIDER,
} from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';
import { entitlementGates } from '@blog/studio/schema-types/inputs/requirement-warning-input/entitlement-gates';
import { EVERY_MODULE_PACK } from '@blog/studio/schema-types/validation/entitled-module-packs/entitled-module-packs';
import { faker } from '@faker-js/faker';
import { render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { StudioMount } from './studio-mount';

const { STUDIO_LAYOUT_TEST_ID, receivedConfigs } = vi.hoisted(() => ({
  STUDIO_LAYOUT_TEST_ID: 'studio-layout-mock',
  receivedConfigs: [] as unknown[],
}));

vi.mock('sanity/structure');
vi.mock('sanity-plugin-media');
vi.mock('@sanity/vision');
vi.mock('@sanity/code-input', () => ({
  codeInput: () => ({ name: 'codeInput' }),
}));

vi.mock('sanity', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('sanity');
  return {
    ...actual,
    StudioProvider: ({
      config,
      children,
    }: {
      config: {
        projectId: string;
        dataset: string;
        basePath?: string;
        title: string;
        plugins?: TMaybeUndefined<{ name: string }>[];
      };
      children: React.ReactNode;
    }) => {
      receivedConfigs.push(config);
      return (
        <div data-testid="studio-provider-mock">
          {config.projectId}:{config.dataset}:{config.basePath}:{config.title}
          {config.plugins?.map((plugin) => plugin?.name).join(' ')}
          {children}
        </div>
      );
    },
    StudioLayout: () => <div data-testid={STUDIO_LAYOUT_TEST_ID} />,
  };
});

faker.seed(6017);

const MOCK_PROJECT_ID = faker.string.alphanumeric(8);
const MOCK_DATASET = faker.lorem.word();
const MOCK_BASE_PATH = `/${faker.lorem.word()}/studio`;
const MOCK_TITLE = faker.lorem.words(2);

const ENTITLEMENT_GATES_NAME = entitlementGates({
  entitledModulePacks: EVERY_MODULE_PACK,
}).name;

type TStudioMountOverrides = Partial<ComponentProps<typeof StudioMount>>;

const mountElement = (overrides: TStudioMountOverrides = {}) => (
  <StudioMount
    projectId={MOCK_PROJECT_ID}
    dataset={MOCK_DATASET}
    basePath={MOCK_BASE_PATH}
    title={MOCK_TITLE}
    {...overrides}
  />
);

const renderMount = (overrides: TStudioMountOverrides = {}) =>
  renderToStaticMarkup(mountElement(overrides));

const buildArrayProps = (): TStudioMountOverrides => ({
  enabledCapabilities: [CAPABILITY.NEWSLETTER],
  entitlements: { modulePacks: [MODULE_PACK.CORE] },
  liveLocales: [LOCALE_ISO_CODES.EN],
});

const configsAcrossRerender = (
  initial: TStudioMountOverrides,
  next: TStudioMountOverrides,
) => {
  receivedConfigs.length = 0;
  const { rerender } = render(mountElement(initial));
  rerender(mountElement(next));
  const [first, second] = receivedConfigs;
  return { first, second };
};

describe(`<${StudioMount.name}/>`, () => {
  it('mounts the Studio layout with a config built from the given strings', () => {
    const html = renderMount();

    expect(html).toContain(
      `${MOCK_PROJECT_ID}:${MOCK_DATASET}:${MOCK_BASE_PATH}:${MOCK_TITLE}`,
    );
    expect(html).toContain(STUDIO_LAYOUT_TEST_ID);
  });

  it.each([
    {
      given: 'enabled capabilities',
      overrides: { enabledCapabilities: [CAPABILITY.NEWSLETTER] },
    },
    {
      given: 'entitlements',
      overrides: { entitlements: { modulePacks: [MODULE_PACK.CORE] } },
    },
  ])('gates the Studio by the $given', ({ overrides }) => {
    expect(renderMount(overrides)).toContain(ENTITLEMENT_GATES_NAME);
  });

  it('leaves the Studio ungated without capabilities or entitlements', () => {
    expect(renderMount()).not.toContain(ENTITLEMENT_GATES_NAME);
  });

  it.each([
    {
      given: 'only the scheme changes',
      next: { scheme: 'dark' as const },
    },
    {
      given: 'only the scheme handler changes',
      next: { onSchemeChange: vi.fn() },
    },
    {
      given: 'the array props are new but equal in value',
      next: buildArrayProps(),
    },
  ])('keeps the same config when $given', ({ next }) => {
    const initial = { ...buildArrayProps(), scheme: 'light' as const };
    const { first, second } = configsAcrossRerender(initial, {
      ...initial,
      ...next,
    });

    expect(second).toBe(first);
  });

  it.each([
    { given: 'project id', next: { projectId: faker.string.alphanumeric(9) } },
    { given: 'dataset', next: { dataset: faker.lorem.word() } },
    { given: 'base path', next: { basePath: `/${faker.lorem.word()}` } },
    { given: 'title', next: { title: faker.lorem.words(3) } },
    { given: 'default locale', next: { defaultLocale: LOCALE_ISO_CODES.EN } },
    {
      given: 'login provider',
      next: { loginProvider: SANITY_LOGIN_PROVIDER.GOOGLE },
    },
    {
      given: 'enabled capability list',
      next: {
        enabledCapabilities: [CAPABILITY.NEWSLETTER, CAPABILITY.COMMENTS],
      },
    },
    {
      given: 'entitled module packs',
      next: { entitlements: { modulePacks: [] } },
    },
    { given: 'live locales', next: { liveLocales: [] } },
  ])('builds a new config when the $given changes', ({ next }) => {
    const initial = buildArrayProps();
    const { first, second } = configsAcrossRerender(initial, {
      ...initial,
      ...next,
    });

    expect(second).not.toBe(first);
  });
});
