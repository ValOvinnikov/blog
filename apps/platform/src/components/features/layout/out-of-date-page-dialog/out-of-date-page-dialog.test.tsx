import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { useIsPageOutOfDate } from '@platform/utils/page-out-of-date/page-out-of-date';
import { reloadPage } from '@platform/utils/reload-page/reload-page';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { OutOfDatePageDialog } from './out-of-date-page-dialog';

vi.mock('@platform/utils/page-out-of-date/page-out-of-date');
vi.mock('@platform/utils/reload-page/reload-page');

const t = makeEnTranslator('outOfDatePageDialog');

const setup = customRender(OutOfDatePageDialog, {});

describe(`<${OutOfDatePageDialog.name}/>`, () => {
  it('stays closed while the page is current', () => {
    setup();

    const dialog = screen.queryByRole('alertdialog');

    expect(dialog).not.toBeInTheDocument();
  });

  describe('once the page is out of date', () => {
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
      vi.mocked(useIsPageOutOfDate).mockReturnValue(true);
      setup();
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
