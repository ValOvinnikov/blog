import { LOOK_ROW_TITLE_KEY } from '@platform/components/features/look/look-form/look-row-title-key';
import { LOOK_FOLLOW_TEST_ID } from '@platform/constants/look-follow';
import { LOOK_ROW } from '@platform/constants/look-row';
import { LOOK_SAMPLE_TOKENS_TEST_ID } from '@platform/constants/look-sample';
import { SAMPLE_PART_ATTRIBUTE } from '@platform/constants/sample-part';
import messages from '@platform/i18n/messages/en.json';
import { screen, waitFor, within } from '@platform/testing/custom-render';
import {
  CARD_RADIUS_TOKEN,
  FOOTER_TARGET,
  mockOpenRowTarget,
  stubMeasuredDesktopSample,
} from '@platform/testing/look/look-follow';
import {
  lookPreview,
  renderPreview,
} from '@platform/testing/look/look-preview-render';
import { stubLgUpWindow } from '@platform/testing/match-media';
import {
  COOKIE_SETTINGS_BUTTON,
  RADIUS_DECLARATIONS,
  RADIUS_SCALE,
  SKIN_REGISTRY,
} from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { keys } from 'remeda';

import { LookPreview } from './look-preview';

const LOOK_FOLLOW = messages.lookFollow;
const BAND_COUNT = keys(SKIN_REGISTRY).length;
const CARDS_PER_BAND = 1;
const BUTTONS_PER_BAND = 2;
const XL_CARD_RADIUS = RADIUS_DECLARATIONS[RADIUS_SCALE.XL][CARD_RADIUS_TOKEN];

const stubPartCornersFromTokens = () => {
  const computedStyle = window.getComputedStyle.bind(window);
  vi.spyOn(window, 'getComputedStyle').mockImplementation(
    (element, pseudoElement) => {
      const tokens = screen
        .queryAllByTestId(LOOK_SAMPLE_TOKENS_TEST_ID)
        .find((root) => root.contains(element));
      if (!tokens || !element.hasAttribute(SAMPLE_PART_ATTRIBUTE)) {
        return computedStyle(element, pseudoElement);
      }
      const radius = tokens.style.getPropertyValue(CARD_RADIUS_TOKEN);
      return {
        borderRadius: radius,
        borderTopLeftRadius: radius,
        borderBottomRightRadius: radius,
      } as CSSStyleDeclaration;
    },
  );
};

describe(`<${LookPreview.name}/> follow`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const followButton = () =>
    screen.getByRole('button', { name: LOOK_FOLLOW.followToggle });
  const toolbar = () => screen.getByRole('toolbar');

  it('presses Follow beside the readout, outside the toolbar, on the phone tab', () => {
    renderPreview();

    expect(followButton()).toBePressed();
    expect(toolbar()).not.toContainElement(followButton());
  });

  it('puts Follow inside the toolbar from lg', () => {
    stubLgUpWindow();
    renderPreview();

    const toolbarFollow = within(toolbar()).getByRole('button', {
      name: LOOK_FOLLOW.followToggle,
    });

    expect(toolbarFollow).toBePressed();
  });

  describe('with the sample measured', () => {
    let restoreMeasuredSample: () => void;
    const outlines = () => screen.queryAllByTestId(LOOK_FOLLOW_TEST_ID.OUTLINE);

    beforeEach(() => {
      restoreMeasuredSample = stubMeasuredDesktopSample();
    });

    afterEach(() => {
      restoreMeasuredSample();
    });

    describe('with the footer followed', () => {
      beforeEach(() => {
        renderPreview({ followTarget: FOOTER_TARGET });
      });

      it('outlines the followed part with its name', () => {
        const [outline] = outlines();

        expect(outline).toHaveTextContent(messages.lookForm.footerHeading);
      });

      it('drops the outline and says so once Follow is turned off', async () => {
        await user.click(followButton());

        const offNote = screen.getByText(LOOK_FOLLOW.off);

        expect(followButton()).not.toBePressed();
        expect(outlines()).toHaveLength(0);
        expect(offNote).toBeVisible();
      });
    });

    it.each([
      {
        row: LOOK_ROW.SHAPE,
        partCount: 13 + BAND_COUNT * (CARDS_PER_BAND + BUTTONS_PER_BAND),
      },
      { row: LOOK_ROW.DETAILS, partCount: 2 },
      { row: LOOK_ROW.BRAND, partCount: 2 },
    ])(
      'outlines all $partCount sample parts $row changes under one tag',
      ({ row, partCount }) => {
        renderPreview({ followTarget: mockOpenRowTarget(row) });

        const tags = screen.getAllByTestId(LOOK_FOLLOW_TEST_ID.TAG);
        const cardName = messages.lookForm[LOOK_ROW_TITLE_KEY[row]];

        expect(outlines()).toHaveLength(partCount);
        expect(tags).toHaveLength(1);
        expect(outlines()[0]).toHaveTextContent(cardName);
      },
    );

    it('outlines the floating cookie settings button for Small details, untagged', () => {
      renderPreview({
        values: { cookieSettingsButton: COOKIE_SETTINGS_BUTTON.SHOWN },
        followTarget: mockOpenRowTarget(LOOK_ROW.DETAILS),
      });

      const tags = screen.getAllByTestId(LOOK_FOLLOW_TEST_ID.TAG);

      expect(outlines()).toHaveLength(3);
      expect(tags).toHaveLength(1);
    });

    it('re-rounds the outlines when the corners change', async () => {
      stubPartCornersFromTokens();
      const target = mockOpenRowTarget(LOOK_ROW.SHAPE);
      const { rerender } = renderPreview({
        values: { radiusScale: RADIUS_SCALE.MD },
        followTarget: target,
      });

      rerender(
        lookPreview({
          values: { radiusScale: RADIUS_SCALE.XL },
          followTarget: target,
        }),
      );

      await waitFor(() => {
        expect(outlines()[0]).toHaveStyle({ borderRadius: XL_CARD_RADIUS });
      });
    });
  });
});
