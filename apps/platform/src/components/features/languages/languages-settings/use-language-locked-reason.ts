import { useTranslations } from 'next-intl';

export const useLanguageLockedReason = (
  allowed: number,
  isOverLimit: boolean,
) => {
  const t = useTranslations('languagesSettings');

  if (allowed === 0) return t('planLockedBadge');

  return t(isOverLimit ? 'overLimitLockedReason' : 'atLimitLockedReason');
};
