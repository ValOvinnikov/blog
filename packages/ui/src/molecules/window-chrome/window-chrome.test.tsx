import { renderElement, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { WindowChrome } from './window-chrome';

faker.seed(123);

describe(`<${WindowChrome.name}/>`, () => {
  it('renders the bar and body content', () => {
    const command = faker.hacker.phrase();
    const body = faker.lorem.sentence();
    renderElement(
      <WindowChrome>
        <WindowChrome.Bar>{command}</WindowChrome.Bar>
        <WindowChrome.Body>{body}</WindowChrome.Body>
      </WindowChrome>,
    );

    expect(screen.getByText(command)).toBeVisible();
    expect(screen.getByText(body)).toBeVisible();
  });

  it('renders a User and a Prompt segment inside the bar', () => {
    const user = faker.internet.username();
    const prompt = `@${faker.internet.domainWord()}:~$`;
    renderElement(
      <WindowChrome>
        <WindowChrome.Bar>
          <WindowChrome.User>{user}</WindowChrome.User>
          <WindowChrome.Prompt>{prompt}</WindowChrome.Prompt>
        </WindowChrome.Bar>
        <WindowChrome.Body>body</WindowChrome.Body>
      </WindowChrome>,
    );

    expect(screen.getByText(user)).toBeVisible();
    expect(screen.getByText(prompt)).toBeVisible();
  });

  it('renders a trailing Tag pill inside the bar', () => {
    const tag = faker.word.noun();
    renderElement(
      <WindowChrome>
        <WindowChrome.Bar>
          <WindowChrome.Tag>{tag}</WindowChrome.Tag>
        </WindowChrome.Bar>
        <WindowChrome.Body>body</WindowChrome.Body>
      </WindowChrome>,
    );

    expect(screen.getByText(tag)).toBeVisible();
  });

  it('forwards data-testid to the root element', () => {
    renderElement(
      <WindowChrome dataTestId="window-chrome">
        <WindowChrome.Bar>bar</WindowChrome.Bar>
        <WindowChrome.Body>body</WindowChrome.Body>
      </WindowChrome>,
    );

    expect(screen.getByTestId('window-chrome')).toBeVisible();
  });

  it('merges extra className on the root element', () => {
    renderElement(
      <WindowChrome className="mt-4" dataTestId="window-chrome">
        <WindowChrome.Bar>bar</WindowChrome.Bar>
        <WindowChrome.Body>body</WindowChrome.Body>
      </WindowChrome>,
    );

    expect(screen.getByTestId('window-chrome').className).toContain('mt-4');
  });
});
