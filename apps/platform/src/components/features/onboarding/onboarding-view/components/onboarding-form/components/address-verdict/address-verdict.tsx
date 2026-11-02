'use client';

import { ICONS, SIZE, type TMaybeUndefined } from '@blog/config';
import { useFieldErrorText } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/use-field-error-text';
import { Icon } from '@platform/components/shared/icon';
import { Spinner } from '@platform/components/shared/spinner';
import {
  SITE_ADDRESS_STATUS,
  type TSiteAddressStatus,
} from '@platform/constants/onboarding';
import type { TCreateSiteFieldError } from '@platform/server/onboarding/create-site-input';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';

const addressVerdictVariants = tv({
  slots: {
    root: ['flex min-w-0'],
    chip: [
      'inline-flex max-w-full items-start gap-2',
      'rounded-admin border py-[7px] pr-3 pl-[9px]',
    ],
    glyph: ['flex h-[19px] shrink-0 items-center'],
    message: ['min-w-0 text-admin-13-5 leading-[19px] font-semibold'],
    announcement: ['sr-only'],
  },
  variants: {
    status: {
      [SITE_ADDRESS_STATUS.IDLE]: {},
      [SITE_ADDRESS_STATUS.CHECKING]: {
        chip: ['border-admin-line bg-admin-surface'],
        glyph: ['text-admin-muted'],
        message: ['text-admin-text'],
      },
      [SITE_ADDRESS_STATUS.AVAILABLE]: {
        chip: ['border-admin-ok/30 bg-admin-ok-weak'],
        glyph: ['text-admin-ok'],
        message: ['text-admin-ok'],
      },
      [SITE_ADDRESS_STATUS.UNAVAILABLE]: {},
      [SITE_ADDRESS_STATUS.UNVERIFIED]: {
        chip: ['border-admin-warn/30 bg-admin-warn-weak'],
        glyph: ['text-admin-warn'],
        message: ['font-medium text-admin-text'],
      },
    },
  },
});

const VERDICT_ICON = {
  [SITE_ADDRESS_STATUS.AVAILABLE]: ICONS.CHECK,
  [SITE_ADDRESS_STATUS.UNVERIFIED]: ICONS.WARNING,
} as const;

export type TAddressVerdict = {
  siteAddress: string;
  status: TSiteAddressStatus;
  error: TMaybeUndefined<TCreateSiteFieldError>;
};

export type TAddressVerdictProps = {
  verdict: TAddressVerdict;
};

export const AddressVerdict = ({
  verdict: { siteAddress, status, error },
}: TAddressVerdictProps) => {
  const t = useTranslations('onboardingForm');
  const toErrorText = useFieldErrorText();
  const { root, chip, glyph, message, announcement } = addressVerdictVariants({
    status,
  });

  if (status === SITE_ADDRESS_STATUS.IDLE) {
    return <div role="status" className={root()} />;
  }

  if (status === SITE_ADDRESS_STATUS.UNAVAILABLE) {
    return (
      <div role="status" className={root()}>
        <span className={announcement()}>{error && toErrorText(error)}</span>
      </div>
    );
  }

  const messages = {
    [SITE_ADDRESS_STATUS.CHECKING]: t('siteAddressChecking'),
    [SITE_ADDRESS_STATUS.AVAILABLE]: t('siteAddressAvailable', {
      address: siteAddress,
    }),
    [SITE_ADDRESS_STATUS.UNVERIFIED]: t('siteAddressUnverified'),
  };

  return (
    <div role="status" className={root()}>
      <span className={chip()}>
        <span className={glyph()} aria-hidden="true">
          {status === SITE_ADDRESS_STATUS.CHECKING ? (
            <Spinner label="" size={SIZE.SM} />
          ) : (
            <Icon name={VERDICT_ICON[status]} />
          )}
        </span>
        <span className={message()}>{messages[status]}</span>
      </span>
    </div>
  );
};
