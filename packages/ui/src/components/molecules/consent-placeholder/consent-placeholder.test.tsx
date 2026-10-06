import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';

import { ConsentPlaceholder } from './consent-placeholder';

faker.seed(123);

const id = faker.lorem.slug();
const providerName = faker.company.name();
const message = faker.lorem.sentence();
const allowLabel = faker.word.verb();
const settingsLabel = faker.word.noun();
const scopeNote = faker.lorem.sentence();

const setup = customRender(ConsentPlaceholder, {
  id,
  providerName,
  message,
  allowLabel,
  settingsLabel,
  scopeNote,
  onAllow: vi.fn(),
  onOpenSettings: vi.fn(),
});

describe(`<${ConsentPlaceholder.name}/>`, () => {
  it('renders the provider name and message', () => {
    setup();
    expect(screen.getByText(providerName)).toBeVisible();
    expect(screen.getByText(message)).toBeVisible();
  });

  it('renders the Allow and Cookie settings controls', () => {
    setup();
    expect(screen.getByRole('button', { name: allowLabel })).toBeVisible();
    expect(screen.getByRole('button', { name: settingsLabel })).toBeVisible();
  });

  it('renders the scope note', () => {
    setup();
    expect(screen.getByText(scopeNote)).toBeVisible();
  });

  it('associates the scope note as the accessible description of both controls', () => {
    setup();
    expect(
      screen.getByRole('button', { name: allowLabel, description: scopeNote }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', {
        name: settingsLabel,
        description: scopeNote,
      }),
    ).toBeVisible();
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

  it('calls onOpenSettings when Cookie settings is clicked', async () => {
    const onOpenSettings = vi.fn();
    setup({ onOpenSettings });
    await userEvent.click(screen.getByRole('button', { name: settingsLabel }));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenSettings when Cookie settings is activated by keyboard', async () => {
    const onOpenSettings = vi.fn();
    setup({ onOpenSettings });
    screen.getByRole('button', { name: settingsLabel }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'consent-placeholder' });
    expect(screen.getByTestId('consent-placeholder')).toBeVisible();
  });
});
