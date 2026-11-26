import {
  HEADER_ACTION_PHONE_PLACEMENT,
  HEADER_ACTION_STYLE,
  type ILink,
  routes,
} from '@shinefold/config';
import { createMockFaker } from '@web/testing/mock-faker';

const mockFaker = createMockFaker(80201);

export const MOCK_HEADER_ACTION_LOOK = {
  style: HEADER_ACTION_STYLE.FILLED,
  phonePlacement: HEADER_ACTION_PHONE_PLACEMENT.MENU,
};

export const MOCK_HEADER_ACTION_LINK: ILink = {
  label: mockFaker.lorem.words(2),
  href: routes.landingPage(mockFaker.lorem.slug()),
  target: undefined,
  platform: undefined,
};

export const MOCK_EXTERNAL_HEADER_ACTION_LINK: ILink = {
  ...MOCK_HEADER_ACTION_LINK,
  href: mockFaker.internet.url(),
  target: '_blank',
};
