import { customRender, screen } from '@web/testing/custom-render';
import { MOCK_CTA_ACTIONS } from '@web/testing/modules/cta/fixtures';
import { mockFeatureHighlightItem } from '@web/testing/modules/feature-highlights/fixtures';

import { FeatureHighlightRow } from './feature-highlight-row';

vi.mock('@web/i18n/navigation');

const item = mockFeatureHighlightItem();

const setup = customRender(FeatureHighlightRow, {
  item,
  mediaSide: 'start',
  dataTestId: 'feature-highlight-row-highlight-1',
});

describe(`<${FeatureHighlightRow.name}/>`, () => {
  describe('with the default item', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the row heading as an h3', () => {
      const heading = screen.getByRole('heading', {
        level: 3,
        name: item.heading,
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
    setup({ item: mockFeatureHighlightItem({ action: MOCK_CTA_ACTIONS[0] }) });

    const action = screen.getByRole('link', {
      name: MOCK_CTA_ACTIONS[0]!.link.label,
    });
    expect(action).toBeVisible();
  });
});
