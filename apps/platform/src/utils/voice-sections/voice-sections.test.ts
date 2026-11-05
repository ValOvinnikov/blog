import { VOICE_SURFACE, type TVoiceFieldId } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import {
  VOICE_CARD_ID,
  VOICE_SECTION,
  VOICE_SECTION_ID,
  type TVoiceSection,
} from '@platform/constants/voice';
import {
  buildVoiceDraft,
  localeDraftOf,
} from '@platform/utils/voice-draft/voice-draft';

import {
  countVoiceSectionCustomised,
  countVoiceSectionErrors,
  voiceCardHref,
  voiceHashTarget,
  voiceSectionFields,
  voiceSectionOf,
  voiceSectionOfField,
} from './voice-sections';

faker.seed(6417);

const { EN } = LOCALE_ISO_CODES;

const HEADING_ID = 'notFoundHeading' satisfies TVoiceFieldId;
const TOPIC_EMPTY_ID = 'topicEmpty' satisfies TVoiceFieldId;
const BOOKMARKS_EMPTY_ID = 'bookmarksEmpty' satisfies TVoiceFieldId;
const MOCK_TEXT = faker.lorem.words(2);

describe(voiceSectionOf, () => {
  it.each([
    [VOICE_SURFACE.NOT_FOUND, VOICE_SECTION.ERROR_PAGES],
    [VOICE_SURFACE.ERROR, VOICE_SECTION.ERROR_PAGES],
    [VOICE_SURFACE.ARCHIVE, VOICE_SECTION.EMPTY_STATES],
    [VOICE_SURFACE.BOOKMARKS, VOICE_SECTION.EMPTY_STATES],
  ])('puts %s in %s', (surface, section) => {
    expect(voiceSectionOf(surface)).toBe(section);
  });
});

describe(voiceSectionOfField, () => {
  it.each<[TVoiceFieldId, TVoiceSection]>([
    [HEADING_ID, VOICE_SECTION.ERROR_PAGES],
    [TOPIC_EMPTY_ID, VOICE_SECTION.EMPTY_STATES],
  ])('finds the section holding %s', (fieldId, section) => {
    expect(voiceSectionOfField(fieldId)).toBe(section);
  });
});

describe(voiceSectionFields, () => {
  it.each([
    [VOICE_SECTION.ERROR_PAGES, 5],
    [VOICE_SECTION.EMPTY_STATES, 6],
  ])('counts every field of %s, a list as one', (section, total) => {
    expect(voiceSectionFields(section)).toHaveLength(total);
  });
});

describe(countVoiceSectionCustomised, () => {
  it('counts only the customised fields inside the section', () => {
    const values = localeDraftOf(
      buildVoiceDraft(
        {
          [EN]: { [HEADING_ID]: MOCK_TEXT, [BOOKMARKS_EMPTY_ID]: MOCK_TEXT },
        },
        [EN],
      ),
      EN,
    );

    expect(countVoiceSectionCustomised(values, VOICE_SECTION.ERROR_PAGES)).toBe(
      1,
    );
  });
});

describe(countVoiceSectionErrors, () => {
  it('counts only the rejected fields inside the section', () => {
    const errors = { [HEADING_ID]: MOCK_TEXT, [TOPIC_EMPTY_ID]: MOCK_TEXT };

    expect(countVoiceSectionErrors(errors, VOICE_SECTION.EMPTY_STATES)).toBe(1);
  });
});

describe(voiceHashTarget, () => {
  it.each([
    [
      VOICE_SECTION_ID[VOICE_SECTION.ERROR_PAGES].section,
      VOICE_SECTION.ERROR_PAGES,
    ],
    [VOICE_CARD_ID[VOICE_SURFACE.ARCHIVE].card, VOICE_SECTION.EMPTY_STATES],
  ])('resolves the hash of %s to its section', (id, section) => {
    expect(voiceHashTarget(`#${id}`)).toEqual({ section, id });
  });

  it('resolves a card href back to its own card', () => {
    const target = voiceHashTarget(voiceCardHref(VOICE_SURFACE.BOOKMARKS));

    expect(target).toEqual({
      section: VOICE_SECTION.EMPTY_STATES,
      id: VOICE_CARD_ID[VOICE_SURFACE.BOOKMARKS].card,
    });
  });

  it.each(['', '#elsewhere'])('ignores the hash %j', (hash) => {
    expect(voiceHashTarget(hash)).toBeUndefined();
  });
});
