import { SOCIAL_PLATFORMS } from '@blog/config/constants';
import { socialProfileSchema } from '@blog/studio/schema-types/objects/social-profile/social-profile';

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
