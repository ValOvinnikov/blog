import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config';
import {
  buildTestEmailDraft,
  EMAIL_BODY,
  EMAIL_DRAFT_LIVE_LOCALES,
} from '@platform/testing/email-draft';
import {
  EMAIL_SENDER_ITEM,
  withCopy,
  withLogo,
  type TEmailDraft,
} from '@platform/utils/email-draft/email-draft';

import {
  countEmailDraftChanges,
  countLanguageChanges,
  countSharedChanges,
  listCopyChanges,
  resolveItemStatus,
} from './email-draft-changes';

const { EN, FR } = LOCALE_ISO_CODES;
const { MAGIC_LINK, TENANT_INVITE } = EMAIL_TEMPLATE_TYPE;

describe('change tracking', () => {
  let saved: TEmailDraft;

  beforeEach(() => {
    saved = buildTestEmailDraft();
  });

  it('reports no changes for an untouched draft', () => {
    expect(countEmailDraftChanges(saved, saved, EMAIL_DRAFT_LIVE_LOCALES)).toBe(
      0,
    );
    expect(listCopyChanges(saved, saved, EMAIL_DRAFT_LIVE_LOCALES)).toEqual([]);
  });

  it('counts subject and body edits per language', () => {
    const draft = withCopy(
      saved,
      { templateType: MAGIC_LINK, locale: FR },
      { subject: 'Connexion', body: EMAIL_BODY },
    );

    expect(countLanguageChanges(saved, draft, FR)).toBe(2);
    expect(countLanguageChanges(saved, draft, EN)).toBe(0);
    expect(listCopyChanges(saved, draft, EMAIL_DRAFT_LIVE_LOCALES)).toEqual([
      { templateType: MAGIC_LINK, locale: FR },
    ]);
  });

  it('counts sender fields and staged logos', () => {
    const draft = withLogo(
      { ...saved, sender: { ...saved.sender, senderName: 'Acme' } },
      EMAIL_SENDER_ITEM,
      { url: 'blob:logo', file: new File(['x'], 'logo.png') },
    );

    expect(countEmailDraftChanges(saved, draft, EMAIL_DRAFT_LIVE_LOCALES)).toBe(
      2,
    );
  });

  it('adds up shared and per-language changes to the total', () => {
    const draft = withCopy(
      { ...saved, sender: { ...saved.sender, senderName: 'Acme' } },
      { templateType: TENANT_INVITE, locale: FR },
      { subject: 'Invitation', body: null },
    );

    expect(countSharedChanges(saved, draft)).toBe(1);
    expect(
      countSharedChanges(saved, draft) +
        countLanguageChanges(saved, draft, EN) +
        countLanguageChanges(saved, draft, FR),
    ).toBe(countEmailDraftChanges(saved, draft, EMAIL_DRAFT_LIVE_LOCALES));
  });
});

describe('resolveItemStatus', () => {
  let saved: TEmailDraft;

  beforeEach(() => {
    saved = buildTestEmailDraft();
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
