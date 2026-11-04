import {
  ONBOARDING_SCROLL_AREA_TEST_ID,
  ONBOARDING_TIER_QUERY,
} from '@platform/constants/onboarding';
import {
  PREVIEW_DEVICE,
  PREVIEW_DEVICE_WIDTH,
  type TPreviewDevice,
} from '@platform/constants/preview';
import { ARIA_PRESSED } from '@platform/testing/aria';
import { act, screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  changeSiteTypeFromReview,
  clickBack,
  completeSiteStep,
  MOCK_ACCEPTANCE,
  MOCK_ADDRESS_FIELD,
  MOCK_CONTINUE,
  MOCK_CREATE,
  MOCK_LIVE_PREVIEW,
  MOCK_NAME_FIELD,
  reachReview,
  setup,
  SITE_TYPES,
} from '@platform/testing/onboarding/onboarding-view';
import { stubResizeObserver } from '@platform/testing/resize-observer';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { OnboardingView } from './onboarding-view';

vi.mock('@platform/server/onboarding/create-site-action');

vi.mock('@platform/server/auth/sign-out-action');

vi.mock('@platform/server/onboarding/check-site-address-action');

let user: UserEvent;

const stubMatchMedia = window.matchMedia;

const stubTier = (initialQueries: readonly string[]) => {
  let matchingQueries = initialQueries;
  const listeners = new Set<EventListener>();
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    ...stubMatchMedia(query),
    get matches() {
      return matchingQueries.includes(query);
    },
    addEventListener: (_type: string, listener: EventListener) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: EventListener) => {
      listeners.delete(listener);
    },
  }));

  return (nextQueries: readonly string[]) => {
    matchingQueries = nextQueries;
    act(() => listeners.forEach((listener) => listener(new Event('change'))));
  };
};

const FULL_TIER = [ONBOARDING_TIER_QUERY.RAIL, ONBOARDING_TIER_QUERY.FULL];
const RAIL_TIER = [ONBOARDING_TIER_QUERY.RAIL];
const FULL_TIER_TITLE = 'from 1360px';
const RAIL_TIER_TITLE = 'from 768px';

const renderInTier = (matchingQueries: readonly string[]) => {
  user = userEvent.setup();
  const resizeTo = stubTier(matchingQueries);
  setup();
  return resizeTo;
};

const shellParts = () => ({
  main: screen.getByRole('main'),
  nameField: screen.getByRole('textbox', MOCK_NAME_FIELD),
  preview: screen.getByRole('region', MOCK_LIVE_PREVIEW),
  continueButton: screen.getByRole('button', MOCK_CONTINUE),
});

describe(`<${OnboardingView.name}/> layout`, () => {
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

const tDevice = makeEnTranslator('devicePreview');
const tMode = makeEnTranslator('previewModeControl');
const DEVICE_NAME = {
  [PREVIEW_DEVICE.DESKTOP]: tDevice('deviceDesktop'),
  [PREVIEW_DEVICE.TABLET]: tDevice('deviceTablet'),
  [PREVIEW_DEVICE.PHONE]: tDevice('devicePhone'),
};
const MOCK_LIGHT = { name: tMode('modeLight') };
const MOCK_DARK = { name: tMode('modeDark') };
const MOCK_FULL_STAGE = { width: 472, height: 728 };

const previewToolbar = () =>
  within(screen.getByRole('region', MOCK_LIVE_PREVIEW)).getByRole('toolbar', {
    name: tDevice('toolbarAriaLabel'),
  });

const deviceButton = (device: TPreviewDevice) =>
  within(previewToolbar()).getByRole('button', { name: DEVICE_NAME[device] });

const expectPressed = (button: HTMLElement, isPressed: boolean) => {
  expect(button).toHaveAttribute(ARIA_PRESSED, String(isPressed));
};

const sampleFrame = (device: TPreviewDevice) =>
  screen.getByRole('img', {
    name: tDevice('sampleAtWidth', { width: PREVIEW_DEVICE_WIDTH[device] }),
  });

const pressTabletAndDark = async () => {
  await user.click(deviceButton(PREVIEW_DEVICE.TABLET));
  const dark = within(previewToolbar()).getByRole('button', MOCK_DARK);
  await user.click(dark);
};

const expectTabletAndDark = () => {
  const dark = within(previewToolbar()).getByRole('button', MOCK_DARK);

  expectPressed(deviceButton(PREVIEW_DEVICE.TABLET), true);
  expectPressed(dark, true);
};

const readoutOf = (device: TPreviewDevice, percent: number) =>
  tDevice('readoutLong', { width: PREVIEW_DEVICE_WIDTH[device], percent });

describe(`<${OnboardingView.name}/> preview`, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    {
      tier: FULL_TIER_TITLE,
      queries: FULL_TIER,
      device: PREVIEW_DEVICE.DESKTOP,
    },
    {
      tier: RAIL_TIER_TITLE,
      queries: RAIL_TIER,
      device: PREVIEW_DEVICE.DESKTOP,
    },
    { tier: 'on a phone', queries: [], device: PREVIEW_DEVICE.PHONE },
  ])('opens on $device and Light $tier', ({ queries, device }) => {
    renderInTier(queries);

    const light = within(previewToolbar()).getByRole('button', MOCK_LIGHT);
    const frame = sampleFrame(device);

    expectPressed(deviceButton(device), true);
    expectPressed(light, true);
    expect(frame).toBeInTheDocument();
  });

  it.each([
    { from: FULL_TIER_TITLE, queries: FULL_TIER, next: RAIL_TIER },
    { from: RAIL_TIER_TITLE, queries: RAIL_TIER, next: [] },
  ])(
    'keeps the pressed device and colour scheme after the window narrows across a tier edge $from',
    async ({ queries, next }) => {
      const resizeTo = renderInTier(queries);
      await pressTabletAndDark();

      resizeTo(next);

      expectTabletAndDark();
    },
  );

  describe(FULL_TIER_TITLE, () => {
    let restoreResizeObserver: () => void;

    beforeEach(() => {
      restoreResizeObserver = stubResizeObserver(() => MOCK_FULL_STAGE);
      renderInTier(FULL_TIER);
    });

    afterEach(() => {
      restoreResizeObserver();
    });

    it('offers only the device and colour scheme groups', () => {
      const groups = within(previewToolbar()).getAllByRole('group');

      expect(groups.map((group) => group.getAttribute('aria-label'))).toEqual([
        tDevice('deviceGroupAriaLabel'),
        tMode('previewColorSchemeAriaLabel'),
      ]);
    });

    it('announces the long readout under the live preview heading', () => {
      const preview = screen.getByRole('region', MOCK_LIVE_PREVIEW);
      const heading = within(preview).getByRole('heading', {
        level: 2,
        ...MOCK_LIVE_PREVIEW,
      });
      const readout = within(preview).getByText(
        readoutOf(PREVIEW_DEVICE.DESKTOP, 37),
      );

      expect(heading).toBeVisible();
      expect(readout).toHaveRole('status');
    });

    describe('with Tablet pressed', () => {
      beforeEach(async () => {
        await user.click(deviceButton(PREVIEW_DEVICE.TABLET));
      });

      it('names the frame by the width of the device pressed', () => {
        const frame = sampleFrame(PREVIEW_DEVICE.TABLET);

        expect(frame).toBeInTheDocument();
      });

      it('announces the new size when another device is pressed', () => {
        const preview = screen.getByRole('region', MOCK_LIVE_PREVIEW);
        const readout = within(preview).getByText(
          readoutOf(PREVIEW_DEVICE.TABLET, 56),
        );

        expect(readout).toHaveRole('status');
      });
    });

    it('keeps the pressed device and colour scheme after Continue and Back', async () => {
      await pressTabletAndDark();

      await completeSiteStep(user);
      expectTabletAndDark();
      await clickBack(user);

      expectTabletAndDark();
    });

    it('keeps the pressed device and colour scheme after an Edit from review', async () => {
      await reachReview(user);
      await pressTabletAndDark();

      await changeSiteTypeFromReview(user, SITE_TYPES.DOCS);

      expectTabletAndDark();
    });
  });
});
