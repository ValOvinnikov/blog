import {
  SITE_MESSAGES_BY_LOCALE,
  VOICE_FIELDS,
  VOICE_SURFACE,
  type TVoicePortableText,
} from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import de from '@platform/i18n/messages/de.json';
import en from '@platform/i18n/messages/en.json';
import es from '@platform/i18n/messages/es.json';
import fr from '@platform/i18n/messages/fr.json';
import nl from '@platform/i18n/messages/nl.json';

import {
  buildVoiceDraft,
  countLanguageVoiceChanges,
  countVoiceChanges,
  toVoiceOverridesInput,
  voiceDefaultText,
  voiceErrorsInOrder,
  withVoiceValue,
} from './voice-draft';

const { EN, DE, FR } = LOCALE_ISO_CODES;

const richSupportingText: TVoicePortableText = [
  {
    _type: 'block',
    _key: 'b1',
    style: 'normal',
    children: [
      { _type: 'span', _key: 's1', text: 'Try the ', marks: [] },
      { _type: 'span', _key: 's2', text: 'archive', marks: ['strong', 'l1'] },
    ],
    markDefs: [{ _type: 'link', _key: 'l1', href: '/blog' }],
  },
];

const notFoundField = VOICE_FIELDS.find(({ id }) => id === 'notFoundHeading')!;
const topicField = VOICE_FIELDS.find(({ id }) => id === 'topicEmpty')!;

describe(buildVoiceDraft, () => {
  it('keeps a stored rich value exactly as stored', () => {
    const draft = buildVoiceDraft(
      { [EN]: { notFoundSupportingText: richSupportingText } },
      [EN],
    );

    expect(draft[EN]?.notFoundSupportingText).toEqual(richSupportingText);
  });

  it('reads a legacy plain string on a rich field as one paragraph of that text', () => {
    const draft = buildVoiceDraft({ [EN]: { blogListEmpty: 'Nothing yet.' } }, [
      EN,
    ]);

    expect(draft[EN]?.blogListEmpty).toEqual([
      expect.objectContaining({
        children: [expect.objectContaining({ text: 'Nothing yet.' })],
      }),
    ]);
  });

  it('builds one map per live language, with untouched fields at their default', () => {
    const draft = buildVoiceDraft(
      { [DE]: { notFoundHeading: 'Weg' }, [FR]: { notFoundHeading: 'Perdu' } },
      [EN, DE],
    );

    expect(Object.keys(draft)).toEqual([EN, DE]);
    expect(draft[EN]?.notFoundHeading).toBe('');
    expect(draft[EN]?.notFoundSupportingText).toBeNull();
    expect(draft[DE]?.notFoundHeading).toBe('Weg');
  });
});

describe(toVoiceOverridesInput, () => {
  it('sends customised values unflattened and leaves defaults out', () => {
    const draft = buildVoiceDraft(
      {
        [EN]: {
          notFoundHeading: 'Lost',
          notFoundSupportingText: richSupportingText,
        },
      },
      [EN],
    );

    expect(toVoiceOverridesInput(draft, [EN])).toEqual({
      [EN]: {
        notFoundHeading: 'Lost',
        notFoundSupportingText: richSupportingText,
      },
    });
  });

  it('sends an empty map for a language whose overrides were all cleared', () => {
    const saved = buildVoiceDraft({ [DE]: { notFoundHeading: 'Weg' } }, [
      EN,
      DE,
    ]);

    const draft = withVoiceValue(saved, DE, 'notFoundHeading', '');

    expect(toVoiceOverridesInput(draft, [EN, DE])).toEqual({
      [EN]: {},
      [DE]: {},
    });
  });
});

describe(countVoiceChanges, () => {
  it('counts every changed field across languages, and per language', () => {
    const saved = buildVoiceDraft({}, [EN, DE]);
    const draft = withVoiceValue(
      withVoiceValue(
        withVoiceValue(saved, EN, 'notFoundHeading', 'Lost'),
        DE,
        'notFoundHeading',
        'Weg',
      ),
      DE,
      'bookmarksEmpty',
      richSupportingText,
    );

    expect(countVoiceChanges(saved, draft, [EN, DE])).toBe(3);
    expect(countLanguageVoiceChanges(saved, draft, DE)).toBe(2);
  });
});

describe(voiceDefaultText, () => {
  it("reads the field's catalog default in the requested language", () => {
    expect(voiceDefaultText(DE, notFoundField)).toBe(
      SITE_MESSAGES_BY_LOCALE.DE.notFound.heading,
    );
    expect(voiceDefaultText(EN, topicField)).toBe(
      SITE_MESSAGES_BY_LOCALE.EN.topicPage.empty,
    );
  });
});

describe('platform catalogs', () => {
  it.each(Object.entries({ en, de, es, fr, nl }))(
    'gives every Voice field a label and a hint, and every surface a name and a description, in %s',
    (_, messages) => {
      for (const { id } of VOICE_FIELDS) {
        expect(messages.voiceFieldLabels[id]).toBeTruthy();
        expect(messages.voiceFieldHints[id]).toBeTruthy();
      }
      for (const surface of Object.values(VOICE_SURFACE)) {
        expect(messages.voiceSurfaces[surface]).toBeTruthy();
        expect(messages.voiceSurfaceDescriptions[surface]).toBeTruthy();
      }
    },
  );
});

describe(voiceErrorsInOrder, () => {
  it("lists one language's errors in the order the page shows its fields", () => {
    expect(
      voiceErrorsInOrder(
        {
          [EN]: {
            bookmarksEmpty: 'Too long.',
            blogListEmpty: 'Too long.',
            notFoundHeading: 'Too long.',
          },
        },
        EN,
        [EN],
      ),
    ).toEqual([
      { locale: EN, fieldId: 'notFoundHeading' },
      { locale: EN, fieldId: 'blogListEmpty' },
      { locale: EN, fieldId: 'bookmarksEmpty' },
    ]);
  });

  it('lists the selected language first and counts a field once per language', () => {
    expect(
      voiceErrorsInOrder(
        {
          [EN]: { notFoundHeading: 'Too long.' },
          [DE]: { notFoundHeading: 'Zu lang.' },
        },
        DE,
        [EN, DE],
      ),
    ).toEqual([
      { locale: DE, fieldId: 'notFoundHeading' },
      { locale: EN, fieldId: 'notFoundHeading' },
    ]);
  });

  it('skips cleared errors and languages that are not live', () => {
    expect(
      voiceErrorsInOrder(
        {
          [EN]: { notFoundHeading: undefined },
          [FR]: { notFoundHeading: 'Trop long.' },
        },
        EN,
        [EN, DE],
      ),
    ).toEqual([]);
  });
});
