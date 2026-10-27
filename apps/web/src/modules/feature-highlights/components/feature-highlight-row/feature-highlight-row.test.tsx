import { faker } from '@faker-js/faker';
import { customRender, screen } from '@web/testing/custom-render';
import { MOCK_CTA_PRIMARY_ACTION } from '@web/testing/modules/cta/fixtures';
import { mockFeatureHighlightItem } from '@web/testing/modules/feature-highlights/fixtures';

import { FeatureHighlightRow } from './feature-highlight-row';

vi.mock('@web/i18n/navigation');

faker.seed(6011);

const MOCK_ITEM = mockFeatureHighlightItem();

const setup = customRender(FeatureHighlightRow, {
  item: MOCK_ITEM,
  mediaSide: 'start',
  dataTestId: faker.string.uuid(),
});

describe(`<${FeatureHighlightRow.name}/>`, () => {
  describe('with the default item', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the row heading as an h3', () => {
      const heading = screen.getByRole('heading', {
        level: 3,
        name: MOCK_ITEM.heading,
      });
      expect(heading).toBeVisible();
    });

    it('renders the row image', () => {
      const image = screen.getByRole('img');
      expect(image).toBeVisible();
    });

    it('renders no action when the item has none', () => {
      const link = screen.queryByRole('link');
      expect(link).not.toBeInTheDocument();
    });
  });

  it('renders the row action when the item has one', () => {
    setup({
      item: mockFeatureHighlightItem({ action: MOCK_CTA_PRIMARY_ACTION }),
    });

    const action = screen.getByRole('link', {
      name: MOCK_CTA_PRIMARY_ACTION.link.label,
    });
    expect(action).toBeVisible();
  });
});
