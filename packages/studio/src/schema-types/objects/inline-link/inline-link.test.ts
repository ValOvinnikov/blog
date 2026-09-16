import {
  SOCIAL_PLATFORMS,
  SOCIAL_PLATFORM_LABEL,
} from '@blog/config/constants';
import { inlineLinkSchema } from '@blog/studio/schema-types/objects/inline-link/inline-link';

const getPlatformField = () => {
  const field = inlineLinkSchema.fields.find(
    (field): field is typeof field & { name: 'platform' } =>
      'name' in field && field.name === 'platform',
  );

  if (!field) {
    throw new Error('Expected inlineLinkSchema to define a "platform" field.');
  }

  return field;
};

const getOptionValues = (field: { options?: unknown }) => {
  const options = field.options;
  const list =
    options && typeof options === 'object' && 'list' in options
      ? (options as { list: unknown }).list
      : undefined;

  if (!list) {
    throw new Error('Expected field to define an options.list.');
  }

  return list as { title: string; value: string }[];
};

describe('inlineLinkSchema', () => {
  describe('platform options', () => {
    it('titles each option from SOCIAL_PLATFORM_LABEL, not toTitleCase', () => {
      const field = getPlatformField();
      const list = getOptionValues(field);

      expect(list).toEqual(
        Object.values(SOCIAL_PLATFORMS).map((value) => ({
          title: SOCIAL_PLATFORM_LABEL[value],
          value,
        })),
      );
      expect(
        list.find((option) => option.value === SOCIAL_PLATFORMS.GITHUB)?.title,
      ).toBe('GitHub');
    });
  });
});
