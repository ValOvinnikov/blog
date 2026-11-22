import { SUBSCRIBERS_NOTICE } from '@platform/constants/subscribers';
import type { TSubscribersPageData } from '@platform/server/subscribers/load-subscribers-page';
import {
  DAY_MONTH_LONG_UTC,
  DAY_MONTH_SHORT_UTC,
} from '@platform/utils/date-format-options/date-format-options';
import type { TMaybeUndefined } from '@shinefold/config';
import { utcNextMonthStart } from '@shinefold/utils/date';
import { isUndefined } from '@shinefold/utils/primitives';
import { useFormatter, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { subscribersNoticeVariants } from './subscribers-notice-variants';

export type TSubscribersNoticeCopy = {
  title?: string;
  description: ReactNode;
  note?: string;
  hasMoveUp: boolean;
};

export const useSubscribersNoticeCopy = ({
  notice,
  band,
  emails,
  nextBand,
  offer,
  skippedPost,
  pausedAt,
}: TSubscribersPageData): TMaybeUndefined<TSubscribersNoticeCopy> => {
  const t = useTranslations('subscribersPage.notices');
  const format = useFormatter();
  const { wide, narrow, lead } = subscribersNoticeVariants();
  const resetsOn = format.dateTime(
    utcNextMonthStart(new Date()),
    DAY_MONTH_LONG_UTC,
  );
  const { postTitle, postPublishedAt } = skippedPost ?? {};
  const post =
    postTitle && postPublishedAt
      ? {
          title: postTitle,
          date: format.dateTime(postPublishedAt, DAY_MONTH_SHORT_UTC),
        }
      : undefined;
  const { count, ceiling } = band;
  const { sent, allowance, left, postNeeds, postsLeft } = emails;

  const moveUpNote = (note: string) => {
    if (isUndefined(nextBand))
      return { note: t('largestBand'), hasMoveUp: false };
    return offer ? { note, hasMoveUp: true } : { hasMoveUp: false };
  };
  const nextAllowance = offer?.allowance ?? allowance;

  switch (notice) {
    case SUBSCRIBERS_NOTICE.OPERATOR_PAUSE:
      return {
        title: t('operatorPause.title'),
        description: pausedAt
          ? t('operatorPause.description', {
              date: format.dateTime(pausedAt, DAY_MONTH_LONG_UTC),
            })
          : t('operatorPause.descriptionUndated'),
        hasMoveUp: false,
      };
    case SUBSCRIBERS_NOTICE.BAND_PAUSED: {
      const short = t('bandPaused.descriptionNoPost', { count, ceiling });
      return {
        title: t('bandPaused.title'),
        description: (
          <>
            <span className={wide()}>
              {post
                ? t('bandPaused.description', { count, ceiling, ...post })
                : short}
            </span>
            <span className={narrow()}>{short}</span>
          </>
        ),
        ...moveUpNote(t('bandPaused.note', { ceiling })),
      };
    }
    case SUBSCRIBERS_NOTICE.EMAILS_PAUSED:
      return {
        title: t('emailsPaused.title', { date: resetsOn }),
        description: post
          ? t('emailsPaused.description', {
              ...post,
              needed: skippedPost?.emailsNeeded ?? postNeeds,
              left: skippedPost?.allowanceLeft ?? left,
              resetsOn,
            })
          : t('emailsPaused.descriptionNoPost', {
              count: postNeeds,
              resetsOn,
            }),
        ...moveUpNote(
          t('emailsPaused.note', { allowance: nextAllowance, date: resetsOn }),
        ),
      };
    case SUBSCRIBERS_NOTICE.BAND_NEAR:
      return {
        title: t('bandNear.title'),
        description: t('bandNear.description', { count, ceiling }),
        ...moveUpNote(t('bandNear.note')),
      };
    case SUBSCRIBERS_NOTICE.EMAILS_NEAR:
      return {
        title: t('emailsNear.title'),
        description: t('emailsNear.description', {
          sent,
          allowance,
          count: postNeeds,
          left,
          fit: postsLeft,
          date: resetsOn,
        }),
        ...moveUpNote(t('emailsNear.note', { allowance: nextAllowance })),
      };
    case SUBSCRIBERS_NOTICE.MOVED_UP:
      return {
        description: t.rich('movedUp', {
          ceiling,
          allowance,
          lead: (chunks) => <span className={lead()}>{chunks}</span>,
        }),
        hasMoveUp: false,
      };
    default:
      return undefined;
  }
};
