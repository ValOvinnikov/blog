import { MEDIA_QUERY } from '@platform/constants/media-query';
import { useMediaQuery } from '@platform/utils/use-media-query/use-media-query';

export const useMotionScrollBehavior = (): ScrollBehavior =>
  useMediaQuery(MEDIA_QUERY.REDUCED_MOTION) ? 'instant' : 'smooth';
