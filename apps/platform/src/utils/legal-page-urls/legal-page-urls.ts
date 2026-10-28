import { adminRoutes } from '@platform/utils/routes/routes';

export type TLegalPageUrls = {
  terms: string;
  privacy: string;
};

export const toLegalPageUrls = (): TLegalPageUrls => ({
  terms: adminRoutes.terms(),
  privacy: adminRoutes.privacy(),
});
