import { ICONS, SIZE } from '@blog/config';
import { Button } from '@blog/ui/components/atoms/button';
import { Icon } from '@blog/ui/components/atoms/icon';
import { identitySectionVariants } from '@web/components/pages/account-page/sections/identity-section/identity-section-variants';
import type {
  IIdentityProviderRow,
  IIdentitySectionViewProps,
} from '@web/components/pages/account-page/sections/identity-section/identity-section-view';
import { createMockFaker } from '@web/testing/mock-faker';

const mockFaker = createMockFaker(61032);

export const MOCK_LINKED_STATUS_LABEL = mockFaker.lorem.word();
export const MOCK_LAST_METHOD_NOTICE_LABEL = mockFaker.lorem.sentence();
export const MOCK_UNLINK_LABEL = mockFaker.lorem.word();
export const MOCK_SAVE_DISPLAY_NAME_LABEL = mockFaker.lorem.word();
const MOCK_LINK_LABEL = mockFaker.lorem.word();
const MOCK_GITHUB_LABEL = mockFaker.company.name();
const MOCK_GOOGLE_LABEL = mockFaker.company.name();
const MOCK_EMAIL_LINK_LABEL = mockFaker.company.name();
const MOCK_IDENTITY_HEADING = mockFaker.lorem.words(2);
const MOCK_DISPLAY_NAME_LABEL = mockFaker.lorem.words(2);
const MOCK_DISPLAY_NAME_DESCRIPTION = mockFaker.lorem.sentence();

const s = identitySectionVariants();

const makeIdentityProviderRow = (
  overrides: Partial<IIdentityProviderRow> = {},
): IIdentityProviderRow => {
  return {
    id: 'github',
    icon: <Icon name={ICONS.GITHUB} size={SIZE.MD} />,
    label: MOCK_GITHUB_LABEL,
    isLinked: true,
    isLastMethod: false,
    linkedStatusLabel: MOCK_LINKED_STATUS_LABEL,
    lastMethodNoticeLabel: MOCK_LAST_METHOD_NOTICE_LABEL,
    control: (
      <Button size={SIZE.SM} variant="ghost">
        {MOCK_UNLINK_LABEL}
      </Button>
    ),
    ...overrides,
  };
};

export const mockIdentitySectionView = (
  overrides: Partial<IIdentitySectionViewProps> = {},
): IIdentitySectionViewProps => {
  return {
    heading: MOCK_IDENTITY_HEADING,
    providerRows: [
      makeIdentityProviderRow(),
      makeIdentityProviderRow({
        id: 'google',
        icon: <Icon name={ICONS.GOOGLE} size={SIZE.SM} />,
        label: MOCK_GOOGLE_LABEL,
        isLinked: false,
        control: (
          <Button size={SIZE.SM} variant="ghost">
            {MOCK_LINK_LABEL}
          </Button>
        ),
      }),
      makeIdentityProviderRow({
        id: 'email',
        icon: (
          <span aria-hidden="true" className={s.emailIcon()}>
            ✉
          </span>
        ),
        label: MOCK_EMAIL_LINK_LABEL,
        isLinked: true,
        isLastMethod: false,
        control: null,
      }),
    ],
    displayNameLabel: MOCK_DISPLAY_NAME_LABEL,
    displayNameDescription: MOCK_DISPLAY_NAME_DESCRIPTION,
    displayNameControl: (
      <Button size={SIZE.SM} variant="ghost">
        {MOCK_SAVE_DISPLAY_NAME_LABEL}
      </Button>
    ),
    ...overrides,
  };
};
