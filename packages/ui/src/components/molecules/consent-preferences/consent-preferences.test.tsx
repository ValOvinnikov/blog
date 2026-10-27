import { CONSENT_CATEGORY } from '@blog/config';
import {
  customRender,
  renderElement,
  screen,
} from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

import {
  ConsentPreferences,
  type IConsentCategory,
} from './consent-preferences';

faker.seed(123);

const VALUE_FALSE_TITLE = 'its value is false';
const VALUE_MISSING_TITLE = 'its value is missing';
const MOCK_SAVE_LABEL = faker.lorem.words(2);
const MOCK_CLOSE_LABEL = faker.lorem.words(2);

const MOCK_NECESSARY_CATEGORY: IConsentCategory = {
  id: CONSENT_CATEGORY.NECESSARY,
  label: faker.lorem.words(2),
  description: faker.lorem.sentence(),
  isLocked: true,
};
const MOCK_MEDIA_CATEGORY: IConsentCategory = {
  id: CONSENT_CATEGORY.EXTERNAL_MEDIA,
  label: faker.lorem.words(2),
  description: faker.lorem.sentence(),
};
const MOCK_CATEGORIES = [MOCK_NECESSARY_CATEGORY, MOCK_MEDIA_CATEGORY];

const MOCK_VALUES: Record<string, boolean> = {
  [CONSENT_CATEGORY.NECESSARY]: true,
  [CONSENT_CATEGORY.EXTERNAL_MEDIA]: false,
};

const setup = customRender(ConsentPreferences, {
  categories: MOCK_CATEGORIES,
  values: MOCK_VALUES,
  onCategoryChange: vi.fn(),
  saveLabel: MOCK_SAVE_LABEL,
  onSave: vi.fn(),
});

describe(`<${ConsentPreferences.name}/>`, () => {
  describe('rendering', () => {
    beforeEach(() => {
      setup();
    });

    it.each(MOCK_CATEGORIES)(
      'renders a switch and description for the $id category',
      ({ label, description }) => {
        const categorySwitch = screen.getByRole('switch', {
          name: label,
          description,
        });

        expect(categorySwitch).toBeVisible();
      },
    );

    it('shows an unlocked category enabled', () => {
      const mediaSwitch = screen.getByRole('switch', {
        name: MOCK_MEDIA_CATEGORY.label,
      });

      expect(mediaSwitch).toBeEnabled();
    });
  });

  it('shows an unlocked category checked when its value is true', () => {
    setup({
      values: { ...MOCK_VALUES, [CONSENT_CATEGORY.EXTERNAL_MEDIA]: true },
    });

    const mediaSwitch = screen.getByRole('switch', {
      name: MOCK_MEDIA_CATEGORY.label,
    });

    expect(mediaSwitch).toBeChecked();
  });

  it.each([
    { values: MOCK_VALUES, title: VALUE_FALSE_TITLE },
    {
      values: { [CONSENT_CATEGORY.NECESSARY]: true },
      title: VALUE_MISSING_TITLE,
    },
  ])('shows an unlocked category unchecked when $title', ({ values }) => {
    setup({ values });

    const mediaSwitch = screen.getByRole('switch', {
      name: MOCK_MEDIA_CATEGORY.label,
    });

    expect(mediaSwitch).not.toBeChecked();
  });

  it.each([
    { values: MOCK_VALUES, title: 'its value is true' },
    {
      values: { [CONSENT_CATEGORY.NECESSARY]: false },
      title: VALUE_FALSE_TITLE,
    },
    { values: {}, title: VALUE_MISSING_TITLE },
  ])(
    'shows a locked category checked and disabled when $title',
    ({ values }) => {
      setup({ values });

      const necessarySwitch = screen.getByRole('switch', {
        name: MOCK_NECESSARY_CATEGORY.label,
      });

      expect(necessarySwitch).toBeChecked();
      expect(necessarySwitch).toBeDisabled();
    },
  );

  describe('interactions', () => {
    let user: UserEvent;
    let onCategoryChange: Mock<(id: string, checked: boolean) => void>;
    let onSave: Mock<() => void>;

    beforeEach(() => {
      user = userEvent.setup();
      onCategoryChange = vi.fn();
      onSave = vi.fn();
      setup({ onCategoryChange, onSave });
    });

    it('does not report a change when the locked switch is clicked', async () => {
      const necessarySwitch = screen.getByRole('switch', {
        name: MOCK_NECESSARY_CATEGORY.label,
      });

      await user.click(necessarySwitch);

      expect(onCategoryChange).not.toHaveBeenCalled();
    });

    it('reports the category id and next value when an unlocked switch is clicked', async () => {
      const mediaSwitch = screen.getByRole('switch', {
        name: MOCK_MEDIA_CATEGORY.label,
      });

      await user.click(mediaSwitch);

      expect(onCategoryChange).toHaveBeenCalledTimes(1);
      expect(onCategoryChange).toHaveBeenCalledWith(
        MOCK_MEDIA_CATEGORY.id,
        true,
      );
    });

    it('reports a change when an unlocked switch is toggled by keyboard', async () => {
      await user.tab();
      await user.keyboard(' ');

      expect(onCategoryChange).toHaveBeenCalledWith(
        MOCK_MEDIA_CATEGORY.id,
        true,
      );
    });

    it('calls onSave when Save is clicked', async () => {
      const saveButton = screen.getByRole('button', { name: MOCK_SAVE_LABEL });

      await user.click(saveButton);

      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('calls onSave when Save is activated by keyboard', async () => {
      await user.tab();
      await user.tab();
      await user.keyboard('{Enter}');

      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('with a Close action', () => {
    it('renders no Close action when none is supplied', () => {
      setup();

      const buttons = screen.getAllByRole('button');

      expect(buttons).toHaveLength(1);
    });

    it('calls onClose when Close is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      setup({ closeLabel: MOCK_CLOSE_LABEL, onClose });

      const closeButton = screen.getByRole('button', {
        name: MOCK_CLOSE_LABEL,
      });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('names and describes each switch by its own row when two panels share ids', () => {
    const otherLabel = faker.lorem.words(2);
    const otherDescription = faker.lorem.sentence();
    renderElement(
      <>
        <ConsentPreferences
          categories={[MOCK_MEDIA_CATEGORY]}
          values={MOCK_VALUES}
          onCategoryChange={vi.fn()}
          saveLabel={MOCK_SAVE_LABEL}
          onSave={vi.fn()}
        />
        <ConsentPreferences
          categories={[
            {
              id: MOCK_MEDIA_CATEGORY.id,
              label: otherLabel,
              description: otherDescription,
            },
          ]}
          values={MOCK_VALUES}
          onCategoryChange={vi.fn()}
          saveLabel={MOCK_SAVE_LABEL}
          onSave={vi.fn()}
        />
      </>,
    );

    const firstSwitch = screen.getByRole('switch', {
      name: MOCK_MEDIA_CATEGORY.label,
      description: MOCK_MEDIA_CATEGORY.description,
    });
    const secondSwitch = screen.getByRole('switch', {
      name: otherLabel,
      description: otherDescription,
    });

    expect(firstSwitch).toBeVisible();
    expect(secondSwitch).toBeVisible();
  });
});
