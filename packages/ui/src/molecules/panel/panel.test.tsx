import { renderElement, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { Panel } from './panel';

faker.seed(123);

describe(`<${Panel.name}/>`, () => {
  it('renders the header and body content', () => {
    const heading = faker.lorem.words(3);
    const body = faker.lorem.sentence();
    renderElement(
      <Panel>
        <Panel.Header headingLevel={2}>{heading}</Panel.Header>
        <Panel.Body>{body}</Panel.Body>
      </Panel>,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: heading }),
    ).toBeVisible();
    expect(screen.getByText(body)).toBeVisible();
  });

  it('renders the header at the given heading level', () => {
    const heading = faker.lorem.words(2);
    renderElement(
      <Panel>
        <Panel.Header headingLevel={3}>{heading}</Panel.Header>
        <Panel.Body>body</Panel.Body>
      </Panel>,
    );

    expect(
      screen.getByRole('heading', { level: 3, name: heading }),
    ).toBeVisible();
  });

  it('forwards data-testid to the root element', () => {
    renderElement(
      <Panel dataTestId="panel">
        <Panel.Header headingLevel={2}>heading</Panel.Header>
        <Panel.Body>body</Panel.Body>
      </Panel>,
    );

    expect(screen.getByTestId('panel')).toBeVisible();
  });

  it('merges extra className on the root element', () => {
    renderElement(
      <Panel className="mt-4" dataTestId="panel">
        <Panel.Header headingLevel={2}>heading</Panel.Header>
        <Panel.Body>body</Panel.Body>
      </Panel>,
    );

    expect(screen.getByTestId('panel').className).toContain('mt-4');
  });

  it('renders a body with no header', () => {
    const body = faker.lorem.sentence();
    renderElement(<Panel>{<Panel.Body>{body}</Panel.Body>}</Panel>);

    expect(screen.getByText(body)).toBeVisible();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
