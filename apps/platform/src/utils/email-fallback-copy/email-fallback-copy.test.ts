import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config';
import { EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE } from '@blog/db/constants/email-template-defaults';
import { mockEmailDraft, MOCK_EMAIL_BODY } from '@platform/testing/email-draft';
import {
  EMAIL_SENDER_ITEM,
  withCopy,
  withLogo,
} from '@platform/utils/email-draft/email-draft';

import {
  resolveEmailPreview,
  resolveFallbackCopy,
} from './email-fallback-copy';

const { EN, FR } = LOCALE_ISO_CODES;
const { MAGIC_LINK, TENANT_INVITE } = EMAIL_TEMPLATE_TYPE;
const SENDER_LOGO_URL = 'https://cdn.example/sender.png';
const SIGN_IN_LOGO_URL = 'https://cdn.example/sign-in.png';

describe('resolveFallbackCopy', () => {
  it('falls back to the product default in the default language', () => {
    const draft = withCopy(
      mockEmailDraft(),
      { templateType: TENANT_INVITE, locale: EN },
      { subject: '', body: null },
    );

    expect(resolveFallbackCopy(draft, TENANT_INVITE, EN, EN)).toEqual(
      EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE.EN.TENANT_INVITE,
    );
  });

  it("falls back to the tenant's default-language copy in another language", () => {
    const draft = withCopy(
      mockEmailDraft(),
      { templateType: MAGIC_LINK, locale: EN },
      { subject: 'Sign in', body: MOCK_EMAIL_BODY },
    );

    expect(resolveFallbackCopy(draft, MAGIC_LINK, FR, EN)).toEqual({
      subject: 'Sign in',
      body: MOCK_EMAIL_BODY,
    });
  });

  it('falls back to the product default in that language when the default language is blank', () => {
    expect(
      resolveFallbackCopy(mockEmailDraft(), TENANT_INVITE, FR, EN),
    ).toEqual(EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE.FR.TENANT_INVITE);
  });
});

describe('resolveEmailPreview', () => {
  it("previews the tenant's own subject and body", () => {
    const draft = withCopy(
      mockEmailDraft(),
      { templateType: MAGIC_LINK, locale: FR },
      { subject: 'Connexion', body: MOCK_EMAIL_BODY },
    );

    expect(resolveEmailPreview(draft, MAGIC_LINK, FR, EN)).toMatchObject({
      subject: 'Connexion',
      body: MOCK_EMAIL_BODY,
    });
  });

  it('previews the fallback copy for a blank subject and body', () => {
    const draft = withCopy(
      mockEmailDraft(),
      { templateType: TENANT_INVITE, locale: EN },
      { subject: '   ', body: null },
    );

    expect(resolveEmailPreview(draft, TENANT_INVITE, EN, EN)).toMatchObject(
      EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE.EN.TENANT_INVITE,
    );
  });

  it("uses the template's own logo over the sender logo", () => {
    const draft = withLogo(
      withLogo(mockEmailDraft(), EMAIL_SENDER_ITEM, {
        url: SENDER_LOGO_URL,
      }),
      MAGIC_LINK,
      { url: SIGN_IN_LOGO_URL },
    );

    expect(resolveEmailPreview(draft, MAGIC_LINK, EN, EN).logo).toEqual({
      url: SIGN_IN_LOGO_URL,
    });
  });

  it('falls back to the sender logo when the template has none', () => {
    const draft = withLogo(mockEmailDraft(), EMAIL_SENDER_ITEM, {
      url: SENDER_LOGO_URL,
    });

    expect(resolveEmailPreview(draft, TENANT_INVITE, EN, EN).logo).toEqual({
      url: SENDER_LOGO_URL,
    });
  });
});
