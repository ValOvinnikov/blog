import { faker } from '@faker-js/faker';
import { mockPostLatestModuleData } from '@web/testing/modules/post-latest/fixtures';
import { mockPostCard } from '@web/testing/shared/post/fixtures';
import {
  MOCK_SECTION_LOOK,
  MOCK_SECTION_STYLE_OVERRIDES,
} from '@web/testing/shared/section-appearance/fixtures';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getPostCardsViewProps } from './get-post-cards-view-props';

vi.mock(
  '@web/server/site-config/get-section-appearance/get-section-appearance',
);

faker.seed(6011);

const MOCK_POST = mockPostCard({ id: faker.string.uuid() });
const MOCK_IDS = {
  titleId: faker.lorem.slug(),
  dataTestId: faker.lorem.slug(),
};
const MOCK_MODULE_DATA = mockPostLatestModuleData({
  posts: [MOCK_POST],
  ...MOCK_SECTION_STYLE_OVERRIDES,
});

describe(getPostCardsViewProps, () => {
  it("builds the view's section from the module's brand, layout and appearance", async () => {
    const { section } = await getPostCardsViewProps(
      MOCK_REQUEST_CONTEXT.tenantId,
      MOCK_MODULE_DATA,
      MOCK_IDS,
    );

    expect(section).toEqual({
      brandVariant: MOCK_MODULE_DATA.brandVariant,
      layout: MOCK_MODULE_DATA.layout,
      appearance: {
        overrides: MOCK_SECTION_STYLE_OVERRIDES,
        look: MOCK_SECTION_LOOK,
      },
    });
  });

  it('passes the heading, alignment and ids through to the view', async () => {
    const viewProps = await getPostCardsViewProps(
      MOCK_REQUEST_CONTEXT.tenantId,
      MOCK_MODULE_DATA,
      MOCK_IDS,
    );

    expect(viewProps).toEqual(
      expect.objectContaining({
        headingBlock: MOCK_MODULE_DATA.headingBlock,
        contentAlignment: MOCK_MODULE_DATA.contentAlignment,
        ...MOCK_IDS,
      }),
    );
  });

  it('maps each post to a card item', async () => {
    const { items } = await getPostCardsViewProps(
      MOCK_REQUEST_CONTEXT.tenantId,
      MOCK_MODULE_DATA,
      MOCK_IDS,
    );

    expect(items).toEqual([expect.objectContaining({ id: MOCK_POST.id })]);
  });
});
