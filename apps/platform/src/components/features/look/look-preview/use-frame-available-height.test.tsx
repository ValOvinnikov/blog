import {
  DEVICE_FRAME_LIMIT,
  DEVICE_FRAME_TEST_ID,
  DEVICE_FRAME_VIEWPORT_ATTRIBUTE,
} from '@platform/constants/device-frame';
import { LOOK_LAYOUT_LIMIT } from '@platform/constants/look-layout';
import {
  PREVIEW_DEVICE,
  type TPreviewDevice,
} from '@platform/constants/preview';
import { act, render, screen } from '@platform/testing/custom-render';
import {
  stubChangingMediaQueries,
  stubLgUpWindow,
} from '@platform/testing/match-media';
import {
  resizeObservedElements,
  stubResizeObserver,
} from '@platform/testing/resize-observer';
import {
  fitPageScale,
  scaleDeviceSize,
} from '@platform/utils/device-frame-scale/device-frame-scale';

import { useFrameAvailableHeight } from './use-frame-available-height';

const STAGE_TEST_ID = 'stage';
const AVAILABLE_TEST_ID = 'available-height';
const WINDOW_HEIGHT = 700;
const TALL_WINDOW_HEIGHT = 1400;
const STAGE_TOP = 120;
const STAGE_WIDTH = 1200;
const STAGE_CHROME = 50;
const BELOW_STAGE = 40;
const WRAPPED_STATUS_GROWTH = 18;
const PAGE_BOTTOM_PADDING = 24;
const TALL_PAGE_BOTTOM_PADDING = 120;
const roomUnderStageTop = (windowHeight: number) =>
  windowHeight - STAGE_TOP - STAGE_CHROME - BELOW_STAGE;
const SETTLED_HEIGHT = roomUnderStageTop(WINDOW_HEIGHT);
const DOCKED_SETTLED_HEIGHT =
  SETTLED_HEIGHT -
  LOOK_LAYOUT_LIMIT.DOCKED_SAVE_BAR_HEIGHT -
  LOOK_LAYOUT_LIMIT.DOCKED_SAVE_BAR_CLEARANCE;
const RESIZE_ROUNDS = 5;
const SCROLLED_BY = 300;

const Harness = ({
  device,
  isScrollingWithPage = true,
}: {
  device: TPreviewDevice;
  isScrollingWithPage?: boolean;
}) => {
  const { rootRef, stageRef, availableHeight } = useFrameAvailableHeight(
    device,
    isScrollingWithPage,
  );
  const scale = fitPageScale({
    device,
    availableWidth: STAGE_WIDTH,
    availableHeight,
  });
  const { height } = scaleDeviceSize(device, scale);

  return (
    <div ref={rootRef}>
      <div ref={stageRef} data-testid={STAGE_TEST_ID}>
        <div
          data-testid={DEVICE_FRAME_TEST_ID.VIEWPORT}
          {...{ [DEVICE_FRAME_VIEWPORT_ATTRIBUTE]: '' }}
          style={{ height }}
        />
      </div>
      <output data-testid={AVAILABLE_TEST_ID}>{availableHeight}</output>
    </div>
  );
};

const viewport = () => screen.getByTestId(DEVICE_FRAME_TEST_ID.VIEWPORT);
const stage = () => screen.getByTestId(STAGE_TEST_ID);
const viewportHeight = () => parseFloat(viewport().style.height);

const stageHeight = () => STAGE_CHROME + viewportHeight();

let belowStage = BELOW_STAGE;

const stubLayout = ({
  isStageSticky = false,
  windowHeight = WINDOW_HEIGHT,
} = {}) => {
  belowStage = BELOW_STAGE;
  vi.stubGlobal('innerHeight', windowHeight);
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: Element) {
      if (this === viewport()) {
        return { height: viewportHeight() } as DOMRect;
      }
      const stageTop = isStageSticky ? STAGE_TOP : STAGE_TOP - window.scrollY;
      const stageBottom = stageTop + stageHeight();
      if (this === stage()) {
        return {
          top: stageTop,
          height: stageHeight(),
          bottom: stageBottom,
        } as DOMRect;
      }
      return { bottom: stageBottom + belowStage } as DOMRect;
    },
  );
  stubResizeObserver((target) =>
    target === stage()
      ? { width: STAGE_WIDTH, height: stageHeight() }
      : { width: STAGE_WIDTH, height: stageHeight() + belowStage },
  );
};

describe(useFrameAvailableHeight, () => {
  it.each([PREVIEW_DEVICE.TABLET, PREVIEW_DEVICE.PHONE])(
    'settles on one height after switching from desktop to %s',
    (device) => {
      stubLayout();
      const { rerender } = render(<Harness device={PREVIEW_DEVICE.DESKTOP} />);

      rerender(<Harness device={device} />);

      for (let round = 0; round < RESIZE_ROUNDS; round += 1) {
        resizeObservedElements();
        const availableHeight = screen.getByTestId(AVAILABLE_TEST_ID);
        expect(availableHeight).toHaveTextContent(String(SETTLED_HEIGHT));
      }
    },
  );

  it('measures the same height after the page scrolls', () => {
    stubLayout();
    render(<Harness device={PREVIEW_DEVICE.TABLET} />);

    vi.stubGlobal('scrollY', SCROLLED_BY);
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    const availableHeight = screen.getByTestId(AVAILABLE_TEST_ID);
    expect(availableHeight).toHaveTextContent(String(SETTLED_HEIGHT));
  });

  it('leaves room for the docked save bar under a sticky preview, after the page scrolls', () => {
    stubLayout({ isStageSticky: true });
    render(
      <Harness device={PREVIEW_DEVICE.TABLET} isScrollingWithPage={false} />,
    );

    vi.stubGlobal('scrollY', SCROLLED_BY);
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    const availableHeight = screen.getByTestId(AVAILABLE_TEST_ID);
    expect(availableHeight).toHaveTextContent(String(DOCKED_SETTLED_HEIGHT));
  });

  it("leaves the page's bottom padding under a preview that scrolls with the page", () => {
    stubLayout();
    render(
      <div style={{ paddingBottom: PAGE_BOTTOM_PADDING }}>
        <Harness device={PREVIEW_DEVICE.TABLET} />
      </div>,
    );

    const availableHeight = screen.getByTestId(AVAILABLE_TEST_ID);
    expect(availableHeight).toHaveTextContent(
      String(SETTLED_HEIGHT - PAGE_BOTTOM_PADDING),
    );
  });

  it('leaves the page bottom padding under a sticky preview when it outgrows the save bar room', () => {
    stubLayout({ isStageSticky: true });
    render(
      <div style={{ paddingBottom: TALL_PAGE_BOTTOM_PADDING }}>
        <Harness device={PREVIEW_DEVICE.TABLET} isScrollingWithPage={false} />
      </div>,
    );

    const availableHeight = screen.getByTestId(AVAILABLE_TEST_ID);
    expect(availableHeight).toHaveTextContent(
      String(SETTLED_HEIGHT - TALL_PAGE_BOTTOM_PADDING),
    );
  });

  it('keeps its height when the status line under the stage grows', () => {
    stubLayout();
    render(<Harness device={PREVIEW_DEVICE.TABLET} />);
    resizeObservedElements();

    belowStage = BELOW_STAGE + WRAPPED_STATUS_GROWTH;
    resizeObservedElements();

    const availableHeight = screen.getByTestId(AVAILABLE_TEST_ID);
    expect(availableHeight).toHaveTextContent(String(SETTLED_HEIGHT));
  });

  it('never passes 608 px from lg', () => {
    stubLgUpWindow();
    stubLayout({ windowHeight: TALL_WINDOW_HEIGHT });
    render(<Harness device={PREVIEW_DEVICE.PHONE} />);

    const availableHeight = screen.getByTestId(AVAILABLE_TEST_ID);
    expect(availableHeight).toHaveTextContent(
      String(DEVICE_FRAME_LIMIT.PAGE_HEIGHT),
    );
  });

  it('fills the window below lg', () => {
    stubChangingMediaQueries([]);
    stubLayout({ windowHeight: TALL_WINDOW_HEIGHT });
    render(<Harness device={PREVIEW_DEVICE.PHONE} />);

    const availableHeight = screen.getByTestId(AVAILABLE_TEST_ID);
    expect(availableHeight).toHaveTextContent(
      String(roomUnderStageTop(TALL_WINDOW_HEIGHT)),
    );
  });
});
