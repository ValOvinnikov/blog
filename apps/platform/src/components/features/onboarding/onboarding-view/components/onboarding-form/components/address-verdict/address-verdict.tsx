'use client';

import { useFieldErrorText } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/use-field-error-text';
import { Icon } from '@platform/components/shared/icon';
import { Spinner } from '@platform/components/shared/spinner';
import {
  SITE_ADDRESS_STATUS,
  type TSiteAddressStatus,
} from '@platform/constants/onboarding';
import type { TCreateSiteFieldError } from '@platform/server/onboarding/create-site-input';
import { ICONS, SIZE, type TMaybeUndefined } from '@shinefold/config';
import { useTranslations } from 'next-intl';

import { addressVerdictVariants } from './address-verdict-variants';

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
  const { root, chip, glyph, message, detail, host, announcement } =
    addressVerdictVariants({ status });

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
    [SITE_ADDRESS_STATUS.AVAILABLE]: t.rich('siteAddressAvailable', {
      address: siteAddress,
      detail: (chunks) => <span className={detail()}>{chunks}</span>,
      host: (chunks) => <span className={host()}>{chunks}</span>,
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
