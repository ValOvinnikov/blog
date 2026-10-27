import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  mockEmailDraft,
  MOCK_EMAIL_BODY,
  MOCK_EMAIL_DRAFT_LIVE_LOCALES,
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

faker.seed(1);

const { EN, FR } = LOCALE_ISO_CODES;
const { MAGIC_LINK, TENANT_INVITE } = EMAIL_TEMPLATE_TYPE;

const MOCK_SUBJECT = faker.lorem.sentence();
const MOCK_SENDER_NAME = faker.person.fullName();
const MOCK_REPLY_TO_ADDRESS = faker.internet.email();
const MOCK_LOGO_BLOB_URL = faker.internet.url();
const MOCK_LOGO_FILE = new File([faker.lorem.word()], faker.system.fileName());

describe('change tracking', () => {
  let saved: TEmailDraft;

  beforeEach(() => {
    saved = mockEmailDraft();
  });

  it('reports no changes for an untouched draft', () => {
    const total = countEmailDraftChanges(
      saved,
      saved,
      MOCK_EMAIL_DRAFT_LIVE_LOCALES,
    );
    const copyChanges = listCopyChanges(
      saved,
      saved,
      MOCK_EMAIL_DRAFT_LIVE_LOCALES,
    );

    expect(total).toBe(0);
    expect(copyChanges).toEqual([]);
  });

  it('counts subject and body edits per language', () => {
    const draft = withCopy(
      saved,
      { templateType: MAGIC_LINK, locale: FR },
      { subject: MOCK_SUBJECT, body: MOCK_EMAIL_BODY },
    );

    expect(countLanguageChanges(saved, draft, FR)).toBe(2);
    expect(countLanguageChanges(saved, draft, EN)).toBe(0);
  });

  it('lists the template and language of each copy edit', () => {
    const draft = withCopy(
      saved,
      { templateType: MAGIC_LINK, locale: FR },
      { subject: MOCK_SUBJECT, body: MOCK_EMAIL_BODY },
    );

    expect(
      listCopyChanges(saved, draft, MOCK_EMAIL_DRAFT_LIVE_LOCALES),
    ).toEqual([{ templateType: MAGIC_LINK, locale: FR }]);
  });

  it('counts sender fields and staged logos', () => {
    const draft = withLogo(
      {
        ...saved,
        sender: { ...saved.sender, senderName: MOCK_SENDER_NAME },
      },
      EMAIL_SENDER_ITEM,
      { url: MOCK_LOGO_BLOB_URL, file: MOCK_LOGO_FILE },
    );

    expect(
      countEmailDraftChanges(saved, draft, MOCK_EMAIL_DRAFT_LIVE_LOCALES),
    ).toBe(2);
  });

  it('adds up shared and per-language changes to the total', () => {
    const draft = withCopy(
      {
        ...saved,
        sender: { ...saved.sender, senderName: MOCK_SENDER_NAME },
      },
      { templateType: TENANT_INVITE, locale: FR },
      { subject: MOCK_SUBJECT, body: null },
    );

    const parts =
      countSharedChanges(saved, draft) +
      countLanguageChanges(saved, draft, EN) +
      countLanguageChanges(saved, draft, FR);

    expect(parts).toBe(
      countEmailDraftChanges(saved, draft, MOCK_EMAIL_DRAFT_LIVE_LOCALES),
    );
  });
});

describe(resolveItemStatus, () => {
  let saved: TEmailDraft;
  let copyEditedDraft: TEmailDraft;

  beforeEach(() => {
    saved = mockEmailDraft();
    copyEditedDraft = withCopy(
      saved,
      { templateType: TENANT_INVITE, locale: FR },
      { subject: MOCK_SUBJECT, body: null },
    );
  });

  it('marks a template customised in the language it was written in', () => {
    expect(resolveItemStatus(saved, saved, MAGIC_LINK, EN)).toBe('customised');
  });

  it('marks a template default in a language it was not written in', () => {
    expect(resolveItemStatus(saved, saved, MAGIC_LINK, FR)).toBe('default');
  });

  it('marks a template unsaved while it has an edit in the selected language', () => {
    expect(resolveItemStatus(saved, copyEditedDraft, TENANT_INVITE, FR)).toBe(
      'unsaved',
    );
  });

  it('leaves a template default in a language without edits', () => {
    expect(resolveItemStatus(saved, copyEditedDraft, TENANT_INVITE, EN)).toBe(
      'default',
    );
  });

  it('marks the sender item default while nothing is set', () => {
    expect(resolveItemStatus(saved, saved, EMAIL_SENDER_ITEM, EN)).toBe(
      'default',
    );
  });

  it('marks the sender item unsaved after a sender edit', () => {
    const draft = {
      ...saved,
      sender: { ...saved.sender, replyToAddress: MOCK_REPLY_TO_ADDRESS },
    };

    expect(resolveItemStatus(saved, draft, EMAIL_SENDER_ITEM, EN)).toBe(
      'unsaved',
    );
  });
});
