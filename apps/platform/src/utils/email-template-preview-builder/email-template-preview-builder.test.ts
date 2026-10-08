import { EMAIL_TEMPLATE_TYPE } from '@blog/config';
import {
  buildInviteMagicLinkEmail,
  buildMagicLinkEmail,
  buildNewsletterConfirmationEmail,
} from '@blog/email/templates/tenant';
import { TENANT_EMAIL_BRAND } from '@platform/testing/tenant-email-brand';

import {
  buildEmailTemplatePreviewHtml,
  type TEmailTemplatePreviewInput,
} from './email-template-preview-builder';

const INPUT: TEmailTemplatePreviewInput = {
  subject: 'Hello',
  body: [
    {
      _type: 'block',
      _key: 'k1',
      style: 'normal',
      children: [{ _type: 'span', _key: 's1', text: 'Body copy', marks: [] }],
      markDefs: [],
    },
  ],
  brand: TENANT_EMAIL_BRAND,
  brandName: 'Acme Co',
  logoImageUrl: 'https://cdn.example.com/logo.png',
};

const PREVIEW_URL = 'https://example.com';
const TENANT_IDENTITY = { brand: INPUT.brand, brandName: INPUT.brandName };

const countAnchors = (html: string) => html.match(/<a\s/g)?.length ?? 0;

describe(buildEmailTemplatePreviewHtml, () => {
  it('renders a magic link through the builder the sign-in email sends with', () => {
    expect(
      buildEmailTemplatePreviewHtml(EMAIL_TEMPLATE_TYPE.MAGIC_LINK, INPUT),
    ).toBe(
      buildMagicLinkEmail({
        url: PREVIEW_URL,
        tenantIdentity: TENANT_IDENTITY,
        subject: INPUT.subject,
        body: INPUT.body,
        logoImageUrl: INPUT.logoImageUrl,
      }).html,
    );
  });

  it('renders a tenant invite through the builder the invite email sends with', () => {
    expect(
      buildEmailTemplatePreviewHtml(EMAIL_TEMPLATE_TYPE.TENANT_INVITE, INPUT),
    ).toBe(
      buildInviteMagicLinkEmail({
        url: PREVIEW_URL,
        tenantIdentity: TENANT_IDENTITY,
        tenantNames: [INPUT.brandName],
        subject: INPUT.subject,
        body: INPUT.body,
        logoImageUrl: INPUT.logoImageUrl,
      }).html,
    );
  });

  it('renders a newsletter confirmation through the builder the confirmation email sends with', () => {
    expect(
      buildEmailTemplatePreviewHtml(
        EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
        INPUT,
      ),
    ).toBe(
      buildNewsletterConfirmationEmail({
        ...INPUT,
        confirmationUrl: PREVIEW_URL,
        unsubscribeUrl: PREVIEW_URL,
      }).html,
    );
  });

  it('names the tenant as the invited organisation in the invite preview', () => {
    expect(
      buildEmailTemplatePreviewHtml(EMAIL_TEMPLATE_TYPE.TENANT_INVITE, INPUT),
    ).toContain('<strong>Acme Co</strong>');
  });

  it('shows one more action in the newsletter preview than in the sign-in preview', () => {
    const signIn = buildEmailTemplatePreviewHtml(
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      INPUT,
    );
    const newsletter = buildEmailTemplatePreviewHtml(
      EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
      INPUT,
    );

    expect(countAnchors(newsletter)).toBe(countAnchors(signIn) + 1);
  });
});
