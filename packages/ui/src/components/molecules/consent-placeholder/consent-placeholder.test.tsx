import {
  customRender,
  renderElement,
  screen,
} from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { ConsentPlaceholder } from './consent-placeholder';

faker.seed(123);

const MOCK_PROVIDER_NAME = faker.company.name();
const MOCK_MESSAGE = faker.lorem.sentence();
const MOCK_ALLOW_LABEL = faker.lorem.words(2);
const MOCK_SETTINGS_LABEL = faker.lorem.words(2);
const MOCK_SCOPE_NOTE = faker.lorem.sentence();

const CONTROLS = [
  {
    control: 'Allow',
    label: MOCK_ALLOW_LABEL,
    handler: 'onAllow',
    tabs: 1,
  },
  {
    control: 'Cookie settings',
    label: MOCK_SETTINGS_LABEL,
    handler: 'onOpenSettings',
    tabs: 2,
  },
] as const;

const setup = customRender(ConsentPlaceholder, {
  providerName: MOCK_PROVIDER_NAME,
  message: MOCK_MESSAGE,
  allowLabel: MOCK_ALLOW_LABEL,
  settingsLabel: MOCK_SETTINGS_LABEL,
  scopeNote: MOCK_SCOPE_NOTE,
  onAllow: vi.fn(),
  onOpenSettings: vi.fn(),
});

describe(`<${ConsentPlaceholder.name}/>`, () => {
  describe('with the default props', () => {
    let user: UserEvent;
    let handlers: Record<
      (typeof CONTROLS)[number]['handler'],
      Mock<() => void>
    >;

    beforeEach(() => {
      user = userEvent.setup();
      handlers = { onAllow: vi.fn(), onOpenSettings: vi.fn() };
      setup(handlers);
    });

    it('renders the provider name and message', () => {
      const providerName = screen.getByText(MOCK_PROVIDER_NAME);
      const message = screen.getByText(MOCK_MESSAGE);

      expect(providerName).toBeVisible();
      expect(message).toBeVisible();
    });

    it('renders the scope note', () => {
      const scopeNote = screen.getByText(MOCK_SCOPE_NOTE);

      expect(scopeNote).toBeVisible();
    });

    it.each(CONTROLS)(
      'describes the $control control by the scope note',
      ({ label }) => {
        const button = screen.getByRole('button', {
          name: label,
          description: MOCK_SCOPE_NOTE,
        });

        expect(button).toBeVisible();
      },
    );

    it.each(CONTROLS)(
      'runs the $control action when clicked',
      async ({ label, handler }) => {
        const button = screen.getByRole('button', { name: label });

        await user.click(button);

        expect(handlers[handler]).toHaveBeenCalledTimes(1);
      },
    );

    it.each(CONTROLS)(
      'runs the $control action when activated by keyboard',
      async ({ handler, tabs }) => {
        for (let i = 0; i < tabs; i++) {
          await user.tab();
        }
        await user.keyboard('{Enter}');

        expect(handlers[handler]).toHaveBeenCalledTimes(1);
      },
    );
  });

  it('describes each placeholder by its own scope note when two share a page', () => {
    const otherAllowLabel = faker.lorem.words(2);
    const otherSettingsLabel = faker.lorem.words(2);
    const otherScopeNote = faker.lorem.sentence();
    renderElement(
      <>
        <ConsentPlaceholder
          providerName={MOCK_PROVIDER_NAME}
          message={MOCK_MESSAGE}
          allowLabel={MOCK_ALLOW_LABEL}
          settingsLabel={MOCK_SETTINGS_LABEL}
          scopeNote={MOCK_SCOPE_NOTE}
          onAllow={vi.fn()}
          onOpenSettings={vi.fn()}
        />
        <ConsentPlaceholder
          providerName={MOCK_PROVIDER_NAME}
          message={MOCK_MESSAGE}
          allowLabel={otherAllowLabel}
          settingsLabel={otherSettingsLabel}
          scopeNote={otherScopeNote}
          onAllow={vi.fn()}
          onOpenSettings={vi.fn()}
        />
      </>,
    );

    const firstAllowButton = screen.getByRole('button', {
      name: MOCK_ALLOW_LABEL,
      description: MOCK_SCOPE_NOTE,
    });
    const secondSettingsButton = screen.getByRole('button', {
      name: otherSettingsLabel,
      description: otherScopeNote,
    });

    expect(firstAllowButton).toBeVisible();
    expect(secondSettingsButton).toBeVisible();
  });
});
