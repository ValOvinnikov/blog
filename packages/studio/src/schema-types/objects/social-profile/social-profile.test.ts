import {
  SOCIAL_PLATFORMS,
  SOCIAL_PLATFORM_LABEL,
} from '@blog/config/constants';
import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { socialProfileSchema } from '@blog/studio/schema-types/objects/social-profile/social-profile';
import { getField } from '@blog/studio/testing/get-field';
import { getLayout } from '@blog/studio/testing/get-field-layout';
import { wasRequiredCalled } from '@blog/studio/testing/was-required-called';

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

describe('socialProfileSchema fields', () => {
  it('requires a link reference to the link document', () => {
    const field = getField(socialProfileSchema, 'link');

    expect(field.type).toBe('reference');
    expect('to' in field ? field.to : undefined).toEqual([
      { type: linkSchema.name },
    ]);
    expect(wasRequiredCalled(field)).toBe(true);
  });

  it('requires platform as a radio, titled from SOCIAL_PLATFORM_LABEL', () => {
    const field = getField(socialProfileSchema, 'platform');

    expect(getLayout(field)).toBe('radio');
    expect(wasRequiredCalled(field)).toBe(true);
    expect(getOptionValues(field)).toEqual(
      Object.values(SOCIAL_PLATFORMS).map((value) => ({
        title: SOCIAL_PLATFORM_LABEL[value],
        value,
      })),
    );
  });
});

describe('socialProfileSchema preview', () => {
  const prepare = socialProfileSchema.preview?.prepare;

  it('titles by the link label and subtitles by platform', () => {
    expect(
      prepare?.({
        title: 'Val on LinkedIn',
        platform: SOCIAL_PLATFORMS.LINKEDIN,
      }),
    ).toEqual({ title: 'Val on LinkedIn', subtitle: 'LinkedIn' });
  });

  it('falls back to the platform label, then a placeholder', () => {
    expect(
      prepare?.({ title: undefined, platform: SOCIAL_PLATFORMS.GITHUB }),
    ).toMatchObject({ title: 'GitHub' });
    expect(prepare?.({ title: undefined, platform: undefined })).toMatchObject({
      title: 'No link selected',
    });
  });
});
