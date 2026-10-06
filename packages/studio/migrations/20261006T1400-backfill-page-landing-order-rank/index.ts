import { LexoRank } from 'lexorank';
import {
  at,
  defineMigration,
  patch,
  type PatchMutation,
  set,
} from 'sanity/migrate';

const ORDER_RANK_FIELD = 'orderRank';

type TRankableDocument = {
  _id: string;
  _createdAt: string;
  [ORDER_RANK_FIELD]?: unknown;
};

const publishedIdOf = (id: string) =>
  id.replace(/^drafts\./, '').replace(/^versions\.[^.]+\./, '');

const hasRank = (doc: TRankableDocument) =>
  typeof doc[ORDER_RANK_FIELD] === 'string';

const byOldestThenId = (
  [aId, aCreatedAt]: [string, string],
  [bId, bCreatedAt]: [string, string],
) => aCreatedAt.localeCompare(bCreatedAt) || aId.localeCompare(bId);

export const rankUnrankedDocuments = (
  documents: TRankableDocument[],
): PatchMutation[] => {
  const existingRanks = documents
    .filter(hasRank)
    .map((doc) => doc[ORDER_RANK_FIELD] as string)
    .sort();
  const rankedPageIds = new Set(
    documents.filter(hasRank).map((doc) => publishedIdOf(doc._id)),
  );

  const oldestCreatedAt = new Map<string, string>();
  for (const doc of documents) {
    const pageId = publishedIdOf(doc._id);
    if (rankedPageIds.has(pageId)) continue;
    const seen = oldestCreatedAt.get(pageId);
    if (seen === undefined || doc._createdAt < seen) {
      oldestCreatedAt.set(pageId, doc._createdAt);
    }
  }

  let rank = LexoRank.parse(existingRanks.at(-1) ?? LexoRank.min().toString());
  const rankByPageId = new Map<string, string>();
  for (const [pageId] of [...oldestCreatedAt].sort(byOldestThenId)) {
    rank = rank.genNext().genNext();
    rankByPageId.set(pageId, rank.toString());
  }

  return documents.flatMap((doc) => {
    const pageRank = rankByPageId.get(publishedIdOf(doc._id));
    return pageRank === undefined
      ? []
      : [patch(doc._id, at(ORDER_RANK_FIELD, set(pageRank)))];
  });
};

export default defineMigration({
  title: 'Backfill page_landing orderRank, oldest page first',
  documentTypes: ['page_landing'],
  async *migrate(documents) {
    const all: TRankableDocument[] = [];
    for await (const doc of documents()) {
      all.push(doc as TRankableDocument);
    }
    const mutations = rankUnrankedDocuments(all);
    if (mutations.length > 0) {
      yield mutations;
    }
  },
});
