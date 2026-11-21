import {
  type TGrantItem,
  toGrantItemLabel,
} from '@platform/utils/grant-item-label/grant-item-label';
import { useTranslations } from 'next-intl';

export const useGrantItemLabel = () => {
  const tFeature = useTranslations('featuresSettings');
  const tNames = useTranslations('grantItemNames');

  return (item: TGrantItem) => toGrantItemLabel({ tFeature, tNames }, item);
};
