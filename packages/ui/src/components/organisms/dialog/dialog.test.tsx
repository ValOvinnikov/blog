import { renderElement, screen, waitFor } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { useRef, useState } from 'react';

import { Dialog } from './dialog';

faker.seed(123);

const heading = faker.lorem.words(3);
const closeLabel = faker.lorem.word();
const body = faker.lorem.paragraph();
const openLabel = 'Open dialog';
const fallbackLabel = 'Fallback';
const actionLabel = 'Done';

const Harness = ({ hidesOpenerOnClose = false, hasCloseControl = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenerShown, setIsOpenerShown] = useState(true);
  const fallbackFocusRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    if (hidesOpenerOnClose) setIsOpenerShown(false);
    setIsOpen(false);
  };

  return (
    <>
      {isOpenerShown && (
        <button type="button" onClick={() => setIsOpen(true)}>
          {openLabel}
        </button>
      )}
      <button type="button" ref={fallbackFocusRef}>
        {fallbackLabel}
      </button>
      <Dialog
        isOpen={isOpen}
        onOpenChange={(nextIsOpen) => (nextIsOpen ? setIsOpen(true) : close())}
        heading={heading}
        headingLevel={2}
        closeLabel={hasCloseControl ? closeLabel : undefined}
        fallbackFocusRef={fallbackFocusRef}
      >
        <p>{body}</p>
        <button type="button" onClick={close}>
          {actionLabel}
        </button>
      </Dialog>
    </>
  );
};

describe(`<${Dialog.name}/>`, () => {
  let user: UserEvent;

  const openDialog = async () => {
    await user.click(screen.getByRole('button', { name: openLabel }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: closeLabel })).toHaveFocus(),
    );
  };

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders nothing while closed', () => {
    renderElement(<Harness />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  describe('when opened', () => {
    beforeEach(async () => {
      renderElement(<Harness />);
      await openDialog();
    });

    it('is a modal dialog named by its heading', () => {
      const dialog = screen.getByRole('dialog', { name: heading });

      expect(dialog).toBeVisible();
      expect(
        screen.getByRole('heading', { level: 2, name: heading }),
      ).toBeVisible();
      expect(screen.getByText(body)).toBeVisible();
    });

    it('closes on Escape and returns focus to the opener', async () => {
      await user.keyboard('{Escape}');

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: openLabel })).toHaveFocus();
    });

    it('closes from the close control', async () => {
      await user.click(screen.getByRole('button', { name: closeLabel }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes on a backdrop click', async () => {
      await user.click(screen.getByTestId('dialog-backdrop'));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('moves focus to the fallback target when the opener is gone', async () => {
    renderElement(<Harness hidesOpenerOnClose={true} />);
    await openDialog();

    await user.click(screen.getByRole('button', { name: actionLabel }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: fallbackLabel })).toHaveFocus();
  });

  it('offers no close control when no close label is given', async () => {
    renderElement(<Harness hasCloseControl={false} />);
    await user.click(screen.getByRole('button', { name: openLabel }));

    expect(screen.getByRole('dialog', { name: heading })).toBeVisible();
    expect(
      screen.queryByRole('button', { name: closeLabel }),
    ).not.toBeInTheDocument();
  });
});
