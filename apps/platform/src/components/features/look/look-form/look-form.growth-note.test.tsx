import { TENANT_PLAN } from '@blog/db/constants';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_EXPANDED } from '@platform/testing/aria';
import { screen, waitFor, within } from '@platform/testing/custom-render';
import { lookRowTrigger } from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM, growthNote: GROWTH_NOTE } = messages;

const openNote = async (user: UserEvent) => {
  const showButton = screen.getByRole('button', { name: GROWTH_NOTE.show });
  await user.click(showButton);

  return screen.getByRole('list', { name: GROWTH_NOTE.listLabel });
};

describe(`<${LookForm.name}/> Growth note`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('on Free', () => {
    beforeEach(() => {
      setupLookForm({ plan: TENANT_PLAN.FREE });
    });

    it('puts the note above the preset strip, folded', () => {
      const title = screen.getByText(GROWTH_NOTE.title);
      const presets = screen.getByRole('radiogroup', {
        name: LOOK_FORM.presetLabel,
      });
      const button = screen.getByRole('button', { name: GROWTH_NOTE.show });

      expect(
        title.compareDocumentPosition(presets) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(button).toHaveAttribute(ARIA_EXPANDED, 'false');
    });

    it('lists what Growth adds in reading order, then the closing line', async () => {
      const list = await openNote(user);

      const links = within(list).getAllByRole('link');
      const closing = screen.getByText(LOOK_FORM.growthAddsClosing);

      expect(links.map((link) => link.textContent)).toEqual([
        `${LOOK_FORM.colourHeading}${LOOK_FORM.growthAddsColour}`,
        `${LOOK_FORM.typeHeading}${LOOK_FORM.growthAddsType}`,
        `${LOOK_FORM.shapeHeading}${LOOK_FORM.growthAddsShape}`,
        `${LOOK_FORM.buttonsHeading}${LOOK_FORM.growthAddsButtons}`,
        `${LOOK_FORM.headerHeading}${LOOK_FORM.growthAddsHeader}`,
        `${LOOK_FORM.footerHeading}${LOOK_FORM.growthAddsFooter}`,
      ]);
      expect(closing).toBeVisible();
    });

    it('opens a folded row from its link and moves focus to the row button', async () => {
      const list = await openNote(user);

      const footerLink = within(list).getByRole('link', {
        name: new RegExp(`^${LOOK_FORM.footerHeading}`),
      });
      await user.click(footerLink);

      const trigger = lookRowTrigger(LOOK_ROW.FOOTER);
      expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'true');
      await waitFor(() => expect(trigger).toHaveFocus());
    });
  });

  it('shows no note on Growth', () => {
    setupLookForm({ plan: TENANT_PLAN.GROWTH });

    const title = screen.queryByText(GROWTH_NOTE.title);

    expect(title).not.toBeInTheDocument();
  });
});
