import { customRender, screen } from '@web/testing/custom-render';
import { ctaActionsDemo } from '@web/testing/modules/cta/fixtures';
import { makeFeatureHighlightItem } from '@web/testing/modules/feature-highlights/fixtures';

import { FeatureHighlightRow } from './feature-highlight-row';

vi.mock('@web/i18n/navigation');

const item = makeFeatureHighlightItem();

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
      expect(
        screen.getByRole('heading', { level: 3, name: item.heading }),
      ).toBeVisible();
    });

    it('renders the row image', () => {
      expect(screen.getByRole('img')).toBeVisible();
    });

    it('renders no action when the item has none', () => {
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  it('renders the row action when the item has one', () => {
    setup({ item: makeFeatureHighlightItem({ action: ctaActionsDemo[0] }) });

    expect(
      screen.getByRole('link', { name: ctaActionsDemo[0]!.link.label }),
    ).toBeVisible();
  });
});
