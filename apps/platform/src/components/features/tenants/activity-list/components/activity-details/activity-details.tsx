import { LOCALE_BCP47_TAGS } from '@blog/config';
import type { TActivityDetail } from '@platform/components/features/tenants/activity-list/to-activity-details';
import { ACTIVITY_DETAIL } from '@platform/constants/activity';
import { useLocale, useTranslations } from 'next-intl';

import { activityDetailsVariants } from './activity-details-variants';

export type TActivityDetailsProps = {
  details: readonly TActivityDetail[];
};

export const ActivityDetails = ({ details }: TActivityDetailsProps) => {
  const t = useTranslations('activityList.detail');
  const tCategory = useTranslations('suspensionCategory');
  const tLanguage = useTranslations('languageNames');
  const locale = useLocale();
  const { list, item } = activityDetailsVariants();
  const listFormat = new Intl.ListFormat(LOCALE_BCP47_TAGS[locale], {
    type: 'conjunction',
  });

  const describe = (detail: TActivityDetail) => {
    switch (detail.kind) {
      case ACTIVITY_DETAIL.CHANGED_FIELDS:
        return t(detail.kind, {
          fields: listFormat.format(
            detail.fields.map((field) => t(`field.${field}`)),
          ),
        });
      case ACTIVITY_DETAIL.MAIN_ADDRESS_CHANGED:
        return t(detail.kind, { from: detail.from, to: detail.to });
      case ACTIVITY_DETAIL.CUSTOM_DOMAIN_REQUESTED:
      case ACTIVITY_DETAIL.CUSTOM_DOMAIN_REMOVED:
        return t(detail.kind, { domain: detail.domain });
      case ACTIVITY_DETAIL.ADDITIONAL_LANGUAGES:
        return t(detail.kind, {
          count: detail.locales.length,
          languages: listFormat.format(
            detail.locales.map((code) => tLanguage(code)),
          ),
        });
      case ACTIVITY_DETAIL.SUSPENSION_REASON:
        return t(detail.kind, { category: tCategory(detail.category) });
      case ACTIVITY_DETAIL.SUSPENSION_REFERENCE:
        return t(detail.kind, { reference: detail.reference });
      case ACTIVITY_DETAIL.PLAN:
        return t(detail.kind, { plan: detail.plan });
      case ACTIVITY_DETAIL.SIGN_IN_PROVIDER:
        return t(detail.kind, { provider: detail.provider });
      default:
        return t(detail.kind);
    }
  };

  return (
    <ul className={list()}>
      {details.map((detail) => (
        <li key={detail.kind} className={item()}>
          {describe(detail)}
        </li>
      ))}
    </ul>
  );
};
