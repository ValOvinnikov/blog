import { faker } from '@faker-js/faker';
import { renderElement, screen } from '@web/testing/custom-render';

import { getFocusables } from './get-focusables';

faker.seed(8148);

const MOCK_PANEL_TEST_ID = 'focusables-panel';
const MOCK_ACTION = faker.lorem.word();
const MOCK_CLOSED_SUMMARY = faker.lorem.words(2);
const MOCK_HIDDEN_LINK = faker.lorem.words(3);
const MOCK_OPEN_SUMMARY = faker.lorem.words(4);
const MOCK_VISIBLE_LINK = faker.lorem.words(5);
const MOCK_HREF = `/${faker.lorem.slug()}`;

describe(getFocusables, () => {
  let focusables: HTMLElement[];

  beforeEach(() => {
    renderElement(
      <div data-testid={MOCK_PANEL_TEST_ID}>
        <button type="button">{MOCK_ACTION}</button>
        <details>
          <summary>{MOCK_CLOSED_SUMMARY}</summary>
          <a href={MOCK_HREF}>{MOCK_HIDDEN_LINK}</a>
        </details>
        <details open={true}>
          <summary>{MOCK_OPEN_SUMMARY}</summary>
          <a href={MOCK_HREF}>{MOCK_VISIBLE_LINK}</a>
        </details>
      </div>,
    );
    focusables = getFocusables(screen.getByTestId(MOCK_PANEL_TEST_ID));
  });

  it('keeps the controls a reader can reach, closed summaries included', () => {
    expect(focusables).toEqual([
      screen.getByRole('button', { name: MOCK_ACTION }),
      screen.getByText(MOCK_CLOSED_SUMMARY),
      screen.getByText(MOCK_OPEN_SUMMARY),
      screen.getByRole('link', { name: MOCK_VISIBLE_LINK }),
    ]);
  });

  it('skips what a closed disclosure hides', () => {
    expect(focusables).not.toContain(screen.getByText(MOCK_HIDDEN_LINK));
  });

  it('finds nothing without a panel', () => {
    expect(getFocusables(null)).toEqual([]);
  });
});
