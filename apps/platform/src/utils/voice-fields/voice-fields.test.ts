import { VOICE_FIELD_GROUPS, VOICE_OVERRIDE_KEYS } from './voice-fields';

describe('VOICE_FIELD_GROUPS', () => {
  it('has exactly 2 groups', () => {
    expect(VOICE_FIELD_GROUPS.map((group) => group.groupKey)).toEqual([
      'notFoundPage',
      'emptyStates',
    ]);
  });

  it('groups fields per the surviving field counts (3/5)', () => {
    expect(VOICE_FIELD_GROUPS.map((group) => group.fields.length)).toEqual([
      3, 5,
    ]);
  });

  it('includes every surviving field name exactly once, with none of the retired prompt/toast/meta keys', () => {
    expect(VOICE_OVERRIDE_KEYS).toEqual([
      'notFoundHeading',
      'notFoundSupportingText',
      'notFoundReturnHome',
      'blogListEmpty',
      'topicEmpty',
      'tagEmpty',
      'topicsEmpty',
      'bookmarksEmpty',
    ]);
  });
});
