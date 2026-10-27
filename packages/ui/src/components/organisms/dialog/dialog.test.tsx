import { renderElement, screen, waitFor } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { useRef, useState } from 'react';

import { Dialog } from './dialog';

faker.seed(123);

const DIALOG_BACKDROP_TEST_ID = 'dialog-backdrop';
const MOCK_HEADING = faker.lorem.words(3);
const MOCK_CLOSE_LABEL = faker.lorem.word();
const MOCK_BODY = faker.lorem.paragraph();
const MOCK_OPEN_LABEL = faker.lorem.words(2);
const MOCK_FALLBACK_LABEL = faker.lorem.words(2);
const MOCK_ACTION_LABEL = faker.lorem.word();

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
          {MOCK_OPEN_LABEL}
        </button>
      )}
      <button type="button" ref={fallbackFocusRef}>
        {MOCK_FALLBACK_LABEL}
      </button>
      <Dialog
        isOpen={isOpen}
        onOpenChange={(nextIsOpen) => (nextIsOpen ? setIsOpen(true) : close())}
        heading={MOCK_HEADING}
        headingLevel={2}
        closeLabel={hasCloseControl ? MOCK_CLOSE_LABEL : undefined}
        fallbackFocusRef={fallbackFocusRef}
      >
        <p>{MOCK_BODY}</p>
        <button type="button" onClick={close}>
          {MOCK_ACTION_LABEL}
        </button>
      </Dialog>
    </>
  );
};

describe(`<${Dialog.name}/>`, () => {
  let user: UserEvent;

  const openDialog = async () => {
    const openButton = screen.getByRole('button', { name: MOCK_OPEN_LABEL });
    await user.click(openButton);

    const closeButton = await screen.findByRole('button', {
      name: MOCK_CLOSE_LABEL,
    });
    await waitFor(() => expect(closeButton).toHaveFocus());
  };

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders nothing while closed', () => {
    renderElement(<Harness />);

    const dialog = screen.queryByRole('dialog');

    expect(dialog).not.toBeInTheDocument();
  });

  describe('when opened', () => {
    beforeEach(async () => {
      renderElement(<Harness />);
      await openDialog();
    });

    it('is a modal dialog named by its heading', () => {
      const dialog = screen.getByRole('dialog', { name: MOCK_HEADING });
      const headingElement = screen.getByRole('heading', {
        level: 2,
        name: MOCK_HEADING,
      });
      const body = screen.getByText(MOCK_BODY);

      expect(dialog).toBeVisible();
      expect(headingElement).toBeVisible();
      expect(body).toBeVisible();
    });

    it('closes on Escape and returns focus to the opener', async () => {
      await user.keyboard('{Escape}');

      const dialog = screen.queryByRole('dialog');
      const openButton = screen.getByRole('button', { name: MOCK_OPEN_LABEL });

      expect(dialog).not.toBeInTheDocument();
      expect(openButton).toHaveFocus();
    });

    it('closes from the close control', async () => {
      const closeButton = screen.getByRole('button', {
        name: MOCK_CLOSE_LABEL,
      });
      await user.click(closeButton);

      const dialog = screen.queryByRole('dialog');

      expect(dialog).not.toBeInTheDocument();
    });

    it('closes on a backdrop click', async () => {
      const backdrop = screen.getByTestId(DIALOG_BACKDROP_TEST_ID);
      await user.click(backdrop);

      const dialog = screen.queryByRole('dialog');

      expect(dialog).not.toBeInTheDocument();
    });
  });

  it('moves focus to the fallback target when the opener is gone', async () => {
    renderElement(<Harness hidesOpenerOnClose={true} />);
    await openDialog();

    const actionButton = screen.getByRole('button', {
      name: MOCK_ACTION_LABEL,
    });
    await user.click(actionButton);

    const dialog = screen.queryByRole('dialog');
    const fallbackButton = screen.getByRole('button', {
      name: MOCK_FALLBACK_LABEL,
    });

    expect(dialog).not.toBeInTheDocument();
    expect(fallbackButton).toHaveFocus();
  });

  it('offers no close control when no close label is given', async () => {
    renderElement(<Harness hasCloseControl={false} />);
    const openButton = screen.getByRole('button', { name: MOCK_OPEN_LABEL });
    await user.click(openButton);

    const dialog = screen.getByRole('dialog', { name: MOCK_HEADING });
    const closeButton = screen.queryByRole('button', {
      name: MOCK_CLOSE_LABEL,
    });

    expect(dialog).toBeVisible();
    expect(closeButton).not.toBeInTheDocument();
  });
});
