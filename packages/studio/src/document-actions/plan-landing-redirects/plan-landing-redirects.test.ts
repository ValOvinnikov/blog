import {
  EMPTY_REDIRECT_PLAN,
  planLandingRedirects,
  type TLandingMove,
} from '@blog/studio/document-actions/plan-landing-redirects/plan-landing-redirects';
import { mockUniqueSlugs } from '@blog/studio/testing/mock-unique-slugs';
import { faker } from '@faker-js/faker';

faker.seed(6017);

const MOCK_SLUG = mockUniqueSlugs([
  'FAQ',
  'HELP',
  'MODULES',
  'CATALOG',
  'OLD_FAQ',
  'QUESTIONS',
  'SHOP',
  'SOMEWHERE',
  'PRICING',
]);
const MOCK_FAQ_PATH = `/${MOCK_SLUG.FAQ}`;
const MOCK_HELP_PATH = `/${MOCK_SLUG.HELP}`;
const MOCK_MODULES_PATH = `/${MOCK_SLUG.MODULES}`;
const MOCK_CATALOG_PATH = `/${MOCK_SLUG.CATALOG}`;
const MOCK_OLD_FAQ_PATH = `/${MOCK_SLUG.OLD_FAQ}`;
const MOCK_QUESTIONS_PATH = `/${MOCK_SLUG.QUESTIONS}`;
const MOCK_SHOP_PATH = `/${MOCK_SLUG.SHOP}`;
const MOCK_SOMEWHERE_PATH = `/${MOCK_SLUG.SOMEWHERE}`;
const MOCK_HELP_FAQ_PATH = `${MOCK_HELP_PATH}${MOCK_FAQ_PATH}`;
const MOCK_MODULES_FAQ_PATH = `${MOCK_MODULES_PATH}${MOCK_FAQ_PATH}`;
const MOCK_CATALOG_FAQ_PATH = `${MOCK_CATALOG_PATH}${MOCK_FAQ_PATH}`;
const MOCK_CATALOG_PRICING_PATH = `${MOCK_CATALOG_PATH}/${MOCK_SLUG.PRICING}`;
const MOCK_REDIRECT_ID = faker.string.uuid();
const MOCK_OTHER_REDIRECT_ID = faker.string.uuid();

const mockLandingMove = (
  from: string,
  to: string,
  livePaths: string[] = [],
): TLandingMove => ({
  from,
  to,
  isPrefix: livePaths.length > 0,
  livePaths,
});

describe(planLandingRedirects, () => {
  it('plans nothing when the path is unchanged', () => {
    const plan = planLandingRedirects(
      mockLandingMove(MOCK_FAQ_PATH, MOCK_FAQ_PATH),
      [],
    );

    expect(plan).toEqual(EMPTY_REDIRECT_PLAN);
  });

  it('redirects the old path to the new one', () => {
    const plan = planLandingRedirects(
      mockLandingMove(MOCK_FAQ_PATH, MOCK_HELP_FAQ_PATH),
      [],
    );

    expect(plan).toEqual({
      create: {
        source: MOCK_FAQ_PATH,
        destination: MOCK_HELP_FAQ_PATH,
        isPrefix: false,
      },
      update: [],
      remove: [],
    });
  });

  it('makes one prefix redirect when the page has sub-pages', () => {
    const plan = planLandingRedirects(
      mockLandingMove(MOCK_MODULES_PATH, MOCK_CATALOG_PATH, [
        MOCK_CATALOG_FAQ_PATH,
        MOCK_CATALOG_PRICING_PATH,
      ]),
      [],
    );

    expect(plan.create).toEqual({
      source: MOCK_MODULES_PATH,
      destination: MOCK_CATALOG_PATH,
      isPrefix: true,
    });
  });

  it('points a redirect that led to the old path at the new one', () => {
    const plan = planLandingRedirects(
      mockLandingMove(MOCK_FAQ_PATH, MOCK_HELP_FAQ_PATH),
      [
        {
          _id: MOCK_REDIRECT_ID,
          source: MOCK_QUESTIONS_PATH,
          destination: MOCK_FAQ_PATH,
        },
      ],
    );

    expect(plan.update).toEqual([
      { _id: MOCK_REDIRECT_ID, destination: MOCK_HELP_FAQ_PATH },
    ]);
  });

  it('rebases a redirect into the moved subtree', () => {
    const plan = planLandingRedirects(
      mockLandingMove(MOCK_MODULES_PATH, MOCK_CATALOG_PATH, [
        MOCK_CATALOG_FAQ_PATH,
      ]),
      [
        {
          _id: MOCK_REDIRECT_ID,
          source: MOCK_OLD_FAQ_PATH,
          destination: MOCK_MODULES_FAQ_PATH,
        },
      ],
    );

    expect(plan.update).toEqual([
      { _id: MOCK_REDIRECT_ID, destination: MOCK_CATALOG_FAQ_PATH },
    ]);
  });

  it('leaves a redirect beneath the old path alone without sub-pages', () => {
    const plan = planLandingRedirects(
      mockLandingMove(MOCK_MODULES_PATH, MOCK_CATALOG_PATH),
      [
        {
          _id: MOCK_REDIRECT_ID,
          source: MOCK_OLD_FAQ_PATH,
          destination: MOCK_MODULES_FAQ_PATH,
        },
      ],
    );
    const { update, remove } = plan;

    expect(update).toEqual([]);
    expect(remove).toEqual([]);
  });

  it('removes a redirect that would loop once the page moves back', () => {
    const plan = planLandingRedirects(
      mockLandingMove(MOCK_HELP_FAQ_PATH, MOCK_FAQ_PATH),
      [
        {
          _id: MOCK_REDIRECT_ID,
          source: MOCK_FAQ_PATH,
          destination: MOCK_HELP_FAQ_PATH,
        },
      ],
    );
    const { update, remove } = plan;

    expect(remove).toEqual([MOCK_REDIRECT_ID]);
    expect(update).toEqual([]);
  });

  it('removes a redirect whose source is now a live page', () => {
    const plan = planLandingRedirects(
      mockLandingMove(MOCK_MODULES_PATH, MOCK_CATALOG_PATH, [
        MOCK_CATALOG_FAQ_PATH,
      ]),
      [
        {
          _id: MOCK_REDIRECT_ID,
          source: MOCK_CATALOG_PATH,
          destination: MOCK_SHOP_PATH,
        },
        {
          _id: MOCK_OTHER_REDIRECT_ID,
          source: MOCK_CATALOG_FAQ_PATH,
          destination: MOCK_HELP_PATH,
        },
      ],
    );

    expect(plan.remove).toEqual([MOCK_REDIRECT_ID, MOCK_OTHER_REDIRECT_ID]);
  });

  it('replaces an existing redirect from the old path', () => {
    const plan = planLandingRedirects(
      mockLandingMove(MOCK_FAQ_PATH, MOCK_HELP_FAQ_PATH),
      [
        {
          _id: MOCK_REDIRECT_ID,
          source: MOCK_FAQ_PATH,
          destination: MOCK_SOMEWHERE_PATH,
        },
      ],
    );

    expect(plan).toEqual({
      create: {
        source: MOCK_FAQ_PATH,
        destination: MOCK_HELP_FAQ_PATH,
        isPrefix: false,
      },
      update: [],
      remove: [MOCK_REDIRECT_ID],
    });
  });
});
