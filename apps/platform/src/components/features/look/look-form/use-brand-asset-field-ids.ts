import type { TBrandAssetKind } from '@platform/utils/brand-asset-limits/brand-asset-limits';
import { useId } from 'react';

export const useBrandAssetFieldIds = (): Record<TBrandAssetKind, string> => ({
  logo: useId(),
  logoDark: useId(),
  favicon: useId(),
});
