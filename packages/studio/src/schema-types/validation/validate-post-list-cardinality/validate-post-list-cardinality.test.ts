import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import { postListSchema } from '@blog/studio/schema-types/modules/post-list/post-list';
import {
  validateHasPostListModule,
  validateSinglePostListModule,
} from '@blog/studio/schema-types/validation/validate-post-list-cardinality/validate-post-list-cardinality';
import type { SanityDocument } from 'sanity';

const NO_POST_LIST_WARNING =
  'This page has no Post List module — the archive will be empty until one is added.';

const asDocument = (doc: Record<string, unknown>): SanityDocument =>
  doc as unknown as SanityDocument;

describe('validateSinglePostListModule', () => {
  it('errors when more than one module_postList is referenced', () => {
    expect(
      validateSinglePostListModule(
        asDocument({
          modules: [
            { _type: postListSchema.name, _ref: 'list-1' },
            { _type: postListSchema.name, _ref: 'list-2' },
          ],
        }),
      ),
    ).toBe('Only one Post List module is allowed per page.');
  });

  it('passes with exactly one module_postList reference', () => {
    expect(
      validateSinglePostListModule(
        asDocument({
          modules: [
            { _type: postListSchema.name, _ref: 'list-1' },
            { _type: postLatestSchema.name, _ref: 'latest-1' },
          ],
        }),
      ),
    ).toBe(true);
  });
});

describe('validateHasPostListModule', () => {
  it('passes with exactly one module_postList reference', () => {
    const validate = validateHasPostListModule(NO_POST_LIST_WARNING);

    expect(
      validate(
        asDocument({
          modules: [{ _type: postListSchema.name, _ref: 'list-1' }],
        }),
      ),
    ).toBe(true);
  });

  it('warns when no module_postList is referenced', () => {
    const validate = validateHasPostListModule(NO_POST_LIST_WARNING);

    expect(
      validate(
        asDocument({
          modules: [{ _type: postLatestSchema.name, _ref: 'latest-1' }],
        }),
      ),
    ).toBe(NO_POST_LIST_WARNING);
  });

  it('warns when modules is undefined', () => {
    const validate = validateHasPostListModule(NO_POST_LIST_WARNING);

    expect(validate(asDocument({}))).toBe(NO_POST_LIST_WARNING);
  });
});
