import { ACTION_OUTCOME } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import en from '@platform/i18n/messages/en.json';
import { saveVoiceOverridesAction } from '@platform/server/site-config/save-voice-overrides-action';
import { ARIA_EXPANDED } from '@platform/testing/aria';
import { screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  SAVE_CHANGES,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { BLOG_INDEX_ROW, UNSAVED_MARK } from '@platform/testing/voice/fixtures';
import {
  DRAFTED_BLOG_LIST_OVERRIDE,
  DRAFTED_BLOG_LIST_TEXT,
  EMPTY_LISTS,
  GERMAN,
  RESET,
  STORED_BLOG_LIST_OVERRIDE,
  editVoiceHeadingAndSave,
  setupBilingualVoiceSettingsWithSectionsOpen,
  setupVoiceSettingsWithSectionsOpen,
  voiceCard,
} from '@platform/testing/voice/voice-settings-setup';
import {
  settingsDraftStorageKey,
  writeSettingsDraft,
} from '@platform/utils/settings-draft-storage/settings-draft-storage';
import { buildVoiceDraft } from '@platform/utils/voice-draft/voice-draft';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { VoiceSettings } from './voice-settings';

faker.seed(6418);

vi.mock('@platform/server/site-config/save-voice-overrides-action');

const saveVoiceOverridesActionMock = vi.mocked(saveVoiceOverridesAction);

const { EN } = LOCALE_ISO_CODES;
const { showPreview: SHOW_PREVIEW } = en.voiceSpecimen;
const MOCK_TYPED_TEXT = faker.lorem.words(2);
const RESTORE_ONE_CHANGE = makeEnTranslator('draftRecovery')('restore', {
  count: 1,
});
const ONE_HOUR_MS = 60 * 60 * 1000;

const showPreviewButton = () =>
  within(voiceCard(EMPTY_LISTS)).getByRole('button', { name: SHOW_PREVIEW });

const openRowOf = (section: HTMLElement) =>
  within(section).getByRole('button', { name: BLOG_INDEX_ROW, expanded: true });

const offerDraftedList = () =>
  writeSettingsDraft(
    settingsDraftStorageKey({ tenantId: MOCK_TENANT_ID, page: 'voice' }),
    {
      values: buildVoiceDraft(DRAFTED_BLOG_LIST_OVERRIDE, [EN]),
      baseline: buildVoiceDraft({}, [EN]),
      takenAt: new Date(Date.now() - ONE_HOUR_MS).toISOString(),
    },
  );

describe(`<${VoiceSettings.name}/> empty lists`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    mockRouterRefresh();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  describe('a customised list', () => {
    beforeEach(async () => {
      await setupVoiceSettingsWithSectionsOpen(user, {
        initialDraft: buildVoiceDraft(STORED_BLOG_LIST_OVERRIDE, [EN]),
      });
    });

    it('keeps a list status on its row, never in its open panel', async () => {
      const section = voiceCard(EMPTY_LISTS);
      const resetButton = within(section).getByRole('button', { name: RESET });
      await user.click(resetButton);

      const openRow = openRowOf(section);
      const panel = within(section).getByRole('region', {
        name: BLOG_INDEX_ROW,
      });
      const unsavedMark = within(section).getByRole('img', {
        name: UNSAVED_MARK,
      });
      const panelPill = within(panel).queryByText(en.fieldStatus.default);

      expect(openRow).toContainElement(unsavedMark);
      expect(openRow).toHaveTextContent(en.fieldStatus.default);
      expect(panelPill).not.toBeInTheDocument();
      expect(resetButton).not.toBeInTheDocument();
    });

    it('keeps the unsaved mark on its row after a save fails with no field errors', async () => {
      saveVoiceOverridesActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });
      const section = voiceCard(EMPTY_LISTS);
      const resetButton = within(section).getByRole('button', { name: RESET });
      await user.click(resetButton);

      const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
      const saveButton = within(saveBar).getByRole('button', {
        name: SAVE_CHANGES,
      });
      await user.click(saveButton);
      await screen.findAllByRole('alert');

      const card = voiceCard(EMPTY_LISTS);
      const openRow = openRowOf(card);
      const unsavedMark = within(card).getByRole('img', { name: UNSAVED_MARK });

      expect(openRow).toContainElement(unsavedMark);
    });
  });

  describe('Show preview', () => {
    it('hides the preview again after a save', async () => {
      saveVoiceOverridesActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
      await setupVoiceSettingsWithSectionsOpen(user);
      const toggle = showPreviewButton();
      await user.click(toggle);

      await editVoiceHeadingAndSave(user, MOCK_TYPED_TEXT);
      await screen.findByText(en.voiceSettings.alertSuccess);

      const remountedToggle = showPreviewButton();

      expect(remountedToggle).toHaveAttribute(ARIA_EXPANDED, 'false');
    });

    it('hides the preview again after a language switch', async () => {
      await setupBilingualVoiceSettingsWithSectionsOpen(user);
      const toggle = showPreviewButton();
      await user.click(toggle);

      const germanRadio = screen.getByRole('radio', { name: GERMAN });
      await user.click(germanRadio);

      const remountedToggle = showPreviewButton();

      expect(remountedToggle).toHaveAttribute(ARIA_EXPANDED, 'false');
    });

    it('still reveals the preview on an archived tenant', async () => {
      await setupVoiceSettingsWithSectionsOpen(user, {
        archivedAt: MOCK_ARCHIVED_AT,
      });
      const toggle = showPreviewButton();
      await user.click(toggle);

      expect(toggle).toHaveAttribute(ARIA_EXPANDED, 'true');
    });
  });

  describe('a recovered draft on offer', () => {
    it.each([
      ['since nothing was saved', {}, undefined, RESTORE_ONE_CHANGE],
      [
        'after a later save',
        STORED_BLOG_LIST_OVERRIDE,
        new Date(),
        en.draftRecovery.restoreAnyway,
      ],
    ])(
      'shows the saved list values and no unsaved mark %s',
      async (_, saved, savedAt, restoreLabel) => {
        offerDraftedList();
        await setupVoiceSettingsWithSectionsOpen(user, {
          initialDraft: buildVoiceDraft(saved, [EN]),
          savedAt,
        });

        const section = voiceCard(EMPTY_LISTS);
        const restoreButton = screen.getByRole('button', {
          name: restoreLabel,
        });
        const unsavedMark = within(section).queryByRole('img', {
          name: UNSAVED_MARK,
        });

        const openRow = openRowOf(section);

        expect(restoreButton).toBeVisible();
        expect(openRow).not.toHaveTextContent(DRAFTED_BLOG_LIST_TEXT);
        expect(unsavedMark).not.toBeInTheDocument();
      },
    );
  });
});
