import { act, customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { reloadPage } from '@platform/utils/reload-page/reload-page';
import userEvent, { type UserEvent } from '@testing-library/user-event';

vi.mock('@platform/utils/reload-page/reload-page');

const t = makeEnTranslator('outOfDatePageDialog');

type TPageOutOfDateModule =
  typeof import('@platform/utils/page-out-of-date/page-out-of-date');

describe('<OutOfDatePageDialog/>', () => {
  let markPageOutOfDate: TPageOutOfDateModule['markPageOutOfDate'];

  beforeEach(async () => {
    vi.resetModules();
    ({ markPageOutOfDate } =
      await import('@platform/utils/page-out-of-date/page-out-of-date'));
    const { OutOfDatePageDialog } = await import('./out-of-date-page-dialog');
    customRender(OutOfDatePageDialog, {})();
  });

  it('stays closed while the page is current', () => {
    const dialog = screen.queryByRole('alertdialog');

    expect(dialog).not.toBeInTheDocument();
  });

  describe('once the page is out of date', () => {
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
      act(() => markPageOutOfDate());
    });

    it('tells the person to reload', () => {
      const dialog = screen.getByRole('alertdialog', { name: t('title') });

      expect(dialog).toHaveAccessibleDescription(t('description'));
    });

    it('never reloads on its own', () => {
      expect(reloadPage).not.toHaveBeenCalled();
    });

    it('reloads the page from its one action', async () => {
      const reloadButton = screen.getByRole('button', { name: t('reload') });

      await user.click(reloadButton);

      expect(reloadPage).toHaveBeenCalledOnce();
    });

    it('stays open on Escape', async () => {
      await user.keyboard('{Escape}');

      const dialog = screen.getByRole('alertdialog');

      expect(dialog).toBeVisible();
    });
  });
});
