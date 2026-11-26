import { screen, within } from '@web/testing/custom-render';

interface IPageHeadingContractOptions {
  renderPage: () => Promise<unknown>;
  heading: string;
  supportingText: string;
}

export const testPageHeading = ({
  renderPage,
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
};
