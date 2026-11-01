'use client';

import {
  ALERT_TYPE,
  LOCALE_ISO_CODES,
  type TLocaleIsoCode,
  FORM_STATUS,
} from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { Card } from '@platform/components/shared/card';
import { SettingRow } from '@platform/components/shared/setting-row';
import {
  SettingsFormShell,
  useSettingsForm,
} from '@platform/components/shared/settings-form-shell';
import { Switch } from '@platform/components/shared/switch';
import { Text } from '@platform/components/shared/text';
import { useToast } from '@platform/context/toast-provider';
import {
  updateTenantLanguagesAction,
  type TUpdateTenantLanguagesResult,
} from '@platform/server/tenants/update-tenant-languages-action';
import { additionalLocalesToSave } from '@platform/utils/additional-locales-to-save/additional-locales-to-save';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { languagesSettingsVariants } from './languages-settings-variants';

const SUPPORTED_LOCALES = Object.values(LOCALE_ISO_CODES);

export type TLanguagesSettingsProps = {
  tenantId: string;
  defaultLocale: TLocaleIsoCode;
  locales: {
    stored: TLocaleIsoCode[];
    live: TLocaleIsoCode[];
    limit: number;
  };
  savedAt?: Date;
  archivedAt?: Date;
};

export const LanguagesSettings = ({
  tenantId,
  defaultLocale,
  locales,
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
      fields: SUPPORTED_LOCALES.filter(
        (locale) => locale !== defaultLocale,
      ).map((locale) => ({
        id: locale,
        label: tLanguage(locale),
        display: (liveLocales: TLocaleIsoCode[]) =>
          liveLocales.includes(locale) ? t('switchOn') : t('switchOff'),
      })),
    },
  });

  const isAtLimit = values.length >= additionalLocaleLimit;

  const handleToggle = (locale: TLocaleIsoCode, checked: boolean) => {
    setValues((prev) =>
      checked ? [...prev, locale] : prev.filter((live) => live !== locale),
    );
  };

  const lockedReason = (() => {
    if (additionalLocaleLimit === 0) {
      return t('planLockedBadge');
    }
    if (isOverLimit) {
      return t('overLimitLockedReason');
    }
    return t('atLimitLockedReason');
  })();

  const notice = (() => {
    if (additionalLocaleLimit === 0) {
      return t('upgradeNotice');
    }
    if (isOverLimit) {
      return t('downgradeNotice', {
        allowed: additionalLocaleLimit,
        stored: savedLocales.length,
      });
    }
    return undefined;
  })();

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
          supportingText={t('allowance', {
            used: values.length,
            allowed: additionalLocaleLimit,
          })}
        />
        <Card.Body>
          {notice && (
            <Alert
              type={ALERT_TYPE.INFO}
              title={t('noticeTitle')}
              description={notice}
            />
          )}
          {SUPPORTED_LOCALES.filter((locale) => locale !== defaultLocale).map(
            (locale) => {
              const isLive = values.includes(locale);
              const isStored = savedLocales.includes(locale);
              const isLocked = isLive
                ? isOverLimit
                : isAtLimit || (isOverLimit && !isStored);
              const label = tLanguage(locale);

              return (
                <SettingRow
                  key={locale}
                  label={label}
                  description={
                    isOverLimit && isStored && !isLive
                      ? t('keptBadge')
                      : undefined
                  }
                  isLocked={isLocked}
                  lockedReason={lockedReason}
                >
                  <Switch
                    aria={{
                      label: label,
                      describedBy: isArchived ? archivedNoticeId : undefined,
                    }}
                    isChecked={isLive}
                    onCheckedChange={(checked) => handleToggle(locale, checked)}
                    isDisabled={isLocked || isPending || isArchived}
                    labels={{ on: t('switchOn'), off: t('switchOff') }}
                  />
                </SettingRow>
              );
            },
          )}
        </Card.Body>
      </Card>
    </SettingsFormShell>
  );
};
