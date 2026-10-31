import {
  SIZE,
  type ILink,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Button } from '@blog/ui/components/atoms/button';
import { Heading } from '@blog/ui/components/atoms/heading';
import { Text } from '@blog/ui/components/atoms/text';
import { TextLink } from '@blog/ui/components/atoms/text-link';
import type { THeadingLevel } from '@blog/ui/lib/react';

import { consentBannerVariants } from './consent-banner-variants';

export type TConsentBannerProps = IWithClassName &
  IWithDataTestId & {
    headingLevel: THeadingLevel;
    heading: string;
    message: string;
    policyLink?: Pick<ILink, 'href' | 'label'>;
    linkAs?: TAnchorElementType;
    acceptLabel: string;
    rejectLabel: string;
    settingsLabel: string;
    onAccept: () => void;
    onReject: () => void;
    onOpenSettings: () => void;
  };

const s = consentBannerVariants();

/** A persistent, non-modal card offering cookie-consent choices, fixed to the bottom of the viewport. */
export const ConsentBanner = ({
  headingLevel,
  heading,
  message,
  policyLink,
  linkAs,
  acceptLabel,
  rejectLabel,
  settingsLabel,
  onAccept,
  onReject,
  onOpenSettings,
  className,
  dataTestId,
}: TConsentBannerProps) => (
  <div className={s.root({ class: className })} data-testid={dataTestId}>
    <Heading level={headingLevel} size={SIZE.SM} className={s.heading()}>
      {heading}
    </Heading>
    <Text variant="card" className={s.message()}>
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
        {acceptLabel}
      </Button>
      <Button variant="primary" size={SIZE.SM} onClick={onReject}>
        {rejectLabel}
      </Button>
      <Button
        variant="link"
        size={SIZE.SM}
        onClick={onOpenSettings}
        className={s.settings()}
      >
        {settingsLabel}
      </Button>
    </div>
  </div>
);
