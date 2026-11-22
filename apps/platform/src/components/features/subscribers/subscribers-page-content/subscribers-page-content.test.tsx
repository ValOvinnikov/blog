import { faker } from '@faker-js/faker';
import { SUBSCRIBERS_NOTICE } from '@platform/constants/subscribers';
import messages from '@platform/i18n/messages/en.json';
import { loadSubscribersPage } from '@platform/server/subscribers/load-subscribers-page';
import { MOCK_MOVE_UP_OFFER } from '@platform/testing/billing/move-up';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  mockMembershipContext,
  mockOperatorMembershipContext,
} from '@platform/testing/memberships/fixtures';
import {
  MOCK_SUBSCRIBERS_ALLOWANCE,
  MOCK_SUBSCRIBERS_BAND_CEILING,
  MOCK_SUBSCRIBER_EMAIL,
  MOCK_SUBSCRIBERS_NEXT_BAND,
  mockSubscribersPageData,
} from '@platform/testing/subscribers/fixtures';
import {
  mockReadyTenant,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import {
  formatStripeAmount,
  LOCALE_ISO_CODES,
  TENANT_PLAN,
} from '@shinefold/config';
import { createTranslator } from 'next-intl';

import { SubscribersPageContent } from './subscribers-page-content';

faker.seed(7164);

vi.mock('@platform/server/subscribers/load-subscribers-page', () => ({
  loadSubscribersPage: vi.fn(),
}));
vi.mock('@platform/i18n/navigation');
vi.mock('@platform/server/billing/move-up-band-action');
vi.mock('@platform/server/billing/get-move-up-quote-action');
vi.mock('@platform/server/billing/get-tenant-band-action');
vi.mock('@platform/server/subscribers/export-subscribers-action', () => ({
  exportSubscribersAction: vi.fn(),
}));
vi.mock('@platform/server/subscribers/remove-subscriber-action', () => ({
  removeSubscriberAction: vi.fn(),
}));
vi.mock('@platform/server/subscribers/set-email-new-posts-action', () => ({
  setEmailNewPostsAction: vi.fn(),
}));
vi.mock('@stripe/stripe-js');
vi.mock('@platform/utils/stripe-env/stripe-env');

const t = makeEnTranslator('subscribersPage');
const { markup } = createTranslator({
  locale: LOCALE_ISO_CODES.EN,
  messages,
  namespace: 'subscribersPage',
});
const BOLD_CHUNK = /<b>(.*)<\/b>/;
const tMoveUp = makeEnTranslator('moveUpBand');
const tPagination = makeEnTranslator('pagination');
const NEAR_COUNT = 850;
const OVER_COUNT = 1_040;
const MOCK_POST_TITLE = faker.lorem.words(3);
const MOVE_UP_LABEL = tMoveUp('trigger', {
  ceiling: MOCK_MOVE_UP_OFFER.ceiling,
  interval: MOCK_MOVE_UP_OFFER.interval,
  price: formatStripeAmount(MOCK_MOVE_UP_OFFER.extra, LOCALE_ISO_CODES.EN),
});

const tenant = mockReadyTenant({
  id: MOCK_TENANT_ID,
  plan: TENANT_PLAN.GROWTH,
});
const { viewer: ownerViewer } = mockMembershipContext(tenant);
const { viewer: operatorViewer } = mockOperatorMembershipContext(tenant);

const setup = customRenderAsync(SubscribersPageContent, {
  tenant,
  viewer: ownerViewer,
  page: 1,
  movedUpCeiling: undefined,
});

const loadWith = (...args: Parameters<typeof mockSubscribersPageData>) => {
  const data = mockSubscribersPageData(...args);
  vi.mocked(loadSubscribersPage).mockResolvedValue(data);
  return data;
};

const BAND_NEAR_NOTE = t('notices.bandNear.note');

describe(`<${SubscribersPageContent.name}/>`, () => {
  describe('within its limits', () => {
    let data: ReturnType<typeof mockSubscribersPageData>;

    beforeEach(async () => {
      data = loadWith();
      await setup();
    });

    it('heads the page with the confirmed count and an enabled export', () => {
      const title = screen.getByRole('heading', { level: 1, name: t('title') });
      const lead = screen.getByText(
        t('lead', { count: data.list.rows.length }),
      );
      const exportButton = screen.getByRole('button', { name: t('export') });

      expect(title).toBeVisible();
      expect(lead).toBeVisible();
      expect(exportButton).toBeEnabled();
    });

    it('shows both limits as named meters with their details', () => {
      const bandMeter = screen.getByRole('meter', { name: t('band.meter') });
      const emailsMeter = screen.getByRole('meter', {
        name: t('emails.meter'),
      });
      const bandDetail = screen.getAllByText(
        t('band.detail', { ceiling: MOCK_SUBSCRIBERS_BAND_CEILING }),
      );

      expect(bandMeter).toBeVisible();
      expect(emailsMeter).toBeVisible();
      expect(bandDetail).not.toHaveLength(0);
    });

    it('lists confirmed subscribers with a remove button for each', () => {
      const removeButtons = screen.getAllByRole('button', {
        name: t('remove.trigger', { email: MOCK_SUBSCRIBER_EMAIL }),
      });
      const showing = screen.getByText(
        t('list.showing', { from: 1, to: 2, count: 2 }),
      );
      const next = screen.queryByRole('link', { name: tPagination('next') });

      expect(removeButtons).not.toHaveLength(0);
      expect(showing).toBeVisible();
      expect(next).not.toBeInTheDocument();
    });
  });

  describe('close to its band with a price for the next one', () => {
    beforeEach(() => {
      loadWith({ offer: MOCK_MOVE_UP_OFFER }, { activeCount: NEAR_COUNT });
    });

    it('offers the owner the next band', async () => {
      await setup();

      const notice = screen.getByRole('heading', {
        level: 2,
        name: t('notices.bandNear.title'),
      });
      const moveUp = screen.getByRole('button', { name: MOVE_UP_LABEL });
      const note = screen.getByText(BAND_NEAR_NOTE);

      expect(notice).toBeVisible();
      expect(moveUp).toBeVisible();
      expect(note).toBeVisible();
    });

    it('keeps the note but not the button for an operator', async () => {
      await setup({ viewer: operatorViewer });

      const moveUp = screen.queryByRole('button', { name: MOVE_UP_LABEL });
      const note = screen.getByText(BAND_NEAR_NOTE);

      expect(moveUp).not.toBeInTheDocument();
      expect(note).toBeVisible();
    });
  });

  it('says the site is on the largest band and offers no move', async () => {
    loadWith({ nextBand: undefined }, { activeCount: NEAR_COUNT });
    await setup();

    const note = screen.getByText(t('notices.largestBand'));
    const moveUp = screen.queryByRole('button', { name: MOVE_UP_LABEL });

    expect(note).toBeVisible();
    expect(moveUp).not.toBeInTheDocument();
  });

  it('names the post a band pause skipped', async () => {
    loadWith(
      {
        skippedPost: {
          postId: faker.string.uuid(),
          postTitle: MOCK_POST_TITLE,
          postPublishedAt: faker.date.recent(),
          emailsNeeded: undefined,
          allowanceLeft: undefined,
          skippedAt: faker.date.recent(),
        },
      },
      { activeCount: OVER_COUNT },
    );
    await setup();

    const alert = screen.getByRole('alert');

    expect(alert).toHaveTextContent(MOCK_POST_TITLE);
    expect(alert).toHaveTextContent(t('notices.bandPaused.title'));
  });

  it('drops the post sentence when no post was skipped', async () => {
    loadWith({}, { activeCount: OVER_COUNT });
    await setup();

    const descriptions = screen.getAllByText(
      t('notices.bandPaused.descriptionNoPost', {
        count: OVER_COUNT,
        ceiling: MOCK_SUBSCRIBERS_BAND_CEILING,
      }),
    );

    expect(descriptions).toHaveLength(2);
  });

  it('pages a longer list with links to the neighbouring page', async () => {
    loadWith({ page: 2, totalPages: 3 });
    await setup({ page: 2 });

    const nextLinks = screen.getAllByRole('link', {
      name: tPagination('next'),
    });

    expect(nextLinks[0]).toHaveAttribute(
      'href',
      adminRoutes.dashboardSubscribers(3),
    );
  });

  it('shows the off note while sending is off', async () => {
    loadWith({ emailNewPosts: false });
    await setup();

    const offNote = screen.getByText(t('sending.offNote'));

    expect(offNote).toBeVisible();
  });

  it('confirms a move up once nothing outranks it', async () => {
    loadWith({ notice: SUBSCRIBERS_NOTICE.MOVED_UP });
    await setup();

    const [, leadText] =
      markup('notices.movedUp', {
        ceiling: MOCK_SUBSCRIBERS_BAND_CEILING,
        allowance: MOCK_SUBSCRIBERS_ALLOWANCE,
        lead: (chunks) => `<b>${chunks}</b>`,
      }).match(BOLD_CHUNK) ?? [];
    const lead = screen.getByText(leadText!);

    expect(lead).toBeVisible();
  });

  describe('with no subscribers', () => {
    beforeEach(async () => {
      loadWith(
        { list: { rows: [], total: 0 } },
        { activeCount: 0, sentThisMonth: 0 },
      );
      await setup();
    });

    it('disables export and leads with the empty line', () => {
      const exportButton = screen.getByRole('button', { name: t('export') });
      const lead = screen.getByText(t('leadEmpty'));

      expect(exportButton).toBeDisabled();
      expect(lead).toBeVisible();
    });

    it('points to the Studio page list and shows no list or setting', () => {
      const link = screen.getByRole('link', { name: t('empty.action') });
      const setting = screen.queryByRole('switch');

      expect(link).toHaveAttribute('href', adminRoutes.dashboardStudioPages());
      expect(setting).not.toBeInTheDocument();
    });

    it('leaves both limit cards without notes', () => {
      const bandNote = screen.queryByText(
        t('band.notes.UNDER', {
          left: MOCK_SUBSCRIBERS_BAND_CEILING,
          next: MOCK_SUBSCRIBERS_NEXT_BAND,
        }),
      );

      expect(bandNote).not.toBeInTheDocument();
    });
  });
});
