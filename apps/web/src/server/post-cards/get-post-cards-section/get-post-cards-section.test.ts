import { getSectionAppearance } from '@web/server/site-config/get-section-appearance/get-section-appearance';
import { mockPostCard } from '@web/testing/shared/post/fixtures';
import {
  MOCK_SECTION_LOOK,
  MOCK_SECTION_STYLE_OVERRIDES,
} from '@web/testing/shared/section-appearance/fixtures';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getPostCardsSection } from './get-post-cards-section';

vi.mock(
  '@web/server/site-config/get-section-appearance/get-section-appearance',
);

const MOCK_IMAGE = 'image';
const MOCK_POST = mockPostCard();

const renderImageMock = vi.fn(() => MOCK_IMAGE);

describe(getPostCardsSection, () => {
  it("scopes the section to the module's style overrides", async () => {
    const { appearance } = await getPostCardsSection(
      MOCK_REQUEST_CONTEXT.tenantId,
      {
        posts: [MOCK_POST],
        showImages: false,
        ...MOCK_SECTION_STYLE_OVERRIDES,
      },
    );

    expect(vi.mocked(getSectionAppearance)).toHaveBeenCalledWith(
      MOCK_REQUEST_CONTEXT.tenantId,
      MOCK_SECTION_STYLE_OVERRIDES,
    );
    expect(appearance).toEqual({
      overrides: MOCK_SECTION_STYLE_OVERRIDES,
      look: MOCK_SECTION_LOOK,
    });
  });

  it('maps each post to a card item with the given image', async () => {
    const { items } = await getPostCardsSection(
      MOCK_REQUEST_CONTEXT.tenantId,
      { posts: [MOCK_POST], showImages: true, ...MOCK_SECTION_STYLE_OVERRIDES },
      renderImageMock,
    );

    expect(renderImageMock).toHaveBeenCalledWith(MOCK_POST);
    expect(items).toEqual([
      expect.objectContaining({ id: MOCK_POST.id, image: MOCK_IMAGE }),
    ]);
  });

  it('renders no images when showImages is false', async () => {
    const { items } = await getPostCardsSection(
      MOCK_REQUEST_CONTEXT.tenantId,
      {
        posts: [MOCK_POST],
        showImages: false,
        ...MOCK_SECTION_STYLE_OVERRIDES,
      },
      renderImageMock,
    );

    expect(renderImageMock).not.toHaveBeenCalled();
    expect(items).toEqual([expect.objectContaining({ image: undefined })]);
  });
});
