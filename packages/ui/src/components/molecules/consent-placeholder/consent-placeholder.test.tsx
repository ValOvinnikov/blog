import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';

import { ConsentPlaceholder } from './consent-placeholder';

faker.seed(123);

const providerName = faker.company.name();
const message = faker.lorem.sentence();
const allowLabel = faker.word.verb();

const setup = customRender(ConsentPlaceholder, {
  providerName,
  message,
  allowLabel,
  onAllow: vi.fn(),
});

describe(`<${ConsentPlaceholder.name}/>`, () => {
  it('renders the provider name and message', () => {
    setup();
    expect(screen.getByText(providerName)).toBeVisible();
    expect(screen.getByText(message)).toBeVisible();
  });

  it('renders the Allow control', () => {
    setup();
    expect(screen.getByRole('button', { name: allowLabel })).toBeVisible();
  });

  it('calls onAllow when Allow is clicked', async () => {
    const onAllow = vi.fn();
    setup({ onAllow });
    await userEvent.click(screen.getByRole('button', { name: allowLabel }));
    expect(onAllow).toHaveBeenCalledTimes(1);
  });

  it('calls onAllow when Allow is activated by keyboard', async () => {
    const onAllow = vi.fn();
    setup({ onAllow });
    screen.getByRole('button', { name: allowLabel }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onAllow).toHaveBeenCalledTimes(1);
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'consent-placeholder' });
    expect(screen.getByTestId('consent-placeholder')).toBeVisible();
  });
});
