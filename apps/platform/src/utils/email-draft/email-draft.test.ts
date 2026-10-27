import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config';
import {
  mockEmailDraft,
  MOCK_EMAIL_SUBJECT,
} from '@platform/testing/email-draft';

import { buildEmailDraft } from './email-draft';

const { EN, FR } = LOCALE_ISO_CODES;
const { MAGIC_LINK, TENANT_INVITE } = EMAIL_TEMPLATE_TYPE;

const MOCK_BLANK_COPY = { subject: '', body: null };

describe(buildEmailDraft, () => {
  it('fills every live language of every template, blank where nothing was written', () => {
    const draft = mockEmailDraft();

    expect(draft.copies[MAGIC_LINK][EN]).toEqual({
      subject: MOCK_EMAIL_SUBJECT,
      body: null,
    });
    expect(draft.copies[MAGIC_LINK][FR]).toEqual(MOCK_BLANK_COPY);
    expect(draft.copies[TENANT_INVITE][FR]).toEqual(MOCK_BLANK_COPY);
  });
});
