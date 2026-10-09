'use client';

import {
  ALERT_TYPE,
  LOCALE_BCP47_TAGS,
  type TLocaleIsoCode,
} from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { Disclosure } from '@platform/components/shared/disclosure';
import type { TDraftDifference } from '@platform/components/shared/settings-form-shell/use-settings-draft';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

import { DraftDifferences } from './components/draft-differences/draft-differences';
import { draftRecoveryBannerVariants } from './draft-recovery-banner-variants';

export type TDraftRecoveryBannerProps = {
  takenAt: Date;
  savedAt?: Date;
  changeCount: number;
  differences: TDraftDifference[];
  onRestore: () => void;
  onDiscard: () => void;
};

const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

const formatMoment = (date: Date, now: Date, locale: TLocaleIsoCode) => {
  const tag = LOCALE_BCP47_TAGS[locale];
  const isToday = isSameDay(date, now);
  const text = isToday
    ? date.toLocaleTimeString(tag, { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleString(tag, { dateStyle: 'medium', timeStyle: 'short' });
  return { isToday, text };
};

export const DraftRecoveryBanner = ({
  takenAt,
  savedAt,
  changeCount,
  differences,
  onRestore,
  onDiscard,
}: TDraftRecoveryBannerProps) => {
  const t = useTranslations('draftRecovery');
  const locale = useLocale();
  const [now] = useState(() => new Date());
  const differenceCount = differences.length;
  const hasDifferences = differenceCount > 0;
  const { description } = draftRecoveryBannerVariants();
  const taken = formatMoment(takenAt, now, locale);

  const heading = (() => {
    if (!hasDifferences) {
      return t('title', {
        takenAt: taken.isToday
          ? t('todayAt', { time: taken.text })
          : taken.text,
      });
    }
    if (!savedAt) {
      return t('differencesTitleSavedSince', { takenAt: taken.text });
    }
    return t('differencesTitle', {
      takenAt: taken.text,
      savedAt: formatMoment(savedAt, now, locale).text,
    });
  })();

  return (
    <Alert
      type={hasDifferences ? ALERT_TYPE.ERROR : ALERT_TYPE.WARNING}
      role="status"
      title={heading}
      description={
        <div className={description()}>
          <p>
            {hasDifferences
              ? t('differencesDescription', {
                  count: differenceCount,
                  fields: new Intl.ListFormat(LOCALE_BCP47_TAGS[locale], {
                    type: 'conjunction',
                  }).format(differences.map(({ label }) => label)),
                })
              : t('description')}
          </p>
          {hasDifferences && (
            <Disclosure
              summary={t('reviewDifferences', { count: differenceCount })}
            >
              <DraftDifferences differences={differences} />
            </Disclosure>
          )}
        </div>
      }
      action={
        hasDifferences ? (
          <>
            <Button onClick={onRestore}>{t('restoreAnyway')}</Button>
            <Button variant="ghost" onClick={onDiscard}>
              {t('discardDraft')}
            </Button>
          </>
        ) : (
          <>
            <Button variant="primary" onClick={onRestore}>
              {t('restore', { count: changeCount })}
            </Button>
            <Button variant="ghost" onClick={onDiscard}>
              {t('discard')}
            </Button>
          </>
        )
      }
    />
  );
};
