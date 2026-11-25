import { faker } from '@faker-js/faker';
import { customRender, screen } from '@shinefold/ui/testing/custom-render';
import {
  MOCK_HIGHLIGHTED_PHRASE,
  MOCK_ONE_HIGHLIGHT_PIECES,
  MOCK_SECOND_HIGHLIGHTED_PHRASE,
  MOCK_TWO_HIGHLIGHT_PIECES,
  toHeadingWords,
} from '@shinefold/ui/testing/heading-pieces';

import { Heading } from './heading';

faker.seed(123);

const MOCK_TITLE = faker.lorem.words(2);

const setup = customRender(Heading, {
  level: 1,
  children: MOCK_TITLE,
});

describe(`<${Heading.name}/>`, () => {
  it.each([1, 2, 3, 4] as const)('renders a level %s heading', (level) => {
    setup({ level });

    const heading = screen.getByRole('heading', { level, name: MOCK_TITLE });

    expect(heading).toBeVisible();
  });

  it('names the heading with every piece as one phrase', () => {
    setup({ level: 2, pieces: MOCK_TWO_HIGHLIGHT_PIECES });

    const heading = screen.getByRole('heading', {
      level: 2,
      name: toHeadingWords(MOCK_TWO_HIGHLIGHT_PIECES),
    });

    expect(heading).toBeVisible();
  });

  it.each([
    [MOCK_ONE_HIGHLIGHT_PIECES, [MOCK_HIGHLIGHTED_PHRASE]],
    [
      MOCK_TWO_HIGHLIGHT_PIECES,
      [MOCK_HIGHLIGHTED_PHRASE, MOCK_SECOND_HIGHLIGHTED_PHRASE],
    ],
  ])(
    'sets each highlighted phrase apart inside the heading',
    (pieces, phrases) => {
      setup({ pieces });

      const heading = screen.getByRole('heading');

      phrases.forEach((phrase) => {
        const highlight = screen.getByText(phrase);

        expect(heading).toContainElement(highlight);
      });
    },
  );
});
