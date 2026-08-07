import type { IWithDataTestId } from '@blog/config';
import { Button } from '@blog/ui/atoms/button';
import { StatusBadge } from '@blog/ui/atoms/status-badge';
import { SettingRow } from '@blog/ui/molecules/setting-row';

type TNewsletterPreferencesSectionSharedProps = {
  title: string;
  badgeLabel: string;
  description: string;
  actionLabel: string;
};

type TNewsletterPreferencesSectionActiveProps = {
  status: 'active';
  onUnsubscribe: () => void;
};

type TNewsletterPreferencesSectionPendingProps = {
  status: 'pending';
  onResendConfirmation: () => void;
};

export type TNewsletterPreferencesSectionProps = IWithDataTestId & {
  className?: string;
} & TNewsletterPreferencesSectionSharedProps &
  (
    | TNewsletterPreferencesSectionActiveProps
    | TNewsletterPreferencesSectionPendingProps
  );

/**
 * NewsletterPreferencesSection — the `/account` hub's 6b row (Feature 6 /
 * D15, §4.6). A reader's subscription is never simultaneously active and
 * pending, so this renders exactly one `SettingRow` whose badge tone and
 * action switch on the real `status` rather than showing two permanent
 * rows. All copy is caller-supplied so the web layer can localize it.
 */
export const NewsletterPreferencesSection = (
  props: TNewsletterPreferencesSectionProps,
) => {
  const {
    className,
    dataTestId,
    status,
    title,
    badgeLabel,
    description,
    actionLabel,
  } = props;
  const tone = status === 'active' ? 'ok' : 'warn';
  const onAction =
    status === 'active' ? props.onUnsubscribe : props.onResendConfirmation;

  return (
    <SettingRow
      className={className}
      dataTestId={dataTestId}
      label={
        <>
          {title} <StatusBadge tone={tone}>{badgeLabel}</StatusBadge>
        </>
      }
      description={description}
    >
      <Button variant="ghost" onClick={onAction}>
        {actionLabel}
      </Button>
    </SettingRow>
  );
};
