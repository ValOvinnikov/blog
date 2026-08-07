import type { IWithDataTestId } from '@blog/config';
import { Button } from '@blog/ui/atoms/button';
import { StatusBadge } from '@blog/ui/atoms/status-badge';
import { SettingRow } from '@blog/ui/molecules/setting-row';

import { newsletterPreferencesSectionVariants } from './newsletter-preferences-section-variants';

type TNewsletterPreferencesSectionActiveProps = {
  status: 'active';
  email: string;
  onUnsubscribe: () => void;
};

type TNewsletterPreferencesSectionPendingProps = {
  status: 'pending';
  onResendConfirmation: () => void;
};

export type TNewsletterPreferencesSectionProps = IWithDataTestId & {
  className?: string;
} & (
    | TNewsletterPreferencesSectionActiveProps
    | TNewsletterPreferencesSectionPendingProps
  );

/**
 * NewsletterPreferencesSection — the `/account` hub's 6b row (Feature 6 /
 * D15, §4.6). A reader's subscription is never simultaneously active and
 * pending, so this renders exactly one `SettingRow` whose badge tone,
 * description, and action switch on the real `status` rather than showing
 * two permanent rows.
 */
export const NewsletterPreferencesSection = (
  props: TNewsletterPreferencesSectionProps,
) => {
  const { className, dataTestId, status } = props;
  const { email: emailSlot } = newsletterPreferencesSectionVariants();

  if (status === 'active') {
    const { email, onUnsubscribe } = props;

    return (
      <SettingRow
        className={className}
        dataTestId={dataTestId}
        label={
          <>
            Newsletter <StatusBadge tone="ok">subscribed</StatusBadge>
          </>
        }
        description={
          <>
            Weekly posts delivered to{' '}
            <span className={emailSlot()}>{email}</span> (your account email —
            read-only in v1).
          </>
        }
      >
        <Button variant="ghost" onClick={onUnsubscribe}>
          unsubscribe
        </Button>
      </SettingRow>
    );
  }

  const { onResendConfirmation } = props;

  return (
    <SettingRow
      className={className}
      dataTestId={dataTestId}
      label={
        <>
          Newsletter <StatusBadge tone="warn">pending confirmation</StatusBadge>
        </>
      }
      description="The double-opt-in link hasn't been clicked yet. Resend it if it never arrived."
    >
      <Button variant="ghost" onClick={onResendConfirmation}>
        ↻ resend confirmation
      </Button>
    </SettingRow>
  );
};
