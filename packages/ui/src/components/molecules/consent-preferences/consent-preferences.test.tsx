import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';

import {
  ConsentPreferences,
  type IConsentCategory,
} from './consent-preferences';

faker.seed(123);

const heading = faker.lorem.words(3);
const saveLabel = faker.word.verb();

const necessaryLabel = faker.word.noun();
const necessaryDescription = faker.lorem.sentence();
const analyticsLabel = faker.word.noun();
const analyticsDescription = faker.lorem.sentence();

const categories: IConsentCategory[] = [
  {
    id: 'necessary',
    label: necessaryLabel,
    description: necessaryDescription,
    checked: true,
    locked: true,
  },
  {
    id: 'analytics',
    label: analyticsLabel,
    description: analyticsDescription,
    checked: false,
  },
];

const setup = customRender(ConsentPreferences, {
  headingLevel: 2,
  heading,
  categories,
  onCategoryChange: vi.fn(),
  saveLabel,
  onSave: vi.fn(),
});

describe(`<${ConsentPreferences.name}/>`, () => {
  it('renders the heading at the given level', () => {
    setup();
    expect(
      screen.getByRole('heading', { level: 2, name: heading }),
    ).toBeVisible();
  });

  it('renders one switch per category with its label and description', () => {
    setup();
    expect(screen.getByRole('switch', { name: necessaryLabel })).toBeVisible();
    expect(screen.getByText(necessaryDescription)).toBeVisible();
    expect(screen.getByRole('switch', { name: analyticsLabel })).toBeVisible();
    expect(screen.getByText(analyticsDescription)).toBeVisible();
  });

  it('shows the locked category checked and disabled', () => {
    setup();
    const necessarySwitch = screen.getByRole('switch', {
      name: necessaryLabel,
    });
    expect(necessarySwitch).toBeChecked();
    expect(necessarySwitch).toBeDisabled();
  });

  it('does not call onCategoryChange when the locked switch is clicked', async () => {
    const onCategoryChange = vi.fn();
    setup({ onCategoryChange });
    await userEvent.click(screen.getByRole('switch', { name: necessaryLabel }));
    expect(onCategoryChange).not.toHaveBeenCalled();
  });

  it('shows an unlocked category unchecked and enabled', () => {
    setup();
    const analyticsSwitch = screen.getByRole('switch', {
      name: analyticsLabel,
    });
    expect(analyticsSwitch).not.toBeChecked();
    expect(analyticsSwitch).toBeEnabled();
  });

  it('calls onCategoryChange with the category id and next value when an unlocked switch is clicked', async () => {
    const onCategoryChange = vi.fn();
    setup({ onCategoryChange });
    await userEvent.click(screen.getByRole('switch', { name: analyticsLabel }));
    expect(onCategoryChange).toHaveBeenCalledTimes(1);
    expect(onCategoryChange).toHaveBeenCalledWith('analytics', true);
  });

  it('calls onCategoryChange when an unlocked switch is activated by keyboard', async () => {
    const onCategoryChange = vi.fn();
    setup({ onCategoryChange });
    screen.getByRole('switch', { name: analyticsLabel }).focus();
    await userEvent.keyboard(' ');
    expect(onCategoryChange).toHaveBeenCalledWith('analytics', true);
  });

  it('renders a Save action and calls onSave when clicked', async () => {
    const onSave = vi.fn();
    setup({ onSave });
    await userEvent.click(screen.getByRole('button', { name: saveLabel }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('calls onSave when Save is activated by keyboard', async () => {
    const onSave = vi.fn();
    setup({ onSave });
    screen.getByRole('button', { name: saveLabel }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'consent-preferences' });
    expect(screen.getByTestId('consent-preferences')).toBeVisible();
  });
});
