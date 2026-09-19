import { screen } from '@web/testing/custom-render';
import type { TAsyncSetup } from '@web/testing/shared/async-setup/async-setup';
import type { Mock } from 'vitest';

interface IWithSetup {
  setup: TAsyncSetup;
}

export const testHeadingWithoutHero = ({
  setup,
  headingText,
}: IWithSetup & { headingText: string }) => {
  it('renders the page heading, with exactly one h1, when the page has no hero', async () => {
    await setup();

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(headingText);
  });
};

export const testResolvedHero = ({ setup }: IWithSetup) => {
  it('renders the resolved hero, with exactly one h1, when the hero resolves to content', async () => {
    await setup({ hero: { id: 'hero-1', type: 'module_heroBlog' } });

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(screen.getByTestId('stub-hero')).toHaveTextContent('hero-1');
  });
};

export const testHeroBeforeModules = ({
  setup,
  modules,
  expectedTestIds,
}: IWithSetup & { modules: unknown[]; expectedTestIds: string[] }) => {
  it('renders the resolved hero before the modules when the page has both', async () => {
    await setup({ hero: { id: 'hero-1', type: 'module_heroBlog' }, modules });

    const nodes = screen.getAllByTestId(/^stub-/);
    expect(nodes.map((node) => node.getAttribute('data-testid'))).toEqual(
      expectedTestIds,
    );
  });
};

export const testFallsBackToHeadingWithoutHero = ({
  setup,
  heroBlogModuleMock,
  headingText,
}: IWithSetup & { heroBlogModuleMock: Mock; headingText: string }) => {
  it('falls back to the page heading, still exactly one h1, when the hero resolves to nothing', async () => {
    heroBlogModuleMock.mockResolvedValueOnce(null);

    await setup({ hero: { id: 'hero-2', type: 'module_heroBlog' } });

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(headingText);
    expect(screen.queryByTestId('stub-hero')).not.toBeInTheDocument();
  });
};

export const testHeroProfileHero = ({
  setup,
  loggerWarnMock,
}: IWithSetup & { loggerWarnMock: Mock }) => {
  it('renders a module_heroProfile hero via the map', async () => {
    await setup({ hero: { id: 'hero-3', type: 'module_heroProfile' } });

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(screen.getByTestId('stub-hero-profile')).toHaveTextContent('hero-3');
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

    expect(screen.queryByText(unknownModule.id)).not.toBeInTheDocument();
    expect(loggerWarnMock).toHaveBeenCalledTimes(1);
    expect(loggerWarnMock).toHaveBeenCalledWith(
      'module_renderer.unknown_module_type',
      { moduleType: unknownModule.type },
    );
  });
};

export const testRendersAllowedModulesInOrder = ({
  setup,
  modules,
  expectedOrder,
}: IWithSetup & { modules: unknown[]; expectedOrder: string[] }) => {
  it('renders every allowed module keyed by its id, in the given order', async () => {
    await setup({ modules });

    const stubs = screen.getAllByTestId(/^stub-/);
    expect(stubs.map((node) => node.textContent)).toEqual(expectedOrder);
  });
};
