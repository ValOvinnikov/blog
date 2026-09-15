import { footerSettingsSchema } from '@blog/studio/schema-types/documents/settings/footer/footer';
import { socialProfileSchema } from '@blog/studio/schema-types/objects/social-profile/social-profile';

describe('footerSettingsSchema social', () => {
  it('authors social links as socialProfile objects, not inline links', () => {
    const field = footerSettingsSchema.fields.find(
      (
        field,
      ): field is typeof field & { name: 'social'; of: { type: string }[] } =>
        'name' in field && field.name === 'social',
    );

    if (!field) {
      throw new Error(
        'Expected footerSettingsSchema to define a "social" field.',
      );
    }

    expect(field.of).toEqual([{ type: socialProfileSchema.name }]);
  });
});
