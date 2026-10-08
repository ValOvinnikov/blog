import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config';
import { EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE } from '@blog/db/constants/email-template-defaults';

import {
  buildEmailDraft,
  countEmailDraftChanges,
  countLanguageChanges,
  EMAIL_SENDER_ITEM,
  listCopyChanges,
  resolveFallbackCopy,
  resolveItemStatus,
  withCopy,
  withLogo,
  type TEmailDraft,
} from './email-draft';

const { EN, FR } = LOCALE_ISO_CODES;
const { MAGIC_LINK, TENANT_INVITE } = EMAIL_TEMPLATE_TYPE;
const LIVE_LOCALES = [EN, FR];

const BODY = [
  {
    _type: 'block',
    _key: 'k1',
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: 's1', text: 'Hello', marks: [] }],
  },
];

const buildDraft = (): TEmailDraft =>
  buildEmailDraft({
    sender: { senderName: '', replyToAddress: '', footerPostalAddress: '' },
    senderLogoUrl: undefined,
    authored: [
      { templateType: MAGIC_LINK, locale: EN, subject: 'Sign in', body: null },
    ],
    templateLogoUrls: {
      MAGIC_LINK: undefined,
      TENANT_INVITE: undefined,
      NEWSLETTER_CONFIRMATION: undefined,
    },
    liveLocales: LIVE_LOCALES,
  });

describe('buildEmailDraft', () => {
  it('fills every live language of every template, blank where nothing was written', () => {
    const draft = buildDraft();

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

describe('resolveFallbackCopy', () => {
  it('falls back to the product default in the default language', () => {
    const draft = withCopy(
      buildDraft(),
      { templateType: TENANT_INVITE, locale: EN },
      { subject: '', body: null },
    );

    expect(resolveFallbackCopy(draft, TENANT_INVITE, EN, EN)).toEqual(
      EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE.EN.TENANT_INVITE,
    );
  });

  it("falls back to the tenant's default-language copy in another language", () => {
    const draft = withCopy(
      buildDraft(),
      { templateType: MAGIC_LINK, locale: EN },
      { subject: 'Sign in', body: BODY },
    );

    expect(resolveFallbackCopy(draft, MAGIC_LINK, FR, EN)).toEqual({
      subject: 'Sign in',
      body: BODY,
    });
  });

  it('falls back to the product default in that language when the default language is blank', () => {
    expect(resolveFallbackCopy(buildDraft(), TENANT_INVITE, FR, EN)).toEqual(
      EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE.FR.TENANT_INVITE,
    );
  });
});

describe('change tracking', () => {
  let saved: TEmailDraft;

  beforeEach(() => {
    saved = buildDraft();
  });

  it('reports no changes for an untouched draft', () => {
    expect(countEmailDraftChanges(saved, saved, LIVE_LOCALES)).toBe(0);
    expect(listCopyChanges(saved, saved, LIVE_LOCALES)).toEqual([]);
  });

  it('counts subject and body edits per language', () => {
    const draft = withCopy(
      saved,
      { templateType: MAGIC_LINK, locale: FR },
      { subject: 'Connexion', body: BODY },
    );

    expect(countLanguageChanges(saved, draft, FR)).toBe(2);
    expect(countLanguageChanges(saved, draft, EN)).toBe(0);
    expect(listCopyChanges(saved, draft, LIVE_LOCALES)).toEqual([
      { templateType: MAGIC_LINK, locale: FR },
    ]);
  });

  it('counts sender fields and staged logos', () => {
    const draft = withLogo(
      { ...saved, sender: { ...saved.sender, senderName: 'Acme' } },
      EMAIL_SENDER_ITEM,
      { url: 'blob:logo', file: new File(['x'], 'logo.png') },
    );

    expect(countEmailDraftChanges(saved, draft, LIVE_LOCALES)).toBe(2);
  });
});

describe('resolveItemStatus', () => {
  let saved: TEmailDraft;

  beforeEach(() => {
    saved = buildDraft();
  });

  it('marks a template customised only in the languages it was written in', () => {
    expect(resolveItemStatus(saved, saved, MAGIC_LINK, EN)).toBe('customised');
    expect(resolveItemStatus(saved, saved, MAGIC_LINK, FR)).toBe('default');
  });

  it('marks a template unsaved while it has an edit in the selected language', () => {
    const draft = withCopy(
      saved,
      { templateType: TENANT_INVITE, locale: FR },
      { subject: 'Invitation', body: null },
    );

    expect(resolveItemStatus(saved, draft, TENANT_INVITE, FR)).toBe('unsaved');
    expect(resolveItemStatus(saved, draft, TENANT_INVITE, EN)).toBe('default');
  });

  it('marks the sender item unsaved after a sender edit', () => {
    const draft = {
      ...saved,
      sender: { ...saved.sender, replyToAddress: 'hi@acme.example' },
    };

    expect(resolveItemStatus(saved, saved, EMAIL_SENDER_ITEM, EN)).toBe(
      'default',
    );
    expect(resolveItemStatus(saved, draft, EMAIL_SENDER_ITEM, EN)).toBe(
      'unsaved',
    );
  });
});
