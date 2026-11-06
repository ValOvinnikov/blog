import {
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
const STAGE_TOP = 120;
const STAGE_WIDTH = 1200;
const STAGE_CHROME = 50;
const BELOW_STAGE = 40;
const SETTLED_HEIGHT =
  WINDOW_HEIGHT -
  STAGE_TOP -
  STAGE_CHROME -
  BELOW_STAGE -
  LOOK_LAYOUT_LIMIT.DOCKED_SAVE_BAR_HEIGHT -
  LOOK_LAYOUT_LIMIT.DOCKED_SAVE_BAR_CLEARANCE;
const RESIZE_ROUNDS = 5;
const SCROLLED_BY = 300;

const Harness = ({ device }: { device: TPreviewDevice }) => {
  const { rootRef, stageRef, availableHeight } =
    useFrameAvailableHeight(device);
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

const stubLayout = () => {
  vi.stubGlobal('innerHeight', WINDOW_HEIGHT);
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: Element) {
      if (this === viewport()) {
        return { height: viewportHeight() } as DOMRect;
      }
      const stageTop = STAGE_TOP - window.scrollY;
      const stageBottom = stageTop + stageHeight();
      if (this === stage()) {
        return {
          top: stageTop,
          height: stageHeight(),
          bottom: stageBottom,
        } as DOMRect;
      }
      return { bottom: stageBottom + BELOW_STAGE } as DOMRect;
    },
  );
  stubResizeObserver((target) =>
    target === stage()
      ? { width: STAGE_WIDTH, height: stageHeight() }
      : { width: STAGE_WIDTH, height: stageHeight() + BELOW_STAGE },
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
});
