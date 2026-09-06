import { ICONS, SIZE } from '@blog/config';
import { Button } from '@blog/ui/atoms/button';
import { Icon } from '@blog/ui/atoms/icon';
import type {
  IIdentityProviderRow,
  IIdentitySectionViewProps,
} from '@web/components/pages/account-page/sections/identity-section';
import { identitySectionVariants } from '@web/components/pages/account-page/sections/identity-section/identity-section-variants';

const s = identitySectionVariants();

const makeIdentityProviderRow = (
  overrides: Partial<IIdentityProviderRow> = {},
): IIdentityProviderRow => {
  return {
    id: 'github',
    icon: <Icon name={ICONS.GITHUB} size={SIZE.MD} />,
    label: 'GitHub',
    isLinked: true,
    isLastMethod: false,
    linkedStatusLabel: 'Linked',
    lastMethodNoticeLabel: "Last remaining method — can't unlink",
    control: (
      <Button size={SIZE.SM} variant="ghost">
        Unlink
      </Button>
    ),
    ...overrides,
  };
};

export const makeIdentitySectionView = (
  overrides: Partial<IIdentitySectionViewProps> = {},
): IIdentitySectionViewProps => {
  return {
    heading: 'Connected accounts',
    providerRows: [
      makeIdentityProviderRow(),
      makeIdentityProviderRow({
        id: 'google',
        icon: <Icon name={ICONS.GOOGLE} size={SIZE.SM} />,
        label: 'Google',
        isLinked: false,
        control: (
          <Button size={SIZE.SM} variant="ghost">
            Link
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
        label: 'Email link',
        isLinked: true,
        isLastMethod: false,
        control: null,
      }),
    ],
    displayNameLabel: 'Display name',
    displayNameDescription:
      'Overrides your provider handle wherever your comments appear.',
    displayNameControl: (
      <Button size={SIZE.SM} variant="ghost">
        Save
      </Button>
    ),
    ...overrides,
  };
};
