import { faker } from '@faker-js/faker';
import {
  customRender,
  renderWithIntl,
  screen,
} from '@platform/testing/custom-render';

import { GrowthBadge } from '.';

faker.seed(6383);

const MOCK_BADGE_ID = faker.string.alpha(8);
const GROWTH_BADGE_TEXT = 'Growth — included in the Growth plan';

const setup = customRender(GrowthBadge, {});

describe(`<${GrowthBadge.name}/>`, () => {
  it('shows the word Growth', () => {
    setup();

    const label = screen.getByText('Growth', { exact: true });

    expect(label).toBeVisible();
  });

  it('gives the element it describes the label and plan note once', () => {
    renderWithIntl(
      <>
        <button type="button" aria-describedby={MOCK_BADGE_ID} />
        <GrowthBadge id={MOCK_BADGE_ID} />
      </>,
    );

    const button = screen.getByRole('button');

    expect(button).toHaveAccessibleDescription(GROWTH_BADGE_TEXT);
  });
});
