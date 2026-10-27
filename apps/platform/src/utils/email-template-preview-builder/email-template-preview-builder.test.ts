import { EMAIL_TEMPLATE_TYPE } from '@blog/config';
import {
  buildInviteMagicLinkEmail,
  buildMagicLinkEmail,
  buildNewsletterConfirmationEmail,
} from '@blog/email/templates/tenant';
import { faker } from '@faker-js/faker';
import { MOCK_EMAIL_BODY } from '@platform/testing/email-draft';
import { MOCK_TENANT_EMAIL_BRAND } from '@platform/testing/tenant-email-brand';

import {
  buildEmailTemplatePreviewHtml,
  type TEmailTemplatePreviewInput,
} from './email-template-preview-builder';

faker.seed(6006);

const MOCK_BRAND_NAME = faker.lorem.words(2);

const MOCK_PREVIEW_INPUT: TEmailTemplatePreviewInput = {
  subject: faker.lorem.sentence(),
  body: MOCK_EMAIL_BODY,
  brand: MOCK_TENANT_EMAIL_BRAND,
  brandName: MOCK_BRAND_NAME,
  logoImageUrl: faker.image.url(),
};

const PREVIEW_URL = 'https://example.com';
const TENANT_IDENTITY = {
  brand: MOCK_PREVIEW_INPUT.brand,
  brandName: MOCK_PREVIEW_INPUT.brandName,
};
const { subject, body, logoImageUrl } = MOCK_PREVIEW_INPUT;

const countAnchors = (html: string) => html.match(/<a\s/g)?.length ?? 0;

describe(buildEmailTemplatePreviewHtml, () => {
  it.each([
    {
      templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      sentHtml: () =>
        buildMagicLinkEmail({
          url: PREVIEW_URL,
          tenantIdentity: TENANT_IDENTITY,
          subject,
          body,
          logoImageUrl,
        }).html,
    },
    {
      templateType: EMAIL_TEMPLATE_TYPE.TENANT_INVITE,
      sentHtml: () =>
        buildInviteMagicLinkEmail({
          url: PREVIEW_URL,
          tenantIdentity: TENANT_IDENTITY,
          tenantNames: [MOCK_BRAND_NAME],
          subject,
          body,
          logoImageUrl,
        }).html,
    },
    {
      templateType: EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
      sentHtml: () =>
        buildNewsletterConfirmationEmail({
          ...MOCK_PREVIEW_INPUT,
          confirmationUrl: PREVIEW_URL,
          unsubscribeUrl: PREVIEW_URL,
        }).html,
    },
  ])(
    'renders $templateType through the builder its email sends with',
    ({ templateType, sentHtml }) => {
      const html = buildEmailTemplatePreviewHtml(
        templateType,
        MOCK_PREVIEW_INPUT,
      );

      expect(html).toBe(sentHtml());
    },
  );

  it('names the tenant as the invited organisation in the invite preview', () => {
    const html = buildEmailTemplatePreviewHtml(
      EMAIL_TEMPLATE_TYPE.TENANT_INVITE,
      MOCK_PREVIEW_INPUT,
    );

    expect(html).toContain(`<strong>${MOCK_BRAND_NAME}</strong>`);
  });

  it('shows one more action in the newsletter preview than in the sign-in one', () => {
    const signIn = buildEmailTemplatePreviewHtml(
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      MOCK_PREVIEW_INPUT,
    );
    const newsletter = buildEmailTemplatePreviewHtml(
      EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
      MOCK_PREVIEW_INPUT,
    );

    expect(countAnchors(newsletter)).toBe(countAnchors(signIn) + 1);
  });
});
