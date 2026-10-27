import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config';
import { EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE } from '@blog/db/constants/email-template-defaults';
import { faker } from '@faker-js/faker';
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

faker.seed(6006);

const { EN, FR } = LOCALE_ISO_CODES;
const { MAGIC_LINK, TENANT_INVITE } = EMAIL_TEMPLATE_TYPE;
const MOCK_SENDER_LOGO_URL = faker.image.url();
const MOCK_TEMPLATE_LOGO_URL = faker.image.url();
const MOCK_ENGLISH_SUBJECT = faker.lorem.words(2);
const MOCK_FRENCH_SUBJECT = faker.lorem.words(3);
const MOCK_BLANK_SUBJECT = '   ';

describe(resolveFallbackCopy, () => {
  it('falls back to the product default in the default language', () => {
    const draft = withCopy(
      mockEmailDraft(),
      { templateType: TENANT_INVITE, locale: EN },
      { subject: '', body: null },
    );

    const copy = resolveFallbackCopy(draft, TENANT_INVITE, EN, EN);

    expect(copy).toEqual(
      EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE.EN.TENANT_INVITE,
    );
  });

  it("falls back to the tenant's default-language copy in another language", () => {
    const draft = withCopy(
      mockEmailDraft(),
      { templateType: MAGIC_LINK, locale: EN },
      { subject: MOCK_ENGLISH_SUBJECT, body: MOCK_EMAIL_BODY },
    );

    const copy = resolveFallbackCopy(draft, MAGIC_LINK, FR, EN);

    expect(copy).toEqual({
      subject: MOCK_ENGLISH_SUBJECT,
      body: MOCK_EMAIL_BODY,
    });
  });

  it('falls back to the localized product default when the default is blank', () => {
    const copy = resolveFallbackCopy(mockEmailDraft(), TENANT_INVITE, FR, EN);

    expect(copy).toEqual(
      EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE.FR.TENANT_INVITE,
    );
  });
});

describe(resolveEmailPreview, () => {
  it("previews the tenant's own subject and body", () => {
    const draft = withCopy(
      mockEmailDraft(),
      { templateType: MAGIC_LINK, locale: FR },
      { subject: MOCK_FRENCH_SUBJECT, body: MOCK_EMAIL_BODY },
    );

    const { subject, body } = resolveEmailPreview(draft, MAGIC_LINK, FR, EN);

    expect(subject).toBe(MOCK_FRENCH_SUBJECT);
    expect(body).toEqual(MOCK_EMAIL_BODY);
  });

  it('previews the fallback copy for a blank subject and body', () => {
    const draft = withCopy(
      mockEmailDraft(),
      { templateType: TENANT_INVITE, locale: EN },
      { subject: MOCK_BLANK_SUBJECT, body: null },
    );
    const { subject, body } =
      EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE.EN.TENANT_INVITE;

    const preview = resolveEmailPreview(draft, TENANT_INVITE, EN, EN);

    expect(preview.subject).toBe(subject);
    expect(preview.body).toEqual(body);
  });

  it("uses the template's own logo over the sender logo", () => {
    const draft = withLogo(
      withLogo(mockEmailDraft(), EMAIL_SENDER_ITEM, {
        url: MOCK_SENDER_LOGO_URL,
      }),
      MAGIC_LINK,
      { url: MOCK_TEMPLATE_LOGO_URL },
    );

    const { logo } = resolveEmailPreview(draft, MAGIC_LINK, EN, EN);

    expect(logo).toEqual({ url: MOCK_TEMPLATE_LOGO_URL });
  });

  it('falls back to the sender logo when the template has none', () => {
    const draft = withLogo(mockEmailDraft(), EMAIL_SENDER_ITEM, {
      url: MOCK_SENDER_LOGO_URL,
    });

    const { logo } = resolveEmailPreview(draft, TENANT_INVITE, EN, EN);

    expect(logo).toEqual({ url: MOCK_SENDER_LOGO_URL });
  });
});
