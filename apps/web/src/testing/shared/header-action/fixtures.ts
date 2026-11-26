import {
  HEADER_ACTION_PHONE_PLACEMENT,
  HEADER_ACTION_STYLE,
  routes,
} from '@shinefold/config';
import type { THeaderActionLook } from '@web/server/site-config/get-header-action-look/get-header-action-look';
import { createMockFaker } from '@web/testing/mock-faker';
import { mockNavLink } from '@web/testing/shared/link/fixtures';

const mockFaker = createMockFaker(80201);

const MOCK_HEADER_ACTION_LABEL = mockFaker.lorem.words(2);

export const MOCK_HEADER_ACTION_LOOK: THeaderActionLook = {
  style: HEADER_ACTION_STYLE.FILLED,
  phonePlacement: HEADER_ACTION_PHONE_PLACEMENT.MENU,
};

export const MOCK_HEADER_ACTION_LINK = mockNavLink(
  MOCK_HEADER_ACTION_LABEL,
  routes.landingPage(mockFaker.lorem.slug()),
);

export const MOCK_EXTERNAL_HEADER_ACTION_LINK = {
  ...mockNavLink(MOCK_HEADER_ACTION_LABEL, mockFaker.internet.url()),
  target: '_blank' as const,
};
