'use client';

import { ICONS, LOCALE_BCP47_TAGS, type TLocaleIsoCode } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { Disclosure } from '@platform/components/shared/disclosure';
import { Icon } from '@platform/components/shared/icon';
import type { TDraftDifference } from '@platform/components/shared/settings-form-shell/use-settings-draft';
import { useLocale, useTranslations } from 'next-intl';
import { useId, useState } from 'react';

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
  const titleId = useId();
  const [now] = useState(() => new Date());
  const differenceCount = differences.length;
  const hasDifferences = differenceCount > 0;
  const { root, icon, body, title, actions } = draftRecoveryBannerVariants({
    hasDifferences,
  });
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
    <section aria-labelledby={titleId} className={root()}>
      <Icon
        name={hasDifferences ? ICONS.WARNING : ICONS.CLOCK}
        className={icon()}
      />
      <div className={body()}>
        <p>
          <strong id={titleId} className={title()}>
            {heading}
          </strong>{' '}
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
        <div className={actions()}>
          {hasDifferences ? (
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
          )}
        </div>
      </div>
    </section>
  );
};
