import { customRender, screen } from '@blog/ui/testing/custom-render';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';
import { faker } from '@faker-js/faker';

import { ShareLink } from './share-link';

const SHARE_ICON_TEST_ID = 'share-icon';

faker.seed(123);

const MOCK_HREF = faker.internet.url();
const MOCK_LABEL = faker.lorem.words(2);

const setup = customRender(ShareLink, {
  href: MOCK_HREF,
  label: MOCK_LABEL,
});

describe(`<${ShareLink.name}/>`, () => {
  it('renders an external link to the given href', () => {
    setup();

    const link = screen.getByRole('link', { name: MOCK_LABEL });

    expect(link).toHaveAttribute('href', MOCK_HREF);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders the given icon alongside the label', () => {
    setup({ icon: <svg data-testid={SHARE_ICON_TEST_ID} /> });

    const icon = screen.getByTestId(SHARE_ICON_TEST_ID);

    expect(icon).toBeVisible();
  });

  it('renders through the supplied link component', () => {
    setup({ as: MockLink });

    const mockLink = screen.getByTestId(MOCK_LINK_TEST_ID);

    expect(mockLink).toBeVisible();
  });
});
