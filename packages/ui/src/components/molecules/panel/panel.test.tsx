import { renderElement, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { Panel } from './panel';

faker.seed(123);

const MOCK_HEADING = faker.lorem.words(3);
const MOCK_BODY = faker.lorem.sentence();

describe(`<${Panel.name}/>`, () => {
  it.each([2, 3, 4] as const)(
    'renders the header as a level-%i heading with the body',
    (headingLevel) => {
      renderElement(
        <Panel>
          <Panel.Header headingLevel={headingLevel}>
            {MOCK_HEADING}
          </Panel.Header>
          <Panel.Body>{MOCK_BODY}</Panel.Body>
        </Panel>,
      );

      const heading = screen.getByRole('heading', {
        level: headingLevel,
        name: MOCK_HEADING,
      });
      const body = screen.getByText(MOCK_BODY);

      expect(heading).toBeVisible();
      expect(body).toBeVisible();
    },
  );

  it('renders a body with no header', () => {
    renderElement(
      <Panel>
        <Panel.Body>{MOCK_BODY}</Panel.Body>
      </Panel>,
    );

    const body = screen.getByText(MOCK_BODY);
    const heading = screen.queryByRole('heading');

    expect(body).toBeVisible();
    expect(heading).not.toBeInTheDocument();
  });
});
