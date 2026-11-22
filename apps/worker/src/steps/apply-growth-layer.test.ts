import {
  buildGrowthLayer,
  STARTER_DOCUMENT_IDS,
  type TStarterSiteType,
} from '@shinefold/config';
import {
  LOCALE_ISO_CODES,
  SITE_TYPE,
  STARTER_PLACEHOLDER_IMAGE,
} from '@shinefold/config/constants';
import { SVG_CONTENT_TYPE } from '@worker/constants/media-type';
import { freezeClock, MOCK_NOW } from '@worker/testing/clock/frozen-clock';
import { createMockFaker } from '@worker/testing/mock-faker';
import { MOCK_SANITY_OUTAGE } from '@worker/testing/outage/fixtures';
import {
  MOCK_REVISION,
  mockKeyedReference,
} from '@worker/testing/sample-content/fixtures';
import {
  buildLedgerEntry,
  GROWTH_LAYER_LEDGER_ENTRY_ID,
  MIGRATION_LEDGER_ID,
} from '@worker/utils/migration-ledger/migration-ledger';

import { applyGrowthLayer } from './apply-growth-layer';

const mockFaker = createMockFaker(5715);

const ids = STARTER_DOCUMENT_IDS;
const MOCK_PLACEHOLDER_IMAGES = {
  [STARTER_PLACEHOLDER_IMAGE.LOGO]: `image-${mockFaker.string.hexadecimal({ length: 40 })}-320x120-svg`,
  [STARTER_PLACEHOLDER_IMAGE.ILLUSTRATION]: `image-${mockFaker.string.hexadecimal({ length: 40 })}-1200x800-svg`,
};
const MOCK_FREE_MODULES = [mockKeyedReference(ids.PORTFOLIO_INTRO)];

const upload = vi.fn();
const fetch = vi.fn();
const createIfNotExists = vi.fn();
const patch = vi.fn();
const commit = vi.fn();
const transaction = vi.fn(() => ({ createIfNotExists, patch, commit }));
const MOCK_CLIENT = {
  assets: { upload },
  fetch,
  transaction,
} as unknown as Parameters<ReturnType<typeof applyGrowthLayer>>[0];

const MOCK_PORTFOLIO_LAYER = buildGrowthLayer({
  siteType: SITE_TYPE.PORTFOLIO,
  locale: LOCALE_ISO_CODES.EN,
  placeholderImages: MOCK_PLACEHOLDER_IMAGES,
});
const MOCK_GROWTH_SLOTS =
  MOCK_PORTFOLIO_LAYER?.homeSlots.map(({ slot }) => slot) ?? [];

const MOCK_FRESH_HOME_TEMPLATE = {
  _rev: MOCK_REVISION,
  modules: MOCK_FREE_MODULES,
};
const MOCK_OPEN_LEDGER = { isLayerApplied: false };

function mockLayerState({
  homeTemplate = MOCK_FRESH_HOME_TEMPLATE as unknown,
  ledger = MOCK_OPEN_LEDGER as unknown,
} = {}) {
  fetch.mockResolvedValue({ homeTemplate, ledger });
}

function applyFor(siteType: TStarterSiteType = SITE_TYPE.PORTFOLIO) {
  return applyGrowthLayer({ siteType, locale: LOCALE_ISO_CODES.EN })(
    MOCK_CLIENT,
  );
}

describe(applyGrowthLayer, () => {
  beforeEach(() => {
    freezeClock();
    mockLayerState();
    upload.mockImplementation((_type: string, _body: Buffer, { filename }) =>
      Promise.resolve({
        _id: filename.includes('logo')
          ? MOCK_PLACEHOLDER_IMAGES.LOGO
          : MOCK_PLACEHOLDER_IMAGES.ILLUSTRATION,
      }),
    );
    commit.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('on a fresh Portfolio home template', () => {
    beforeEach(async () => {
      await applyFor();
    });

    it('uploads both placeholder images as SVG', () => {
      expect(upload).toHaveBeenCalledTimes(2);
      for (const [, body, options] of upload.mock.calls) {
        expect(body).toBeInstanceOf(Buffer);
        expect(options).toMatchObject({ contentType: SVG_CONTENT_TYPE });
      }
    });

    it('creates every layer document on the uploaded images', () => {
      expect(
        createIfNotExists.mock.calls.map(([document]) => document),
      ).toEqual(MOCK_PORTFOLIO_LAYER?.documents);
    });

    it('adds the layer’s slots to the home template under its revision', () => {
      expect(patch).toHaveBeenCalledWith(ids.HOME_TEMPLATE, {
        ifRevisionID: MOCK_REVISION,
        set: { modules: [...MOCK_FREE_MODULES, ...MOCK_GROWTH_SLOTS] },
      });
      expect(commit).toHaveBeenCalledOnce();
    });

    it('records the layer in the migration ledger in the same transaction', () => {
      expect(patch).toHaveBeenCalledWith(MIGRATION_LEDGER_ID, {
        setIfMissing: { applied: [] },
        insert: {
          after: 'applied[-1]',
          items: [
            buildLedgerEntry(
              GROWTH_LAYER_LEDGER_ENTRY_ID,
              MOCK_NOW.toISOString(),
            ),
          ],
        },
      });
    });
  });

  it('writes and uploads nothing once the ledger records the layer', async () => {
    mockLayerState({ ledger: { isLayerApplied: true } });

    await applyFor();

    expect(upload).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it('records nothing when the dataset has no migration ledger', async () => {
    mockLayerState({ ledger: null });

    await applyFor();

    expect(patch).not.toHaveBeenCalledWith(
      MIGRATION_LEDGER_ID,
      expect.anything(),
    );
    expect(createIfNotExists).toHaveBeenCalled();
  });

  it('leaves a home template that already holds every slot untouched', async () => {
    mockLayerState({
      homeTemplate: {
        _rev: MOCK_REVISION,
        modules: [...MOCK_FREE_MODULES, ...MOCK_GROWTH_SLOTS],
      },
    });

    await applyFor();

    expect(patch).not.toHaveBeenCalledWith(
      ids.HOME_TEMPLATE,
      expect.anything(),
    );
    expect(commit).toHaveBeenCalledOnce();
  });

  it('still creates the documents when the home template is gone', async () => {
    mockLayerState({ homeTemplate: null });

    await applyFor();

    expect(createIfNotExists).toHaveBeenCalled();
    expect(patch).not.toHaveBeenCalledWith(
      ids.HOME_TEMPLATE,
      expect.anything(),
    );
  });

  it('writes nothing for a site type without a Growth layer', async () => {
    await applyFor(SITE_TYPE.BLOG);

    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects when the commit fails', async () => {
    commit.mockRejectedValue(MOCK_SANITY_OUTAGE);

    await expect(applyFor()).rejects.toBe(MOCK_SANITY_OUTAGE);
  });
});
