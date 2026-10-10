import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config';
import { EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE } from '@blog/db/constants/email-template-defaults';
import { buildTestEmailDraft, EMAIL_BODY } from '@platform/testing/email-draft';
import { withCopy } from '@platform/utils/email-draft/email-draft';

import { resolveFallbackCopy } from './email-fallback-copy';

const { EN, FR } = LOCALE_ISO_CODES;
const { MAGIC_LINK, TENANT_INVITE } = EMAIL_TEMPLATE_TYPE;

describe('resolveFallbackCopy', () => {
  it('falls back to the product default in the default language', () => {
    const draft = withCopy(
      buildTestEmailDraft(),
      { templateType: TENANT_INVITE, locale: EN },
      { subject: '', body: null },
    );

    expect(resolveFallbackCopy(draft, TENANT_INVITE, EN, EN)).toEqual(
      EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE.EN.TENANT_INVITE,
    );
  });

  it("falls back to the tenant's default-language copy in another language", () => {
    const draft = withCopy(
      buildTestEmailDraft(),
      { templateType: MAGIC_LINK, locale: EN },
      { subject: 'Sign in', body: EMAIL_BODY },
    );

    expect(resolveFallbackCopy(draft, MAGIC_LINK, FR, EN)).toEqual({
      subject: 'Sign in',
      body: EMAIL_BODY,
    });
  });

  it('falls back to the product default in that language when the default language is blank', () => {
    expect(
      resolveFallbackCopy(buildTestEmailDraft(), TENANT_INVITE, FR, EN),
    ).toEqual(EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE.FR.TENANT_INVITE);
  });
});
