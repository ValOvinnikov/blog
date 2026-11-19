import {
  TEXT_ROLE,
  type ILink,
  type IWithClassName,
  type IWithDataTestId,
} from '@shinefold/config';
import type { TAnchorElementType } from '@shinefold/config/react';
import { Heading } from '@shinefold/ui/components/atoms/heading';
import { Text } from '@shinefold/ui/components/atoms/text';
import { TextLink } from '@shinefold/ui/components/atoms/text-link';
import type { ReactNode } from 'react';

import { consentBannerVariants } from './consent-banner-variants';

export type TConsentBannerProps = IWithClassName &
  IWithDataTestId & {
    heading: string;
    message: string;
    policyLink?: Pick<ILink, 'href' | 'label'>;
    linkAs?: TAnchorElementType;
    actions: ReactNode;
  };

const s = consentBannerVariants();

/** A persistent, non-modal card offering cookie-consent choices, fixed to the bottom of the viewport. */
export const ConsentBanner = ({
  heading,
  message,
  policyLink,
  linkAs,
  actions,
  className,
  dataTestId,
}: TConsentBannerProps) => (
  <div className={s.root({ class: className })} data-testid={dataTestId}>
    <Heading level={2} visual={TEXT_ROLE.DIALOG_TITLE}>
      {heading}
    </Heading>
    <Text textRole={TEXT_ROLE.CARD_BODY}>
      {message}
      {policyLink && (
        <>
          {' '}
          <TextLink href={policyLink.href} as={linkAs}>
            {policyLink.label}
          </TextLink>
        </>
      )}
    </Text>
    <div className={s.actions()}>{actions}</div>
  </div>
);
