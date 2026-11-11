import { ONBOARDING_SCROLL_AREA_TEST_ID } from '@platform/constants/onboarding';
import { act, screen } from '@platform/testing/custom-render';
import { reachReview } from '@platform/testing/onboarding/address-step';
import {
  completeSiteStep,
  FULL_TIER,
  FULL_TIER_TITLE,
  MOCK_ACCEPTANCE,
  MOCK_ADDRESS_FIELD,
  MOCK_CONTINUE,
  MOCK_CREATE,
  MOCK_LIVE_PREVIEW,
  MOCK_NAME_FIELD,
  RAIL_TIER,
  RAIL_TIER_TITLE,
  renderInTier,
} from '@platform/testing/onboarding/onboarding-view';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { OnboardingView } from './onboarding-view';

vi.mock('@platform/server/onboarding/create-site-action');

vi.mock('@platform/server/auth/sign-out-action');

vi.mock('@platform/server/onboarding/check-site-address-action');

const shellParts = () => ({
  main: screen.getByRole('main'),
  nameField: screen.getByRole('textbox', MOCK_NAME_FIELD),
  preview: screen.getByRole('region', MOCK_LIVE_PREVIEW),
  continueButton: screen.getByRole('button', MOCK_CONTINUE),
});

let user: UserEvent;

describe(`<${OnboardingView.name}/> layout`, () => {
  beforeEach(() => {
    user = userEvent.setup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('places the preview after the footer, outside main, from 1360px', () => {
    renderInTier(FULL_TIER);

    const { main, nameField, preview, continueButton } = shellParts();

    expect(main).toContainElement(continueButton);
    expect(main).not.toContainElement(preview);
    expect(nameField.compareDocumentPosition(continueButton)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(continueButton.compareDocumentPosition(preview)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('places the preview inside main between the fields and the footer from 768px', () => {
    renderInTier(RAIL_TIER);

    const { main, nameField, preview, continueButton } = shellParts();

    expect(main).toContainElement(preview);
    expect(main).toContainElement(continueButton);
    expect(nameField.compareDocumentPosition(preview)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(preview.compareDocumentPosition(continueButton)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('places the preview and then the actions after main on a phone', () => {
    renderInTier([]);

    const { main, nameField, preview, continueButton } = shellParts();

    expect(main).toContainElement(nameField);
    expect(main).not.toContainElement(preview);
    expect(main).not.toContainElement(continueButton);
    expect(main.compareDocumentPosition(preview)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(preview.compareDocumentPosition(continueButton)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  describe.each([
    [FULL_TIER_TITLE, FULL_TIER],
    [RAIL_TIER_TITLE, RAIL_TIER],
  ])('%s', (_tier, matchingQueries) => {
    beforeEach(() => {
      renderInTier(matchingQueries);
    });

    const expectClearOfFooter = (field: HTMLElement, footerButton: object) => {
      const scrollArea = screen.getByTestId(ONBOARDING_SCROLL_AREA_TEST_ID);
      const primaryButton = screen.getByRole('button', footerButton);

      expect(field).toHaveFocus();
      expect(scrollArea).toContainElement(field);
      expect(scrollArea).not.toContainElement(primaryButton);
    };

    it('scrolls Site name inside an area the pinned footer never covers', async () => {
      const nameField = screen.getByRole('textbox', MOCK_NAME_FIELD);
      act(() => nameField.focus());

      expectClearOfFooter(nameField, MOCK_CONTINUE);
    });

    it('scrolls the address input inside an area the pinned footer never covers', async () => {
      await completeSiteStep(user);
      const addressField = screen.getByRole('textbox', MOCK_ADDRESS_FIELD);
      act(() => addressField.focus());

      expectClearOfFooter(addressField, MOCK_CONTINUE);
    });

    it('scrolls the terms box inside an area the pinned footer never covers', async () => {
      await reachReview(user);
      const acceptance = screen.getByRole('checkbox', MOCK_ACCEPTANCE);
      act(() => acceptance.focus());

      expectClearOfFooter(acceptance, MOCK_CREATE);
    });
  });
});
