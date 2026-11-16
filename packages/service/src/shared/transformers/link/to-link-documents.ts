import type { ILink, TMaybeNull, TNullable } from '@shinefold/config';
import {
  toLinkDocument,
  type TRawLinkDocument,
} from '@shinefold/service/shared/transformers/link/to-link-document';

export function toLinkDocuments(
  raw: TNullable<TMaybeNull<TRawLinkDocument>[]>,
): ILink[] {
  return (raw ?? []).flatMap((item) => toLinkDocument(item) ?? []);
}
