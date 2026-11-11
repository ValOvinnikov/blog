import {
  PREVIEW_DEVICE,
  PREVIEW_DEVICE_WIDTH,
  type TPreviewDevice,
} from '@platform/constants/preview';
import { ARIA_PRESSED } from '@platform/testing/aria';
import { screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { reachReview } from '@platform/testing/onboarding/address-step';
import {
  changeSiteTypeFromReview,
  clickBack,
  completeSiteStep,
  FULL_TIER,
  FULL_TIER_TITLE,
  MOCK_LIVE_PREVIEW,
  RAIL_TIER,
  RAIL_TIER_TITLE,
  renderInTier,
  SITE_TYPES,
} from '@platform/testing/onboarding/onboarding-view';
import { stubResizeObserver } from '@platform/testing/resize-observer';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { OnboardingView } from './onboarding-view';

vi.mock('@platform/server/onboarding/create-site-action');

vi.mock('@platform/server/auth/sign-out-action');

vi.mock('@platform/server/onboarding/check-site-address-action');

let user: UserEvent;

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
  beforeEach(() => {
    user = userEvent.setup();
  });

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
