import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  EDIT_TAB,
  PREVIEW_TAB,
} from '@platform/testing/look/look-form-fixtures';
import { openLookRow } from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import { stubLgUpWindow } from '@platform/testing/match-media';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM, lookPreview: LOOK_PREVIEW } = messages;

const tDevicePreview = makeEnTranslator('devicePreview');

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('the preview device', () => {
    const deviceButton = (
      key: 'deviceDesktop' | 'deviceTablet' | 'devicePhone',
    ) => screen.getByRole('button', { name: tDevicePreview(key) });
    const showOnDesktopButton = () =>
      screen.queryByRole('button', { name: LOOK_FORM.headerShowOnDesktop });

    describe('from lg', () => {
      beforeEach(async () => {
        stubLgUpWindow();
        setupLookForm();
        await openLookRow(user, LOOK_ROW.HEADER);
      });

      it('opens on Desktop with no device note', () => {
        const desktopButton = deviceButton('deviceDesktop');
        const showOnDesktop = showOnDesktopButton();

        expect(desktopButton).toBePressed();
        expect(showOnDesktop).not.toBeInTheDocument();
      });

      it('drops the tab panels, where the view tabs are hidden', () => {
        const tabPanel = screen.queryByRole('tabpanel');

        expect(tabPanel).not.toBeInTheDocument();
      });
    });

    describe('below lg', () => {
      beforeEach(async () => {
        setupLookForm();
        await openLookRow(user, LOOK_ROW.HEADER);
      });

      it('opens on Phone with the phone note under the header layout', () => {
        const note = screen.getByText(LOOK_FORM.headerPreviewDeviceNote.PHONE);
        const phoneButton = deviceButton('devicePhone');
        const showOnDesktop = showOnDesktopButton();

        expect(phoneButton).toBePressed();
        expect(note).toBeVisible();
        expect(showOnDesktop).toBeVisible();
      });

      it('shows the tablet note when the preview is on Tablet', async () => {
        const tabletButton = deviceButton('deviceTablet');
        await user.click(tabletButton);

        const note = screen.getByText(LOOK_FORM.headerPreviewDeviceNote.TABLET);
        expect(note).toBeVisible();
      });

      it('switches the preview to Desktop from the header note', async () => {
        const showOnDesktop = screen.getByRole('button', {
          name: LOOK_FORM.headerShowOnDesktop,
        });
        await user.click(showOnDesktop);

        const note = screen.queryByText(
          LOOK_FORM.headerPreviewDeviceNote.PHONE,
        );
        const desktopButton = deviceButton('deviceDesktop');
        const showOnDesktopAfter = showOnDesktopButton();
        expect(desktopButton).toBePressed();
        expect(note).not.toBeInTheDocument();
        expect(showOnDesktopAfter).not.toBeInTheDocument();
      });

      it('keeps the device and reader state across the Edit and Preview tabs', async () => {
        const tabletButton = deviceButton('deviceTablet');
        const signedInButton = screen.getByRole('button', {
          name: LOOK_PREVIEW.readerSignedIn,
        });
        await user.click(tabletButton);
        await user.click(signedInButton);

        const previewTab = screen.getByRole('tab', { name: PREVIEW_TAB });
        const editTab = screen.getByRole('tab', { name: EDIT_TAB });
        await user.click(previewTab);
        await user.click(editTab);

        expect(tabletButton).toBePressed();
        expect(signedInButton).toBePressed();
      });
    });
  });
});
