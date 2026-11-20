import { SITE_MESSAGES } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { ToastProvider } from '@web/context/toast-provider';
import { act, renderElement, screen } from '@web/testing/custom-render';
import {
  MOCK_UNRECOGNIZED_ACTION_ERROR,
  mockUnrecognizedActionError,
} from '@web/testing/shared/out-of-date/mock-unrecognized-action';
import { unlessPageOutOfDate } from '@web/utils/page-out-of-date';
import { reloadPage } from '@web/utils/reload-page/reload-page';

import { OutOfDatePageNotice } from './out-of-date-page-notice';

vi.mock('@web/utils/reload-page/reload-page');

const { message, reloadLabel } = SITE_MESSAGES.outOfDateNotice;

const rejectAsOutOfDate = () =>
  act(async () => {
    await unlessPageOutOfDate(Promise.reject(MOCK_UNRECOGNIZED_ACTION_ERROR));
  });

describe(`<${OutOfDatePageNotice.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    mockUnrecognizedActionError();
    renderElement(
      <ToastProvider>
        <OutOfDatePageNotice />
      </ToastProvider>,
    );
  });

  it('shows nothing while the page is current', () => {
    const alert = screen.queryByRole('alert');

    expect(alert).not.toBeInTheDocument();
  });

  describe('once an action is rejected as out of date', () => {
    beforeEach(async () => {
      await rejectAsOutOfDate();
    });

    it('tells the reader the page is out of date', async () => {
      const alert = await screen.findByRole('alert');

      expect(alert).toHaveTextContent(message);
    });

    it('never reloads on its own', () => {
      expect(reloadPage).not.toHaveBeenCalled();
    });

    it('reloads the page from its Reload action', async () => {
      const reloadButton = await screen.findByRole('button', {
        name: reloadLabel,
      });

      await user.click(reloadButton);

      expect(reloadPage).toHaveBeenCalledOnce();
    });

    it('keeps one notice when another action is rejected', async () => {
      await screen.findByRole('alert');

      await rejectAsOutOfDate();

      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(1);
    });
  });
});
