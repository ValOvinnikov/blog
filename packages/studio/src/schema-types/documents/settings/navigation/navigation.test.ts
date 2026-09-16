import { navigationSettingsSchema } from '@blog/studio/schema-types/documents/settings/navigation/navigation';
import { linkRefSchema } from '@blog/studio/schema-types/objects/link-ref/link-ref';

describe('navigationSettingsSchema', () => {
  describe('items', () => {
    it('authors header links as linkRef references, not inline links', () => {
      const field = navigationSettingsSchema.fields.find(
        (
          field,
        ): field is typeof field & { name: 'items'; of: { type: string }[] } =>
          'name' in field && field.name === 'items',
      );

      if (!field) {
        throw new Error(
          'Expected navigationSettingsSchema to define an "items" field.',
        );
      }

      expect(field.of).toEqual([{ type: linkRefSchema.name }]);
    });
  });
});
