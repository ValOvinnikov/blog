'use client';

import { GrantedBadge } from '@platform/components/features/entitlement-grants/granted-badge';
import { Card } from '@platform/components/shared/card';
import { SettingsFormShell } from '@platform/components/shared/settings-form-shell';
import { Text } from '@platform/components/shared/text';
import { LANGUAGES_CARD_HEADING_ID } from '@platform/constants/entitlement-grant';
import { SUPPORTED_LOCALES } from '@platform/constants/language';
import type { TLanguageGrants } from '@platform/utils/grant-target/grant-target';
import { FORM_STATUS, type TLocaleIsoCode } from '@shinefold/config';
import { useTranslations } from 'next-intl';

import { LanguageToggleRow } from './components/language-toggle-row';
import { LanguagesLimitNotice } from './components/languages-limit-notice/languages-limit-notice';
import { languagesSettingsVariants } from './languages-settings-variants';
import { useLanguageLockedReason } from './use-language-locked-reason';
import { useLanguagesForm } from './use-languages-form';

export type TLanguagesSettingsProps = {
  tenantId: string;
  defaultLocale: TLocaleIsoCode;
  locales: {
    stored: TLocaleIsoCode[];
    live: TLocaleIsoCode[];
    limit: number;
  };
  grants: TLanguageGrants;
  savedAt?: Date;
  archivedAt?: Date;
};

export const LanguagesSettings = ({
  tenantId,
  defaultLocale,
  locales,
  grants,
  savedAt,
  archivedAt,
}: TLanguagesSettingsProps) => {
  const { stored, live, limit: additionalLocaleLimit } = locales;
  const t = useTranslations('languagesSettings');
  const tLanguage = useTranslations('languageNames');
  const { defaultLanguage } = languagesSettingsVariants();
  const {
    values,
    setValues,
    status,
    isPending,
    isArchived,
    archivedNoticeId,
    form,
    savedLocales,
    isOverLimit,
  } = useLanguagesForm({
    tenantId,
    defaultLocale,
    stored,
    live,
    additionalLocaleLimit,
    savedAt,
    archivedAt,
  });

  const isAtLimit = values.length >= additionalLocaleLimit;

  const handleToggle = (locale: TLocaleIsoCode, checked: boolean) => {
    setValues((prev) =>
      checked ? [...prev, locale] : prev.filter((live) => live !== locale),
    );
  };

  const lockedReason = useLanguageLockedReason(
    additionalLocaleLimit,
    isOverLimit,
  );

  return (
    <SettingsFormShell
      title={t('heading')}
      description={t('description')}
      form={form}
      errorTitle={status === FORM_STATUS.ERROR ? t('alertError') : undefined}
    >
      <Card>
        <Card.Header title={t('defaultHeading')} />
        <Card.Body>
          <Text className={defaultLanguage()}>{tLanguage(defaultLocale)}</Text>
          <Text variant="supporting">{t('defaultDescription')}</Text>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header
          title={t('additionalHeading')}
          titleId={LANGUAGES_CARD_HEADING_ID}
          titleTabIndex={-1}
          supportingText={t(grants.granted ? 'allowanceGranted' : 'allowance', {
            used: values.length,
            allowed: additionalLocaleLimit,
          })}
          actions={
            grants.granted && (
              <GrantedBadge expiresAt={grants.granted.expiresAt} />
            )
          }
        />
        <Card.Body>
          <LanguagesLimitNotice
            allowed={additionalLocaleLimit}
            storedCount={savedLocales.length}
            grantTarget={grants.target}
          />
          {SUPPORTED_LOCALES.filter((locale) => locale !== defaultLocale).map(
            (locale) => {
              const isLive = values.includes(locale);
              const isStored = savedLocales.includes(locale);
              const isOverAllowance = isLive
                ? isOverLimit
                : isAtLimit || (isOverLimit && !isStored);

              return (
                <LanguageToggleRow
                  key={locale}
                  aria={{
                    label: tLanguage(locale),
                    describedBy: isArchived ? archivedNoticeId : undefined,
                  }}
                  description={
                    isOverLimit && isStored && !isLive
                      ? t('keptBadge')
                      : undefined
                  }
                  isChecked={isLive}
                  isLocked={isOverAllowance || isArchived}
                  lockedReason={isOverAllowance ? lockedReason : undefined}
                  isDisabled={isPending}
                  onCheckedChange={(checked) => handleToggle(locale, checked)}
                />
              );
            },
          )}
        </Card.Body>
      </Card>
    </SettingsFormShell>
  );
};
