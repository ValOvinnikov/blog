import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config';
import { buildTestEmailDraft } from '@platform/testing/email-draft';

const { EN, FR } = LOCALE_ISO_CODES;
const { MAGIC_LINK, TENANT_INVITE } = EMAIL_TEMPLATE_TYPE;

describe('buildEmailDraft', () => {
  it('fills every live language of every template, blank where nothing was written', () => {
    const draft = buildTestEmailDraft();

    expect(draft.copies[MAGIC_LINK][EN]).toEqual({
      subject: 'Sign in',
      body: null,
    });
    expect(draft.copies[MAGIC_LINK][FR]).toEqual({ subject: '', body: null });
    expect(draft.copies[TENANT_INVITE][FR]).toEqual({
      subject: '',
      body: null,
    });
  });
});
