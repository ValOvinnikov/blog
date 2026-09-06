'use client';

import { ALERT_TYPE } from '@blog/config';
import { EmailLogoField } from '@platform/components/features/email/email-logo-field';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { FormTextInput } from '@platform/components/shared/form-text-input';
import { useToast } from '@platform/context/toast-provider';
import { updateEmailConfigAction } from '@platform/server/email-config/update-email-config-action';
import { useFormSubmission } from '@platform/utils/use-form-submission/use-form-submission';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { emailSettingsFormVariants } from './email-settings-form-variants';

export type TEmailSettingsFormValues = {
  senderName: string;
  replyToAddress: string;
  footerPostalAddress: string;
  logoAssetUrl: string | undefined;
};

export type TEmailSettingsFormProps = {
  tenantId: string;
  initialValues: TEmailSettingsFormValues;
  /** Reported up so a sibling template editor's logo-fallback preview stays in sync with an immediate (not staged-behind-Save) logo change. */
  onLogoChange?: (url: string | undefined) => void;
  isArchived?: boolean;
  archivedNoticeId?: string;
};

const blankToNull = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

/**
 * Sender name, reply-to address and footer postal address — the fields
 * `site_config` has no home for. A blank field reverts to the product
 * default on save, same convention as the Voice tab's overrides.
 */
export const EmailSettingsForm = ({
  tenantId,
  initialValues,
  onLogoChange,
  isArchived = false,
  archivedNoticeId,
}: TEmailSettingsFormProps) => {
  const t = useTranslations('emailSettingsForm');
  const toast = useToast();
  const senderNameId = useId();
  const replyToId = useId();
  const footerAddressId = useId();

  const { values, setValues, status, isPending, handleSubmit } =
    useFormSubmission<TEmailSettingsFormValues, { ok: boolean }>({
      initialValues,
      onSubmit: (vals) =>
        updateEmailConfigAction(tenantId, {
          senderName: blankToNull(vals.senderName),
          replyToAddress: blankToNull(vals.replyToAddress),
          footerPostalAddress: blankToNull(vals.footerPostalAddress),
        }),
      onSuccess: () => {
        toast.success({
          message: t('alertSuccess'),
        });
      },
    });

  const { stack, footer } = emailSettingsFormVariants();
  const archivedDescribedBy = isArchived ? archivedNoticeId : undefined;

  return (
    <Card>
      <Card.Header
        title={t('heading')}
        supportingText={t('description')}
        headingLevel={2}
      />
      <Card.Body>
        <div className={stack()}>
          {status === 'error' && (
            <Alert type={ALERT_TYPE.ERROR} title={t('alertError')} />
          )}
          <FormTextInput
            label={t('senderNameLabel')}
            htmlFor={senderNameId}
            hint={t('senderNameHint')}
            value={values.senderName}
            onChange={(value) =>
              setValues((prev) => ({ ...prev, senderName: value }))
            }
            isDisabled={isPending || isArchived}
            aria-describedby={archivedDescribedBy}
          />
          <FormTextInput
            label={t('replyToLabel')}
            htmlFor={replyToId}
            hint={t('replyToHint')}
            type="email"
            value={values.replyToAddress}
            onChange={(value) =>
              setValues((prev) => ({ ...prev, replyToAddress: value }))
            }
            isDisabled={isPending || isArchived}
            aria-describedby={archivedDescribedBy}
          />
          <FormTextInput
            label={t('footerAddressLabel')}
            htmlFor={footerAddressId}
            hint={t('footerAddressHint')}
            value={values.footerPostalAddress}
            onChange={(value) =>
              setValues((prev) => ({ ...prev, footerPostalAddress: value }))
            }
            isDisabled={isPending || isArchived}
            aria-describedby={archivedDescribedBy}
          />
          <EmailLogoField
            tenantId={tenantId}
            target={{ type: 'tenant' }}
            label={t('logoLabel')}
            hint={t('logoHint')}
            currentUrl={values.logoAssetUrl}
            onChange={(url) => {
              setValues((prev) => ({ ...prev, logoAssetUrl: url }));
              onLogoChange?.(url);
            }}
            isDisabled={isArchived}
            aria-describedby={archivedDescribedBy}
          />
        </div>
      </Card.Body>
      <Card.Footer>
        <div className={footer()}>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            isDisabled={isArchived}
            isPending={isPending}
            pendingLabel={t('savingButton')}
            aria-describedby={archivedDescribedBy}
          >
            {t('saveButton')}
          </Button>
        </div>
      </Card.Footer>
    </Card>
  );
};
