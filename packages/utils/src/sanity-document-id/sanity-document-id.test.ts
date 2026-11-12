import { toDraftId, toPublishedId } from './sanity-document-id';

const MOCK_PUBLISHED_ID = 'post-1';
const MOCK_DRAFT_ID = `drafts.${MOCK_PUBLISHED_ID}`;
const ID_FORMS = [
  ['a published id', MOCK_PUBLISHED_ID],
  ['a draft id', MOCK_DRAFT_ID],
] as const;

describe(toDraftId, () => {
  it.each(ID_FORMS)('turns %s into the draft id', (_label, id) => {
    expect(toDraftId(id)).toBe(MOCK_DRAFT_ID);
  });
});

describe(toPublishedId, () => {
  it.each(ID_FORMS)('turns %s into the published id', (_label, id) => {
    expect(toPublishedId(id)).toBe(MOCK_PUBLISHED_ID);
  });
});
