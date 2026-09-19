import { LINK_TYPE } from '@blog/config/constants';

const LINK_DOCUMENT_TYPE = 'link';

export type TLinkDocumentSource = {
  label?: string;
  accessibleLabel?: string;
  linkType?: string;
  internalReference?: { _ref?: string };
  url?: string;
  openInNewTab?: boolean;
  platform?: string;
};

export type TLinkDocumentFields = {
  _id: string;
  _type: typeof LINK_DOCUMENT_TYPE;
  title: string;
  label?: string;
  linkType?: string;
  openInNewTab?: boolean;
  internalReference?: { _type: 'reference'; _ref: string };
  url?: string;
};

// `platform`/`accessibleLabel` are dropped by omission here — callers report each non-empty occurrence separately.
export const buildLinkDocumentFields = (
  linkId: string,
  title: string,
  link: TLinkDocumentSource,
): TLinkDocumentFields => ({
  _id: linkId,
  _type: LINK_DOCUMENT_TYPE,
  title,
  label: link.label,
  linkType: link.linkType,
  openInNewTab: link.openInNewTab,
  ...(link.linkType === LINK_TYPE.INTERNAL && link.internalReference?._ref
    ? {
        internalReference: {
          _type: 'reference' as const,
          _ref: link.internalReference._ref,
        },
      }
    : {}),
  ...(link.linkType === LINK_TYPE.EXTERNAL && link.url
    ? { url: link.url }
    : {}),
});
