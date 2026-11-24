import { BRAND_VARIANT } from '@shinefold/config';
import { BREADCRUMB_BAR_TEST_ID } from '@web/constants/breadcrumb-bar';
import { getBarBackgrounds } from '@web/server/site-config/get-bar-backgrounds/get-bar-backgrounds';
import { customRenderServerAsync, screen } from '@web/testing/custom-render';
import { MOCK_BAR_BACKGROUNDS } from '@web/testing/shared/bar-backgrounds/fixtures';

import { BreadcrumbBar } from './breadcrumb-bar';

vi.mock('@web/server/site-config/get-bar-backgrounds/get-bar-backgrounds');

const BREADCRUMBS_SLOT_TEST_ID = 'breadcrumbs-slot';
const SKIN_ATTRIBUTE = 'data-skin';

const getBarBackgroundsMock = vi.mocked(getBarBackgrounds);

const setup = customRenderServerAsync(BreadcrumbBar, {
  children: <div data-testid={BREADCRUMBS_SLOT_TEST_ID} />,
});

describe(`<${BreadcrumbBar.name}/>`, () => {
  it('renders its children', async () => {
    await setup();

    const breadcrumbsSlot = screen.getByTestId(BREADCRUMBS_SLOT_TEST_ID);

    expect(breadcrumbsSlot).toBeVisible();
  });

  it("puts the bar on the tenant's breadcrumb background", async () => {
    getBarBackgroundsMock.mockResolvedValueOnce({
      ...MOCK_BAR_BACKGROUNDS,
      breadcrumb: BRAND_VARIANT.INK,
    });
    await setup();

    const bar = screen.getByTestId(BREADCRUMB_BAR_TEST_ID);

    expect(bar).toHaveAttribute(SKIN_ATTRIBUTE, BRAND_VARIANT.INK);
  });

  it.each([true, false])(
    'keeps the Plain bar off any skin with isAbovePageHeading %s',
    async (isAbovePageHeading) => {
      await setup({ isAbovePageHeading });

      const bar = screen.getByTestId(BREADCRUMB_BAR_TEST_ID);

      expect(bar).not.toHaveAttribute(SKIN_ATTRIBUTE);
    },
  );
});
