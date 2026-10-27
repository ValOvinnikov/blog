import { faker } from '@faker-js/faker';
import { LexoRank } from 'lexorank';

import { rankUnrankedDocuments } from './index';

faker.seed(14000);

type TDoc = Parameters<typeof rankUnrankedDocuments>[0][number];

const MOCK_CREATED_AT = {
  OLDEST: '2026-01-01T00:00:00Z',
  OLDER: '2026-01-02T00:00:00Z',
  OLD: '2026-02-01T00:00:00Z',
  NEW: '2026-03-01T00:00:00Z',
  DRAFT: '2026-01-05T00:00:00Z',
};
const MOCK_EXISTING_RANK = LexoRank.middle().toString();
const MOCK_FIRST_ID = `a-${faker.string.uuid()}`;
const MOCK_SECOND_ID = `b-${faker.string.uuid()}`;
const MOCK_ABOUT_ID = faker.string.uuid();
const MOCK_ABOUT_DRAFT_ID = `drafts.${MOCK_ABOUT_ID}`;
const MOCK_PRICING_ID = faker.string.uuid();
const MOCK_FAQ_ID = faker.string.uuid();

const mockPage = (
  _id: string,
  _createdAt: string,
  orderRank?: string,
): TDoc => ({
  _id,
  _createdAt,
  ...(orderRank ? { orderRank } : {}),
});

const rankOf = (
  mutations: ReturnType<typeof rankUnrankedDocuments>,
  id: string,
): string => {
  const [nodePatch] = mutations.find((mutation) => mutation.id === id)
    ?.patches ?? [undefined];

  if (nodePatch?.op.type !== 'set') {
    throw new Error(`Expected a set patch for ${id}.`);
  }

  return nodePatch.op.value as string;
};

describe(rankUnrankedDocuments, () => {
  it('ranks unranked pages oldest first', () => {
    const ids = [MOCK_ABOUT_ID, MOCK_PRICING_ID, MOCK_FAQ_ID];

    const mutations = rankUnrankedDocuments([
      mockPage(MOCK_FAQ_ID, MOCK_CREATED_AT.NEW),
      mockPage(MOCK_ABOUT_ID, MOCK_CREATED_AT.OLDEST),
      mockPage(MOCK_PRICING_ID, MOCK_CREATED_AT.OLD),
    ]);
    const ranks = ids.map((id) => rankOf(mutations, id));

    expect(ranks).toEqual([...ranks].sort());
    expect(new Set(ranks).size).toBe(ids.length);
  });

  it('breaks a creation-time tie by id so the order is repeatable', () => {
    const mutations = rankUnrankedDocuments([
      mockPage(MOCK_SECOND_ID, MOCK_CREATED_AT.OLDEST),
      mockPage(MOCK_FIRST_ID, MOCK_CREATED_AT.OLDEST),
    ]);

    expect(
      rankOf(mutations, MOCK_FIRST_ID) < rankOf(mutations, MOCK_SECOND_ID),
    ).toBe(true);
  });

  it('gives a draft the same rank as its published page', () => {
    const mutations = rankUnrankedDocuments([
      mockPage(MOCK_ABOUT_ID, MOCK_CREATED_AT.OLDEST),
      mockPage(MOCK_ABOUT_DRAFT_ID, MOCK_CREATED_AT.DRAFT),
      mockPage(MOCK_FAQ_ID, MOCK_CREATED_AT.OLDER),
    ]);

    expect(rankOf(mutations, MOCK_ABOUT_DRAFT_ID)).toBe(
      rankOf(mutations, MOCK_ABOUT_ID),
    );
    expect(
      rankOf(mutations, MOCK_ABOUT_ID) < rankOf(mutations, MOCK_FAQ_ID),
    ).toBe(true);
  });

  it('leaves ranked pages alone and places new ranks after them', () => {
    const mutations = rankUnrankedDocuments([
      mockPage(MOCK_ABOUT_ID, MOCK_CREATED_AT.OLD, MOCK_EXISTING_RANK),
      mockPage(MOCK_FAQ_ID, MOCK_CREATED_AT.OLDEST),
    ]);

    expect(mutations.map((mutation) => mutation.id)).toEqual([MOCK_FAQ_ID]);
    expect(rankOf(mutations, MOCK_FAQ_ID) > MOCK_EXISTING_RANK).toBe(true);
  });

  it('leaves a page alone when any of its versions is already ranked', () => {
    const mutations = rankUnrankedDocuments([
      mockPage(MOCK_ABOUT_ID, MOCK_CREATED_AT.OLDEST),
      mockPage(MOCK_ABOUT_DRAFT_ID, MOCK_CREATED_AT.OLDER, MOCK_EXISTING_RANK),
    ]);

    expect(mutations).toEqual([]);
  });

  it('produces ranks the orderable list can parse', () => {
    const mutations = rankUnrankedDocuments([
      mockPage(MOCK_ABOUT_ID, MOCK_CREATED_AT.OLDEST),
    ]);
    const rank = rankOf(mutations, MOCK_ABOUT_ID);

    expect(LexoRank.parse(rank).toString()).toBe(rank);
  });
});
