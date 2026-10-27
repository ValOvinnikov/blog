import {
  LOCALE_ISO_CODES,
  VOICE_FIELD_ERROR,
  VOICE_FIELDS,
} from '@blog/config';
import { faker } from '@faker-js/faker';

import { toVoiceFieldMessages } from './voice-field-errors';

faker.seed(6006);

const { EN, DE } = LOCALE_ISO_CODES;

const [{ id: MOCK_FIELD_ID, max: MOCK_FIELD_MAX }] = VOICE_FIELDS;
const MOCK_FAILURE = {
  reason: VOICE_FIELD_ERROR.TOO_LONG,
  values: { max: MOCK_FIELD_MAX },
};
const MOCK_MESSAGE = faker.lorem.sentence();

describe(toVoiceFieldMessages, () => {
  it('gives back the message for each failed field, language by language', () => {
    const toMessage = vi.fn(() => MOCK_MESSAGE);

    const messages = toVoiceFieldMessages(
      { [DE]: { [MOCK_FIELD_ID]: MOCK_FAILURE } },
      toMessage,
    );

    expect(messages).toEqual({ [DE]: { [MOCK_FIELD_ID]: MOCK_MESSAGE } });
    expect(toMessage).toHaveBeenCalledWith(MOCK_FAILURE);
  });

  it('leaves out a language with no failures', () => {
    const messages = toVoiceFieldMessages({ [EN]: {} }, () => MOCK_MESSAGE);

    expect(messages).toEqual({ [EN]: {} });
  });
});
