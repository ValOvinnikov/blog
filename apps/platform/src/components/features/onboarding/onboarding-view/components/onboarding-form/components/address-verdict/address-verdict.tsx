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
import { useTranslations } from 'next-intl';

import { addressVerdictVariants } from './address-verdict-variants';

const VERDICT_ICON = {
  [SITE_ADDRESS_STATUS.AVAILABLE]: ICONS.CHECK,
  [SITE_ADDRESS_STATUS.UNAVAILABLE]: ICONS.CLOSE,
  [SITE_ADDRESS_STATUS.UNVERIFIED]: ICONS.WARNING,
} as const;

export type TAddressVerdict = {
  messageId: string;
  siteAddress: string;
  status: TSiteAddressStatus;
  error: TMaybeUndefined<TCreateSiteFieldError>;
};

export type TAddressVerdictProps = {
  verdict: TAddressVerdict;
};

export const AddressVerdict = ({
  verdict: { messageId, siteAddress, status, error },
}: TAddressVerdictProps) => {
  const t = useTranslations('onboardingForm');
  const toErrorText = useFieldErrorText();
  const verdictStatus = error ? SITE_ADDRESS_STATUS.UNAVAILABLE : status;
  const { root, chip, glyph, message } = addressVerdictVariants({
    status: verdictStatus,
  });

  if (verdictStatus === SITE_ADDRESS_STATUS.IDLE) {
    return <div role="status" className={root()} />;
  }

  const messages = {
    [SITE_ADDRESS_STATUS.CHECKING]: t('siteAddressChecking'),
    [SITE_ADDRESS_STATUS.AVAILABLE]: t('siteAddressAvailable', {
      address: siteAddress,
    }),
    [SITE_ADDRESS_STATUS.UNAVAILABLE]: error && toErrorText(error),
    [SITE_ADDRESS_STATUS.UNVERIFIED]: t('siteAddressUnverified'),
  };

  return (
    <div role="status" className={root()}>
      <span className={chip()}>
        <span className={glyph()} aria-hidden="true">
          {verdictStatus === SITE_ADDRESS_STATUS.CHECKING ? (
            <Spinner label="" size={SIZE.SM} />
          ) : (
            <Icon name={VERDICT_ICON[verdictStatus]} />
          )}
        </span>
        <span id={messageId} className={message()}>
          {messages[verdictStatus]}
        </span>
      </span>
    </div>
  );
};
