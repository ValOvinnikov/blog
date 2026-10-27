import {
  customRender,
  renderElement,
  screen,
} from '@blog/ui/testing/custom-render';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';
import { faker } from '@faker-js/faker';

import { LinkButton } from './link-button';

faker.seed(123);

const MOCK_HREF = `/${faker.lorem.slug()}`;
const MOCK_LABEL = faker.lorem.words(2);

const setup = customRender(LinkButton, {
  href: MOCK_HREF,
  children: MOCK_LABEL,
});

describe(`<${LinkButton.name}/>`, () => {
  it('renders an anchor by default', () => {
    setup();

    const link = screen.getByRole('link', { name: MOCK_LABEL });

    expect(link).toHaveAttribute('href', MOCK_HREF);
  });

  it('renders through a custom link component', () => {
    renderElement(
      <LinkButton as={MockLink} href={MOCK_HREF}>
        {MOCK_LABEL}
      </LinkButton>,
    );

    const link = screen.getByRole('link', { name: MOCK_LABEL });
    const mockLink = screen.getByTestId(MOCK_LINK_TEST_ID);

    expect(link).toBe(mockLink);
  });
});
