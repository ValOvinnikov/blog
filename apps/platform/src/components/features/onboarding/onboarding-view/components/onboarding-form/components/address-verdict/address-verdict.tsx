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
      'rounded-platform border py-[7px] pr-3 pl-[9px]',
    ],
    glyph: ['flex h-[19px] shrink-0 items-center'],
    message: ['min-w-0 text-platform-13-5 leading-platform-19 font-semibold'],
    announcement: ['sr-only'],
  },
  variants: {
    status: {
      [SITE_ADDRESS_STATUS.IDLE]: {},
      [SITE_ADDRESS_STATUS.CHECKING]: {
        chip: ['border-platform-line bg-platform-surface'],
        glyph: ['text-platform-muted'],
        message: ['text-platform-text'],
      },
      [SITE_ADDRESS_STATUS.AVAILABLE]: {
        chip: ['border-platform-ok/30 bg-platform-ok-weak'],
        glyph: ['text-platform-ok'],
        message: ['text-platform-ok'],
      },
      [SITE_ADDRESS_STATUS.UNAVAILABLE]: {},
      [SITE_ADDRESS_STATUS.UNVERIFIED]: {
        chip: ['border-platform-warn/30 bg-platform-warn-weak'],
        glyph: ['text-platform-warn'],
        message: ['font-medium text-platform-text'],
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
