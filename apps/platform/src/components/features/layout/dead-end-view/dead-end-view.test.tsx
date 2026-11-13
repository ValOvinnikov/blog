import { faker } from '@faker-js/faker';
import { BADGE_TONE } from '@platform/constants/badge-tone';
import messages from '@platform/i18n/messages/en.json';
import { MOCK_SIGN_IN_EMAIL } from '@platform/testing/auth/fixtures';
import { customRender, screen } from '@platform/testing/custom-render';

import { DeadEndView } from './dead-end-view';

vi.mock('@platform/server/auth/sign-out-action');

faker.seed(2404);

const MOCK_BADGE_LABEL = faker.lorem.word();
const MOCK_TITLE = faker.lorem.words(3);
const MOCK_DESCRIPTION = faker.lorem.sentence();
const MOCK_ACTION_LABEL = faker.lorem.words(2);
const MOCK_ERROR_ID = faker.string.alphanumeric(10);

const setup = customRender(DeadEndView, {
  badge: { label: MOCK_BADGE_LABEL, tone: BADGE_TONE.BAD },
  title: MOCK_TITLE,
  description: MOCK_DESCRIPTION,
  action: <button type="button">{MOCK_ACTION_LABEL}</button>,
});

describe(`<${DeadEndView.name}/>`, () => {
  describe('without an error id', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the title as the only page heading', () => {
      const headings = screen.getAllByRole('heading', { level: 1 });

      expect(headings).toHaveLength(1);
      expect(headings[0]).toHaveTextContent(MOCK_TITLE);
    });

    it('shows the status badge, description and action', () => {
      const badge = screen.getByText(MOCK_BADGE_LABEL);
      const description = screen.getByText(MOCK_DESCRIPTION);
      const action = screen.getByRole('button', { name: MOCK_ACTION_LABEL });

      expect(badge).toBeVisible();
      expect(description).toBeVisible();
      expect(action).toBeVisible();
    });

    it('shows no error id line', () => {
      const errorId = screen.queryByText(MOCK_ERROR_ID, { exact: false });

      expect(errorId).not.toBeInTheDocument();
    });

    it('offers no sign out', () => {
      const signOutButton = screen.queryByRole('button', {
        name: messages.account.signOut,
      });

      expect(signOutButton).not.toBeInTheDocument();
    });
  });

  describe('with a signed-in account', () => {
    beforeEach(() => {
      setup({ accountEmail: MOCK_SIGN_IN_EMAIL });
    });

    it('names the signed-in email and offers a sign out', () => {
      const email = screen.getByText(MOCK_SIGN_IN_EMAIL, { exact: false });
      const signOutButton = screen.getByRole('button', {
        name: messages.account.signOut,
      });

      expect(email).toBeVisible();
      expect(signOutButton).toBeVisible();
    });
  });

  describe('with an error id', () => {
    beforeEach(() => {
      setup({ errorId: MOCK_ERROR_ID });
    });

    it('shows the error id', () => {
      const errorId = screen.getByText(MOCK_ERROR_ID, { exact: false });

      expect(errorId).toBeVisible();
    });
  });
});
