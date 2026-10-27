import type * as TModule from '@web/metadata/not-found-metadata/build-not-found-metadata';

export const buildNotFoundMetadata = vi.fn<
  typeof TModule.buildNotFoundMetadata
>(async () => ({}));
