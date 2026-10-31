import { ONBOARDING_TIER_QUERY } from '@platform/constants/onboarding';
import { useMediaQuery } from '@platform/utils/use-media-query/use-media-query';

export const useOnboardingTier = () => {
  const isRailUp = useMediaQuery(ONBOARDING_TIER_QUERY.RAIL);
  const isFull = useMediaQuery(ONBOARDING_TIER_QUERY.FULL);

  return { isPhone: !isRailUp, isRail: isRailUp && !isFull, isFull };
};
