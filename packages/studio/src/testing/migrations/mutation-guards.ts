import type { CreateIfNotExistsMutation, PatchMutation } from 'sanity/migrate';

export type TMockLinkDocument = {
  _id: string;
  _type: string;
  title?: string;
  label?: string;
  linkType?: string;
  openInNewTab?: boolean;
  internalReference?: { _type: string; _ref: string };
  url?: string;
};

const hasMutationType = (mutation: unknown, type: string): boolean =>
  typeof mutation === 'object' &&
  mutation !== null &&
  (mutation as { type?: string }).type === type;

export const isCreateIfNotExistsMutation = (
  mutation: unknown,
): mutation is CreateIfNotExistsMutation<TMockLinkDocument> =>
  hasMutationType(mutation, 'createIfNotExists');

export const isPatchMutation = (mutation: unknown): mutation is PatchMutation =>
  hasMutationType(mutation, 'patch');
