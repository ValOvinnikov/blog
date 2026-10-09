'use client';

import {
  ALERT_TYPE,
  LOCALE_ISO_CODES,
  type TLocaleIsoCode,
} from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { Card } from '@platform/components/shared/card';
import { SettingRow } from '@platform/components/shared/setting-row';
import { SettingsFormShell } from '@platform/components/shared/settings-form-shell';
import { Switch } from '@platform/components/shared/switch';
import { Text } from '@platform/components/shared/text';
import { useToast } from '@platform/context/toast-provider';
import { useFormSubmission } from '@platform/utils/use-form-submission/use-form-submission';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { languagesSettingsVariants } from './languages-settings-variants';

const SUPPORTED_LOCALES = Object.values(LOCALE_ISO_CODES);

// Past the limit nothing is dropped: switched-off stored locales stay after
// the live ones, since only the first ones within the limit are served.
const additionalLocalesToSave = (
  liveLocales: TLocaleIsoCode[],
  storedLocales: TLocaleIsoCode[],
  isOverLimit: boolean,
): TLocaleIsoCode[] => {
  const orderedLive = SUPPORTED_LOCALES.filter((locale) =>
    liveLocales.includes(locale),
  );

  if (!isOverLimit) {
    return orderedLive;
  }

  return [
    ...orderedLive,
    ...storedLocales.filter((locale) => !liveLocales.includes(locale)),
  ];
};

export type TLanguagesSettingsProps = {
  tenantId: string;
  defaultLocale: TLocaleIsoCode;
  storedLocales: TLocaleIsoCode[];
  additionalLocaleLimit: number;
  saveAction: (
    tenantId: string,
    additionalLocales: TLocaleIsoCode[],
  ) => Promise<{ ok: boolean }>;
  savedAt?: Date;
  archivedAt?: Date;
};

export const LanguagesSettings = ({
  tenantId,
  defaultLocale,
  storedLocales,
  additionalLocaleLimit,
  saveAction,
  savedAt,
  archivedAt,
}: TLanguagesSettingsProps) => {
  const isArchived = Boolean(archivedAt);
  const archivedNoticeId = useId();
  const t = useTranslations('languagesSettings');
  const tLanguage = useTranslations('languageNames');
  const { defaultLanguage } = languagesSettingsVariants();
  const toast = useToast();
  const router = useRouter();
  const [savedLocales, setSavedLocales] = useState(storedLocales);
  const [savedLiveLocales, setSavedLiveLocales] = useState(() =>
    storedLocales.slice(0, additionalLocaleLimit),
  );
  const isOverLimit = savedLocales.length > additionalLocaleLimit;
  const { values, setValues, status, isPending, handleSubmit } =
    useFormSubmission<TLocaleIsoCode[], { ok: boolean }>({
      initialValues: savedLiveLocales,
      onSubmit: (liveLocales) =>
        saveAction(
          tenantId,
          additionalLocalesToSave(liveLocales, savedLocales, isOverLimit),
        ),
      onSuccess: (liveLocales) => {
        setSavedLocales(
          additionalLocalesToSave(liveLocales, savedLocales, isOverLimit),
        );
        setSavedLiveLocales(liveLocales);
        toast.success({ message: t('alertSuccess') });
        router.refresh();
      },
    });

  const changeCount = SUPPORTED_LOCALES.filter(
    (locale) => values.includes(locale) !== savedLiveLocales.includes(locale),
  ).length;
  const isAtLimit = values.length >= additionalLocaleLimit;

  const handleToggle = (locale: TLocaleIsoCode, checked: boolean) => {
    setValues((prev) =>
      checked ? [...prev, locale] : prev.filter((live) => live !== locale),
    );
  };

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
      saveButtonLabel={t('saveButton')}
      savingButtonLabel={t('savingButton')}
      onSave={handleSubmit}
      onDiscard={() => setValues(savedLiveLocales)}
      changeCount={changeCount}
      isPending={isPending}
      archivedAt={archivedAt}
      archivedNoticeId={archivedNoticeId}
      hasError={status === 'error'}
      errorTitle={t('alertError')}
      draft={{
        tenantId,
        page: 'languages',
        values,
        savedValues: savedLiveLocales,
        savedAt,
        fields: SUPPORTED_LOCALES.filter(
          (locale) => locale !== defaultLocale,
        ).map((locale) => ({
          id: locale,
          label: tLanguage(locale),
          display: (liveLocales: TLocaleIsoCode[]) =>
            liveLocales.includes(locale) ? t('switchOn') : t('switchOff'),
        })),
        onRestore: setValues,
      }}
    >
      <Card>
        <Card.Header title={t('defaultHeading')} headingLevel={2} />
        <Card.Body>
          <Text className={defaultLanguage()}>{tLanguage(defaultLocale)}</Text>
          <Text variant="supporting">{t('defaultDescription')}</Text>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header
          title={t('additionalHeading')}
          headingLevel={2}
          supportingText={t('allowance', {
            used: values.length,
            allowed: additionalLocaleLimit,
          })}
        />
        <Card.Body>
          {notice && <Alert type={ALERT_TYPE.INFO} title={notice} />}
          {SUPPORTED_LOCALES.filter((locale) => locale !== defaultLocale).map(
            (locale) => {
              const isLive = values.includes(locale);
              const isStored = savedLocales.includes(locale);
              const isLocked =
                !isLive && (isAtLimit || (isOverLimit && !isStored));
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
                  isLocked={isLocked && additionalLocaleLimit === 0}
                  lockedReason={t('planLockedBadge')}
                >
                  <Switch
                    isChecked={isLive}
                    onCheckedChange={(checked) => handleToggle(locale, checked)}
                    isDisabled={isLocked || isPending || isArchived}
                    ariaLabel={label}
                    labels={{ on: t('switchOn'), off: t('switchOff') }}
                    aria-describedby={isArchived ? archivedNoticeId : undefined}
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
