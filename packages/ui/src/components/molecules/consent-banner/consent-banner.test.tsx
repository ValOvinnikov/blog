import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';

import { ConsentBanner } from './consent-banner';

faker.seed(123);

const heading = faker.lorem.words(3);
const message = faker.lorem.sentence();
const acceptLabel = faker.word.verb();
const rejectLabel = faker.word.verb();
const settingsLabel = faker.word.noun();

const setup = customRender(ConsentBanner, {
  headingLevel: 2,
  heading,
  message,
  acceptLabel,
  rejectLabel,
  settingsLabel,
  onAccept: vi.fn(),
  onReject: vi.fn(),
  onOpenSettings: vi.fn(),
});

describe(`<${ConsentBanner.name}/>`, () => {
  it('renders the heading at the given level and the message', () => {
    setup();
    expect(
      screen.getByRole('heading', { level: 2, name: heading }),
    ).toBeVisible();
    expect(screen.getByText(message)).toBeVisible();
  });

  it('renders Accept, Reject and Settings controls', () => {
    setup();
    expect(screen.getByRole('button', { name: acceptLabel })).toBeVisible();
    expect(screen.getByRole('button', { name: rejectLabel })).toBeVisible();
    expect(screen.getByRole('button', { name: settingsLabel })).toBeVisible();
  });

  it('calls onAccept when Accept is clicked', async () => {
    const onAccept = vi.fn();
    setup({ onAccept });
    await userEvent.click(screen.getByRole('button', { name: acceptLabel }));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('calls onReject when Reject is clicked', async () => {
    const onReject = vi.fn();
    setup({ onReject });
    await userEvent.click(screen.getByRole('button', { name: rejectLabel }));
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenSettings when Settings is clicked', async () => {
    const onOpenSettings = vi.fn();
    setup({ onOpenSettings });
    await userEvent.click(screen.getByRole('button', { name: settingsLabel }));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('calls onAccept when Accept is activated by keyboard', async () => {
    const onAccept = vi.fn();
    setup({ onAccept });
    screen.getByRole('button', { name: acceptLabel }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('calls onReject when Reject is activated by keyboard', async () => {
    const onReject = vi.fn();
    setup({ onReject });
    screen.getByRole('button', { name: rejectLabel }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenSettings when Settings is activated by keyboard', async () => {
    const onOpenSettings = vi.fn();
    setup({ onOpenSettings });
    screen.getByRole('button', { name: settingsLabel }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'consent-banner' });
    expect(screen.getByTestId('consent-banner')).toBeVisible();
  });
});
