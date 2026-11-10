import {
  NEWSLETTER_VARIANT,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import { Panel } from '@blog/ui/components/molecules/panel';
import {
  newsletterSignupVariants,
  type TNewsletterSignupVariants,
} from '@blog/ui/components/organisms/newsletter-signup/newsletter-signup-variants';
import { hasArrayGotItems } from '@blog/utils/primitives';
import type { ReactNode } from 'react';

export interface INewsletterSignupTrustCue {
  icon: ReactNode;
  label: string;
}

export type TNewsletterSignupFullProps = IWithClassName &
  IWithDataTestId & {
    supportingText?: string;
    trustCues?: INewsletterSignupTrustCue[];
    align?: TNewsletterSignupVariants['align'];
    children: ReactNode;
  };

/** A panel that sets a pitch and trust cues beside its `NewsletterSignup.Form`. */
export const NewsletterSignupFull = ({
  supportingText,
  trustCues,
  align,
  children,
  className,
  dataTestId,
}: TNewsletterSignupFullProps) => {
  const hasTrustCues = hasArrayGotItems(trustCues);
  const hasPitch = Boolean(supportingText || hasTrustCues);
  const s = newsletterSignupVariants({
    variant: NEWSLETTER_VARIANT.FULL,
    align,
    hasPitch,
  });

  return (
    <Panel className={s.root({ class: className })} dataTestId={dataTestId}>
      <Panel.Body className={s.body()}>
        {hasPitch && (
          <div className={s.pitchPane()}>
            {supportingText && (
              <p className={s.supportingText()}>{supportingText}</p>
            )}
            {hasTrustCues && (
              <ul className={s.trustCues()}>
                {trustCues.map((cue) => (
                  <li key={cue.label} className={s.trustCue()}>
                    <span aria-hidden="true" className={s.trustCueIcon()}>
                      {cue.icon}
                    </span>
                    {cue.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className={s.formPane()}>{children}</div>
      </Panel.Body>
    </Panel>
  );
};
