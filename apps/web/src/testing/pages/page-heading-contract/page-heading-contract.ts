import { faker } from '@faker-js/faker';
import type { TModule } from '@shinefold/service';
import { okResult } from '@shinefold/utils';
import { screen, within } from '@web/testing/custom-render';
import { mockHeroBlogData } from '@web/testing/modules/hero-blog/fixtures';
import { mockModule } from '@web/testing/shared/module-renderer-contract/fixtures';
import type { Mock } from 'vitest';

interface IPageHeadingContractOptions {
  renderPage: () => Promise<unknown>;
  renderPageWithHero: (hero: TModule<'module_heroBlog'>) => Promise<unknown>;
  heroBlogMock: Mock;
  heading: string;
  supportingText: string;
}

export const testPageHeading = ({
  renderPage,
  renderPageWithHero,
  heroBlogMock,
  heading,
  supportingText,
}: IPageHeadingContractOptions) => {
  it('renders the page heading and supporting text inside main', async () => {
    await renderPage();

    const main = screen.getByRole('main');
    const pageHeading = within(main).getByRole('heading', {
      level: 1,
      name: heading,
    });
    const pageSupportingText = within(main).getByText(supportingText);

    expect(pageHeading).toBeVisible();
    expect(pageSupportingText).toBeVisible();
  });

  it('renders the hero in place of the heading when one is set', async () => {
    const heroHeading = faker.lorem.words(3);
    heroBlogMock.mockResolvedValueOnce(
      okResult(mockHeroBlogData({ heading: heroHeading })),
    );

    await renderPageWithHero(mockModule('module_heroBlog'));

    const heroPageHeading = screen.getByRole('heading', {
      level: 1,
      name: heroHeading,
    });
    const pageHeading = screen.queryByRole('heading', {
      level: 1,
      name: heading,
    });

    expect(heroPageHeading).toBeVisible();
    expect(pageHeading).not.toBeInTheDocument();
  });
};
