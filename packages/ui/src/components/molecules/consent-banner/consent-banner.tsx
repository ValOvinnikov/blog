import {
  SIZE,
  TEXT_ROLE,
  type ILink,
  type IWithClassName,
  type IWithDataTestId,
} from '@shinefold/config';
import type { TAnchorElementType } from '@shinefold/config/react';
import { Button } from '@shinefold/ui/components/atoms/button';
import { Heading } from '@shinefold/ui/components/atoms/heading';
import { Text } from '@shinefold/ui/components/atoms/text';
import { TextLink } from '@shinefold/ui/components/atoms/text-link';

import { consentBannerVariants } from './consent-banner-variants';

export interface IConsentBannerLabels {
  accept: string;
  reject: string;
  settings: string;
}

export type TConsentBannerProps = IWithClassName &
  IWithDataTestId & {
    heading: string;
    message: string;
    policyLink?: Pick<ILink, 'href' | 'label'>;
    linkAs?: TAnchorElementType;
    labels: IConsentBannerLabels;
    onAccept: () => void;
    onReject: () => void;
    onOpenSettings: () => void;
  };

const s = consentBannerVariants();

/** A persistent, non-modal card offering cookie-consent choices, fixed to the bottom of the viewport. */
export const ConsentBanner = ({
  heading,
  message,
  policyLink,
  linkAs,
  labels,
  onAccept,
  onReject,
  onOpenSettings,
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
    <div className={s.actions()}>
      <Button variant="primary" size={SIZE.SM} onClick={onAccept}>
        {labels.accept}
      </Button>
      <Button variant="primary" size={SIZE.SM} onClick={onReject}>
        {labels.reject}
      </Button>
      <Button
        variant="link"
        size={SIZE.SM}
        onClick={onOpenSettings}
        className={s.settings()}
      >
        {labels.settings}
      </Button>
    </div>
  </div>
);
