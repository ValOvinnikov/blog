import {
  customRender,
  renderElement,
  screen,
} from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { ConsentPlaceholder } from './consent-placeholder';

faker.seed(123);

const providerName = faker.company.name();
const message = faker.lorem.sentence();
const allowLabel = faker.word.verb();
const settingsLabel = faker.word.noun();
const scopeNote = faker.lorem.sentence();

const setup = customRender(ConsentPlaceholder, {
  providerName,
  message,
  allowLabel,
  settingsLabel,
  scopeNote,
  onAllow: vi.fn(),
  onOpenSettings: vi.fn(),
});

describe(`<${ConsentPlaceholder.name}/>`, () => {
  describe('with the default props', () => {
    let onAllow: Mock<() => void>;
    let onOpenSettings: Mock<() => void>;

    beforeEach(() => {
      onAllow = vi.fn();
      onOpenSettings = vi.fn();
      setup({ onAllow, onOpenSettings });
    });

    it('renders the provider name and message', () => {
      expect(screen.getByText(providerName)).toBeVisible();
      expect(screen.getByText(message)).toBeVisible();
    });

    it('renders the Allow and Cookie settings controls', () => {
      expect(screen.getByRole('button', { name: allowLabel })).toBeVisible();
      expect(screen.getByRole('button', { name: settingsLabel })).toBeVisible();
    });

    it('renders the scope note', () => {
      expect(screen.getByText(scopeNote)).toBeVisible();
    });

    it('associates the scope note as the accessible description of both controls', () => {
      expect(
        screen.getByRole('button', {
          name: allowLabel,
          description: scopeNote,
        }),
      ).toBeVisible();
      expect(
        screen.getByRole('button', {
          name: settingsLabel,
          description: scopeNote,
        }),
      ).toBeVisible();
    });

    it('calls onAllow when Allow is clicked', async () => {
      await userEvent.click(screen.getByRole('button', { name: allowLabel }));
      expect(onAllow).toHaveBeenCalledTimes(1);
    });

    it('calls onAllow when Allow is activated by keyboard', async () => {
      screen.getByRole('button', { name: allowLabel }).focus();
      await userEvent.keyboard('{Enter}');
      expect(onAllow).toHaveBeenCalledTimes(1);
    });

    it('calls onOpenSettings when Cookie settings is clicked', async () => {
      await userEvent.click(
        screen.getByRole('button', { name: settingsLabel }),
      );
      expect(onOpenSettings).toHaveBeenCalledTimes(1);
    });

    it('calls onOpenSettings when Cookie settings is activated by keyboard', async () => {
      screen.getByRole('button', { name: settingsLabel }).focus();
      await userEvent.keyboard('{Enter}');
      expect(onOpenSettings).toHaveBeenCalledTimes(1);
    });
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'consent-placeholder' });
    expect(screen.getByTestId('consent-placeholder')).toBeVisible();
  });

  it("describes each placeholder's controls by its own scope note when two render on one page", () => {
    const otherAllowLabel = faker.lorem.words(2);
    const otherSettingsLabel = faker.lorem.words(2);
    const otherScopeNote = faker.lorem.sentence();
    renderElement(
      <>
        <ConsentPlaceholder
          providerName={providerName}
          message={message}
          allowLabel={allowLabel}
          settingsLabel={settingsLabel}
          scopeNote={scopeNote}
          onAllow={vi.fn()}
          onOpenSettings={vi.fn()}
        />
        <ConsentPlaceholder
          providerName={providerName}
          message={message}
          allowLabel={otherAllowLabel}
          settingsLabel={otherSettingsLabel}
          scopeNote={otherScopeNote}
          onAllow={vi.fn()}
          onOpenSettings={vi.fn()}
        />
      </>,
    );

    expect(
      screen.getByRole('button', { name: allowLabel, description: scopeNote }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', {
        name: otherSettingsLabel,
        description: otherScopeNote,
      }),
    ).toBeVisible();
  });
});
