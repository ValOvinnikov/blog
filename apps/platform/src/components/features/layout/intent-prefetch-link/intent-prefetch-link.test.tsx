import { faker } from '@faker-js/faker';
import {
  customRender,
  fireEvent,
  screen,
} from '@platform/testing/custom-render';
import { adminRoutes } from '@platform/utils/routes/routes';
import userEvent from '@testing-library/user-event';

import { IntentPrefetchLink } from './intent-prefetch-link';

vi.mock('@platform/i18n/navigation');

faker.seed(6011);

const MOCK_LINK_TEXT = faker.lorem.word();
const PREFETCH_ATTRIBUTE = 'data-prefetch';

const setup = customRender(IntentPrefetchLink, {
  href: adminRoutes.tenants(),
  children: MOCK_LINK_TEXT,
});

const getLink = () => screen.getByRole('link', { name: MOCK_LINK_TEXT });

describe(`<${IntentPrefetchLink.name}/>`, () => {
  it('does not prefetch before the user shows intent', () => {
    setup();

    expect(getLink()).toHaveAttribute(PREFETCH_ATTRIBUTE, String(false));
  });

  it.each([
    ['hovered', () => userEvent.hover(getLink())],
    ['focused', () => userEvent.tab()],
    ['touched', () => fireEvent.touchStart(getLink())],
  ])('restores default prefetching once %s', async (_label, showIntent) => {
    setup();

    await showIntent();

    expect(getLink()).not.toHaveAttribute(PREFETCH_ATTRIBUTE);
  });

  it("still calls the caller's onMouseEnter", async () => {
    const onMouseEnter = vi.fn();
    setup({ onMouseEnter });

    await userEvent.hover(getLink());

    expect(onMouseEnter).toHaveBeenCalledOnce();
  });
});
