'use client';

import { GrantedBadge } from '@platform/components/features/entitlement-grants/granted-badge';
import { Card } from '@platform/components/shared/card';
import {
  SettingsFormShell,
  useSettingsForm,
} from '@platform/components/shared/settings-form-shell';
import { Text } from '@platform/components/shared/text';
import { LANGUAGES_CARD_HEADING_ID } from '@platform/constants/entitlement-grant';
import { useToast } from '@platform/context/toast-provider';
import {
  updateTenantLanguagesAction,
  type TUpdateTenantLanguagesResult,
} from '@platform/server/tenants/update-tenant-languages-action';
import { additionalLocalesToSave } from '@platform/utils/additional-locales-to-save/additional-locales-to-save';
import type { TLanguageGrants } from '@platform/utils/grant-target/grant-target';
import {
  LOCALE_ISO_CODES,
  type TLocaleIsoCode,
  FORM_STATUS,
} from '@shinefold/config';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { LanguageToggleRow } from './components/language-toggle-row';
import { LanguagesLimitNotice } from './components/languages-limit-notice/languages-limit-notice';
import { languagesSettingsVariants } from './languages-settings-variants';
import { useLanguageDraftFields } from './use-language-draft-fields';
import { useLanguageLockedReason } from './use-language-locked-reason';

const SUPPORTED_LOCALES = Object.values(LOCALE_ISO_CODES);

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
  const toast = useToast();
  const router = useRouter();
  const [savedLocales, setSavedLocales] = useState(stored);
  const draftFields = useLanguageDraftFields(defaultLocale);
  const isOverLimit = savedLocales.length > additionalLocaleLimit;
  const {
    values,
    setValues,
    status,
    isPending,
    isArchived,
    archivedNoticeId,
    form,
  } = useSettingsForm<TLocaleIsoCode[], TUpdateTenantLanguagesResult>({
    initialValues: live,
    archivedAt,
    onSubmit: (liveLocales) =>
      updateTenantLanguagesAction(
        tenantId,
        additionalLocalesToSave(liveLocales, savedLocales, isOverLimit),
      ),
    onSuccess: (liveLocales) => {
      setSavedLocales(
        additionalLocalesToSave(liveLocales, savedLocales, isOverLimit),
      );
      toast.success({ message: t('alertSuccess') });
      router.refresh();
    },
    countChanges: (liveLocales, savedLiveLocales) =>
      SUPPORTED_LOCALES.filter(
        (locale) =>
          liveLocales.includes(locale) !== savedLiveLocales.includes(locale),
      ).length,
    draft: {
      tenantId,
      page: 'languages',
      savedAt,
      fields: draftFields,
    },
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
