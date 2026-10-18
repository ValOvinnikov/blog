import { LOCALE_ISO_CODES } from '@blog/config';
import { VOICE_FIELD_ERROR } from '@platform/constants/voice';

import {
  toVoiceFieldFailures,
  toVoiceFieldMessages,
} from './voice-field-errors';

const { EN, DE } = LOCALE_ISO_CODES;

describe(toVoiceFieldFailures, () => {
  it('turns each rejected field into a REJECTED failure carrying its message', () => {
    expect(
      toVoiceFieldFailures({
        [DE]: { notFoundHeading: 'Höchstens 100 Zeichen.' },
      }),
    ).toEqual({
      [DE]: {
        notFoundHeading: {
          reason: VOICE_FIELD_ERROR.REJECTED,
          values: { detail: 'Höchstens 100 Zeichen.' },
        },
      },
    });
  });
});

describe(toVoiceFieldMessages, () => {
  it('gives back the message for each failed field, language by language', () => {
    expect(
      toVoiceFieldMessages({
        [EN]: {
          tagEmpty: {
            reason: VOICE_FIELD_ERROR.REJECTED,
            values: { detail: 'Missing required placeholder {name}.' },
          },
        },
      }),
    ).toEqual({ [EN]: { tagEmpty: 'Missing required placeholder {name}.' } });
  });

  it('leaves out a failure that carries no message', () => {
    expect(
      toVoiceFieldMessages({
        [EN]: { tagEmpty: { reason: VOICE_FIELD_ERROR.REJECTED } },
      }),
    ).toEqual({ [EN]: {} });
  });
});
