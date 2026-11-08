export type { TSectionDocumentType } from '@blog/service/shared/types/page/section-document-type';
export type {
  TSectionDocumentKind,
  TSectionDocumentLink,
} from './adaptor/by-kind/types';
export type { TSectionDocumentDetail } from './adaptor/detail-page/types';
export { createSectionDocumentService } from './application/service';
