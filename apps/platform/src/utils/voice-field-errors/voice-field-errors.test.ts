import { LOCALE_ISO_CODES, VOICE_FIELD_ERROR } from '@blog/config';

import { toVoiceFieldMessages } from './voice-field-errors';

const { EN, DE } = LOCALE_ISO_CODES;

describe(toVoiceFieldMessages, () => {
  it('gives back the message for each failed field, language by language', () => {
    const toMessage = vi.fn(() => 'Use 100 characters or fewer.');

    expect(
      toVoiceFieldMessages(
        {
          [DE]: {
            notFoundHeading: {
              reason: VOICE_FIELD_ERROR.TOO_LONG,
              values: { max: 100 },
            },
          },
        },
        toMessage,
      ),
    ).toEqual({ [DE]: { notFoundHeading: 'Use 100 characters or fewer.' } });
    expect(toMessage).toHaveBeenCalledWith({
      reason: VOICE_FIELD_ERROR.TOO_LONG,
      values: { max: 100 },
    });
  });

  it('leaves out a language with no failures', () => {
    expect(toVoiceFieldMessages({ [EN]: {} }, () => 'unused')).toEqual({
      [EN]: {},
    });
  });
});
