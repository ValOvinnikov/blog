import { MODULE_RENDERER_LOG } from '@web/constants/module-renderer';
import { screen } from '@web/testing/custom-render';
import type { TAsyncSetup } from '@web/testing/shared/async-setup/async-setup';
import type { Mock } from 'vitest';

import {
  MOCK_CHILDREN_STUB_TEST_ID,
  MOCK_CTA_STUB_TEST_ID,
  MOCK_FEATURE_LIST_STUB_TEST_ID,
  MOCK_HERO_PROFILE_STUB_TEST_ID,
  MOCK_HERO_STUB_TEST_ID,
  MOCK_TESTIMONIAL_STUB_TEST_ID,
  mockModule,
} from './fixtures';

const getStubTestIds = () =>
  screen
    .getAllByTestId(/^stub-/)
    .map((stub) => stub.getAttribute('data-testid'));

interface IWithSetup {
  setup: TAsyncSetup;
}

export const testHeadingWithoutHero = ({
  setup,
  headingText,
}: IWithSetup & { headingText: string }) => {
  it('renders the page heading as the only h1 when the page has no hero', async () => {
    await setup();

    const h1Headings = screen.getAllByRole('heading', { level: 1 });
    const pageHeading = screen.getByRole('heading', {
      level: 1,
      name: headingText,
    });

    expect(h1Headings).toHaveLength(1);
    expect(pageHeading).toBeVisible();
  });
};

export const testResolvedHero = ({ setup }: IWithSetup) => {
  it('renders the resolved hero as the only h1 when the hero has content', async () => {
    const hero = mockModule('module_heroBlog');

    await setup({ hero });

    const h1Headings = screen.getAllByRole('heading', { level: 1 });
    const heroStub = screen.getByTestId(MOCK_HERO_STUB_TEST_ID);

    expect(h1Headings).toHaveLength(1);
    expect(heroStub).toHaveTextContent(hero.id);
  });
};

export const testHeroBeforeModules = ({
  setup,
  modules,
  expectedTestIds,
}: IWithSetup & { modules: unknown[]; expectedTestIds: string[] }) => {
  it('renders the resolved hero before the modules when the page has both', async () => {
    await setup({ hero: mockModule('module_heroBlog'), modules });

    const stubTestIds = getStubTestIds();

    expect(stubTestIds).toEqual(expectedTestIds);
  });
};

export const testFallsBackToHeadingWithoutHero = ({
  setup,
  heroBlogModuleMock,
  headingText,
}: IWithSetup & { heroBlogModuleMock: Mock; headingText: string }) => {
  it('falls back to the page heading as the only h1 when the hero is empty', async () => {
    heroBlogModuleMock.mockResolvedValueOnce(null);

    await setup({ hero: mockModule('module_heroBlog') });

    const h1Headings = screen.getAllByRole('heading', { level: 1 });
    const pageHeading = screen.getByRole('heading', {
      level: 1,
      name: headingText,
    });
    const heroStub = screen.queryByTestId(MOCK_HERO_STUB_TEST_ID);

    expect(h1Headings).toHaveLength(1);
    expect(pageHeading).toBeVisible();
    expect(heroStub).not.toBeInTheDocument();
  });
};

export const testHeroProfileHero = ({
  setup,
  loggerWarnMock,
}: IWithSetup & { loggerWarnMock: Mock }) => {
  it('renders a module_heroProfile hero via the map', async () => {
    const hero = mockModule('module_heroProfile');

    await setup({ hero });

    const h1Headings = screen.getAllByRole('heading', { level: 1 });
    const heroProfileStub = screen.getByTestId(MOCK_HERO_PROFILE_STUB_TEST_ID);

    expect(h1Headings).toHaveLength(1);
    expect(heroProfileStub).toHaveTextContent(hero.id);
    expect(loggerWarnMock).not.toHaveBeenCalled();
  });
};

export const testFeatureListModule = ({
  setup,
  loggerWarnMock,
}: IWithSetup & { loggerWarnMock: Mock }) => {
  it('renders a module_featureList module via the map', async () => {
    const featureListModule = mockModule('module_featureList');

    await setup({ modules: [featureListModule] });

    const featureListStub = screen.getByTestId(MOCK_FEATURE_LIST_STUB_TEST_ID);

    expect(featureListStub).toHaveTextContent(featureListModule.id);
    expect(loggerWarnMock).not.toHaveBeenCalled();
  });
};

export const testTestimonialModule = ({
  setup,
  loggerWarnMock,
}: IWithSetup & { loggerWarnMock: Mock }) => {
  it('renders a module_testimonial module via the map', async () => {
    const testimonialModule = mockModule('module_testimonial');

    await setup({ modules: [testimonialModule] });

    const testimonialStub = screen.getByTestId(MOCK_TESTIMONIAL_STUB_TEST_ID);

    expect(testimonialStub).toHaveTextContent(testimonialModule.id);
    expect(loggerWarnMock).not.toHaveBeenCalled();
  });
};

export const testWarnsForUnknownModule = ({
  setup,
  loggerWarnMock,
  unknownModule,
  description,
}: IWithSetup & {
  loggerWarnMock: Mock;
  unknownModule: { id: string; type: string };
  description: string;
}) => {
  it(description, async () => {
    await setup({ modules: [unknownModule] });

    const unknownModuleText = screen.queryByText(unknownModule.id);

    expect(unknownModuleText).not.toBeInTheDocument();
    expect(loggerWarnMock).toHaveBeenCalledTimes(1);
    expect(loggerWarnMock).toHaveBeenCalledWith(
      MODULE_RENDERER_LOG.UNKNOWN_MODULE_TYPE,
      { moduleType: unknownModule.type },
    );
  });
};

export const testRendersAllowedModulesInOrder = ({
  setup,
  modules,
}: IWithSetup & { modules: { id: string; type: string }[] }) => {
  it('renders every allowed module keyed by its id, in the given order', async () => {
    await setup({ modules });

    const stubs = screen.getAllByTestId(/^stub-/);
    const stubTexts = stubs.map((stub) => stub.textContent);

    expect(stubTexts).toEqual(modules.map(({ id }) => id));
  });
};

export const testChildrenBetweenHeroAndModules = ({ setup }: IWithSetup) => {
  it('renders the given children between the hero and the modules', async () => {
    await setup({
      hero: mockModule('module_heroBlog'),
      modules: [mockModule('module_cta')],
      children: <div data-testid={MOCK_CHILDREN_STUB_TEST_ID} />,
    });

    const stubTestIds = getStubTestIds();

    expect(stubTestIds).toEqual([
      MOCK_HERO_STUB_TEST_ID,
      MOCK_CHILDREN_STUB_TEST_ID,
      MOCK_CTA_STUB_TEST_ID,
    ]);
  });
};
