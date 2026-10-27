import { CAPABILITY } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { StudioMount } from './studio-mount';

const { STUDIO_LAYOUT_TEST_ID, INPUT_OVERRIDE_MARKER } = vi.hoisted(() => ({
  STUDIO_LAYOUT_TEST_ID: 'studio-layout-mock',
  INPUT_OVERRIDE_MARKER: 'has-input-override',
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
        form?: { components?: { input?: unknown } };
      };
      children: React.ReactNode;
    }) => (
      <div data-testid="studio-provider-mock">
        {config.projectId}:{config.dataset}:{config.basePath}:{config.title}
        {config.form?.components?.input ? INPUT_OVERRIDE_MARKER : null}
        {children}
      </div>
    ),
    StudioLayout: () => <div data-testid={STUDIO_LAYOUT_TEST_ID} />,
  };
});

faker.seed(6017);

const MOCK_PROJECT_ID = faker.string.alphanumeric(8);
const MOCK_DATASET = faker.lorem.word();
const MOCK_BASE_PATH = `/${faker.lorem.word()}/studio`;
const MOCK_TITLE = faker.lorem.words(2);

const renderMount = (
  overrides: Partial<ComponentProps<typeof StudioMount>> = {},
) =>
  renderToStaticMarkup(
    <StudioMount
      projectId={MOCK_PROJECT_ID}
      dataset={MOCK_DATASET}
      basePath={MOCK_BASE_PATH}
      title={MOCK_TITLE}
      {...overrides}
    />,
  );

describe(`<${StudioMount.name}/>`, () => {
  it('mounts the Studio layout with a config built from the given strings', () => {
    const html = renderMount();

    expect(html).toContain(
      `${MOCK_PROJECT_ID}:${MOCK_DATASET}:${MOCK_BASE_PATH}:${MOCK_TITLE}`,
    );
    expect(html).toContain(STUDIO_LAYOUT_TEST_ID);
  });

  it('applies the enabled capabilities to the Studio forms', () => {
    const html = renderMount({ enabledCapabilities: [CAPABILITY.NEWSLETTER] });

    expect(html).toContain(INPUT_OVERRIDE_MARKER);
  });
});
