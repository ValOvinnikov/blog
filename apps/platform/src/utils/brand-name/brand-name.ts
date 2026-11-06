import { BRAND_NAME_MAX_LENGTH } from '@blog/db/constants';

export const isBrandNameTooLong = (brandName: string): boolean =>
  brandName.trim().length > BRAND_NAME_MAX_LENGTH;
