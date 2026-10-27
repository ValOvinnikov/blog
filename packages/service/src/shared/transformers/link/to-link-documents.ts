import type { ILink, TMaybeNull, TNullable } from '@blog/config';
import {
  toLinkDocument,
  type TRawLinkDocument,
} from '@blog/service/shared/transformers/link/to-link-document';

export function toLinkDocuments(
  raw: TNullable<TMaybeNull<TRawLinkDocument>[]>,
): ILink[] {
  return (raw ?? []).flatMap((item) => toLinkDocument(item) ?? []);
}
