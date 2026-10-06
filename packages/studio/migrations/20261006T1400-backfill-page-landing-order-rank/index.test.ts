import { LexoRank } from 'lexorank';

import { rankUnrankedDocuments } from './index';

type TDoc = Parameters<typeof rankUnrankedDocuments>[0][number];

const page = (_id: string, _createdAt: string, orderRank?: string): TDoc => ({
  _id,
  _createdAt,
  ...(orderRank ? { orderRank } : {}),
});

const rankOf = (
  mutations: ReturnType<typeof rankUnrankedDocuments>,
  id: string,
) => {
  const mutation = mutations.find((m) => m.id === id);
  const [nodePatch] = mutation?.patches ?? [];
  return nodePatch?.op.type === 'set'
    ? (nodePatch.op.value as string)
    : undefined;
};

describe('rankUnrankedDocuments', () => {
  it('ranks unranked pages oldest first', () => {
    const mutations = rankUnrankedDocuments([
      page('faq', '2026-03-01T00:00:00Z'),
      page('about', '2026-01-01T00:00:00Z'),
      page('pricing', '2026-02-01T00:00:00Z'),
    ]);

    const ids = ['about', 'pricing', 'faq'];
    const ranks = ids.map((id) => rankOf(mutations, id)!);

    expect(ranks.every((rank) => typeof rank === 'string')).toBe(true);
    expect([...ranks].sort()).toEqual(ranks);
    expect(new Set(ranks).size).toBe(ids.length);
  });

  it('breaks a creation-time tie by id so the order is repeatable', () => {
    const mutations = rankUnrankedDocuments([
      page('b', '2026-01-01T00:00:00Z'),
      page('a', '2026-01-01T00:00:00Z'),
    ]);

    expect(rankOf(mutations, 'a')! < rankOf(mutations, 'b')!).toBe(true);
  });

  it('gives a draft the same rank as its published page', () => {
    const mutations = rankUnrankedDocuments([
      page('about', '2026-01-01T00:00:00Z'),
      page('drafts.about', '2026-01-05T00:00:00Z'),
      page('faq', '2026-01-02T00:00:00Z'),
    ]);

    expect(rankOf(mutations, 'drafts.about')).toBe(rankOf(mutations, 'about'));
    expect(rankOf(mutations, 'about')! < rankOf(mutations, 'faq')!).toBe(true);
  });

  it('leaves ranked pages alone and places new ranks after them', () => {
    const existing = LexoRank.middle().toString();
    const mutations = rankUnrankedDocuments([
      page('about', '2026-02-01T00:00:00Z', existing),
      page('faq', '2026-01-01T00:00:00Z'),
    ]);

    expect(mutations.map((m) => m.id)).toEqual(['faq']);
    expect(rankOf(mutations, 'faq')! > existing).toBe(true);
  });

  it('leaves a page alone when any of its versions is already ranked', () => {
    const mutations = rankUnrankedDocuments([
      page('about', '2026-01-01T00:00:00Z'),
      page(
        'drafts.about',
        '2026-01-02T00:00:00Z',
        LexoRank.middle().toString(),
      ),
    ]);

    expect(mutations).toEqual([]);
  });

  it('produces ranks the orderable list can parse', () => {
    const mutations = rankUnrankedDocuments([
      page('about', '2026-01-01T00:00:00Z'),
    ]);

    expect(() => LexoRank.parse(rankOf(mutations, 'about')!)).not.toThrow();
  });
});
