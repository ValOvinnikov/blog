import type { ILink } from '@blog/config';
import type { TLogoItem } from '@blog/service';
import { createMockFaker } from '@web/testing/mock-faker';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';

const mockFaker = createMockFaker(61048);

export const mockLogoItem = (overrides: Partial<TLogoItem> = {}): TLogoItem => {
  const name = overrides.name ?? 'Acme Corp';

  return {
    id: 'logo-1',
    name,
    image: mockSanityImage({ alt: name }),
    imageDark: undefined,
    link: undefined,
    ...overrides,
  };
};

export const MOCK_LOGO_WALL_HEADING = 'Trusted by';

export const MOCK_LOGO_ITEMS: TLogoItem[] = [
  mockLogoItem(),
  mockLogoItem({ id: mockFaker.string.uuid(), name: 'Nimbus Inc' }),
];

export const MOCK_LOGO_LINK: ILink = {
  label: 'Visit Acme Corp',
  href: mockFaker.internet.url(),
  target: undefined,
  platform: undefined,
  ariaLabel: undefined,
};
