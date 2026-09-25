import { customRender, screen } from '@web/testing/custom-render';
import { ctaActionsDemo } from '@web/testing/modules/cta/fixtures';
import { makeFeatureHighlightItem } from '@web/testing/modules/feature-highlights/fixtures';
import { SmartLinkMock } from '@web/testing/shared/smart-link/smart-link-mock';

import { FeatureHighlightRow } from './feature-highlight-row';

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: SmartLinkMock,
}));

const item = makeFeatureHighlightItem();

const setup = customRender(FeatureHighlightRow, {
  item,
  mediaSide: 'start',
  dataTestId: 'feature-highlight-row-highlight-1',
});

describe(`<${FeatureHighlightRow.name}/>`, () => {
  it('renders the row heading as an h3', () => {
    setup();

    expect(
      screen.getByRole('heading', { level: 3, name: item.heading }),
    ).toBeVisible();
  });

  it('renders the row image when the item has one', () => {
    setup();

    expect(screen.getByRole('img')).toBeVisible();
  });

  it('renders no image when the item has none', () => {
    setup({ item: makeFeatureHighlightItem({ image: undefined }) });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders the row action when the item has one', () => {
    setup({ item: makeFeatureHighlightItem({ action: ctaActionsDemo[0] }) });

    expect(
      screen.getByRole('link', { name: ctaActionsDemo[0]!.link.label }),
    ).toBeVisible();
  });

  it('renders no action when the item has none', () => {
    setup();

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
