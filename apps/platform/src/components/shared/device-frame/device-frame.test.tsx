import { faker } from '@faker-js/faker';
import {
  DEVICE_FRAME_FIT,
  DEVICE_FRAME_SCROLL_TARGET,
  DEVICE_FRAME_TEST_ID,
} from '@platform/constants/device-frame';
import {
  PREVIEW_DEVICE,
  PREVIEW_DEVICE_WIDTH,
} from '@platform/constants/preview';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { stubResizeObserver } from '@platform/testing/resize-observer';
import { createRef } from 'react';

import { DeviceFrame, type TDeviceFrameHandle } from './index';

faker.seed(6390);

const MOCK_HOST = faker.internet.domainName();
const MOCK_CONTENT = faker.lorem.words(3);
const MOCK_OVERLAY = faker.lorem.words(2);
const STAGE_WIDTH = 564;
const TALL_CONTENT_HEIGHT = 2400;
const SHORT_CONTENT_HEIGHT = 100;
const VIEWPORT_HEIGHT = 300;

const setup = customRender(DeviceFrame, {
  device: PREVIEW_DEVICE.DESKTOP,
  host: MOCK_HOST,
  isDark: false,
  children: <p>{MOCK_CONTENT}</p>,
});

describe(`<${DeviceFrame.name}/>`, () => {
  let restoreResizeObserver: () => void;
  let contentHeight: number;

  beforeEach(() => {
    contentHeight = TALL_CONTENT_HEIGHT;
    restoreResizeObserver = stubResizeObserver((target) => ({
      width: STAGE_WIDTH,
      height:
        target.getAttribute('data-testid') === DEVICE_FRAME_TEST_ID.CONTENT
          ? contentHeight
          : VIEWPORT_HEIGHT,
    }));
  });

  afterEach(() => {
    restoreResizeObserver();
  });

  it.each(Object.values(PREVIEW_DEVICE))(
    'names the %s frame by the device width it lays the sample out at',
    (device) => {
      setup({ device });

      const frame = screen.getByRole('img', {
        name: `Sample page at ${PREVIEW_DEVICE_WIDTH[device]} px`,
      });

      expect(frame).toBeVisible();
    },
  );

  it('drops the role and name of the frame in the full-screen fit', () => {
    setup({ fit: { mode: DEVICE_FRAME_FIT.FULLSCREEN } });

    const frame = screen.queryByRole('img');

    expect(frame).not.toBeInTheDocument();
  });

  it('renders the sample inside the frame, out of reach of clicks and focus', () => {
    setup();

    const content = screen.getByTestId(DEVICE_FRAME_TEST_ID.CONTENT);

    expect(content).toHaveTextContent(MOCK_CONTENT);
    expect(content).toHaveAttribute('inert');
  });

  it('shows the host in the desktop browser bar', () => {
    setup();

    const bar = screen.getByTestId(DEVICE_FRAME_TEST_ID.BROWSER_BAR);

    expect(bar).toHaveTextContent(MOCK_HOST);
  });

  it('shows the dots alone when the caller leaves the host out', () => {
    setup({ host: undefined });

    const bar = screen.getByTestId(DEVICE_FRAME_TEST_ID.BROWSER_BAR);

    const host = within(bar).queryByText(MOCK_HOST);

    expect(bar).toBeVisible();
    expect(host).not.toBeInTheDocument();
  });

  it.each([PREVIEW_DEVICE.TABLET, PREVIEW_DEVICE.PHONE])(
    'draws no browser bar on the %s',
    (device) => {
      setup({ device });

      const bar = screen.queryByTestId(DEVICE_FRAME_TEST_ID.BROWSER_BAR);

      expect(bar).not.toBeInTheDocument();
    },
  );

  it('reports the scale once the stage is measured', () => {
    const onScaleChange = vi.fn();

    setup({ onScaleChange });

    expect(onScaleChange).toHaveBeenLastCalledWith(0.4406);
  });

  it('shows a scrollbar when the sample is taller than the frame', () => {
    setup();

    const scrollbar = screen.getByTestId(
      DEVICE_FRAME_TEST_ID.VERTICAL_SCROLLBAR,
    );

    expect(scrollbar).toBeInTheDocument();
  });

  it('shows no scrollbar when the sample fits', () => {
    contentHeight = SHORT_CONTENT_HEIGHT;

    setup();

    const scrollbar = screen.queryByTestId(
      DEVICE_FRAME_TEST_ID.VERTICAL_SCROLLBAR,
    );

    expect(scrollbar).not.toBeInTheDocument();
  });

  it('shows no horizontal scrollbar when the frame does not pan', () => {
    setup();

    const scrollbar = screen.queryByTestId(
      DEVICE_FRAME_TEST_ID.HORIZONTAL_SCROLLBAR,
    );

    expect(scrollbar).not.toBeInTheDocument();
  });

  it('shows a horizontal scrollbar while the full-screen frame pans', () => {
    setup({ fit: { mode: DEVICE_FRAME_FIT.FULLSCREEN } });

    const scrollbar = screen.getByTestId(
      DEVICE_FRAME_TEST_ID.HORIZONTAL_SCROLLBAR,
    );

    expect(scrollbar).toBeInTheDocument();
  });

  it('renders the overlay slot beside the scrolling sample', () => {
    setup({
      children: (
        <>
          <p>{MOCK_CONTENT}</p>
          <DeviceFrame.Overlay>
            <span>{MOCK_OVERLAY}</span>
          </DeviceFrame.Overlay>
        </>
      ),
    });

    const overlay = screen.getByText(MOCK_OVERLAY);
    const content = screen.getByTestId(DEVICE_FRAME_TEST_ID.CONTENT);

    expect(overlay).toBeInTheDocument();
    expect(content).not.toContainElement(overlay);
  });

  describe('scroll handle', () => {
    let scrollTo: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      scrollTo = vi.fn();
      Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
        configurable: true,
        value: scrollTo,
      });
    });

    afterEach(() => {
      Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo');
    });

    it('scrolls the sample back to its top', () => {
      const ref = createRef<TDeviceFrameHandle>();

      setup({ ref });
      ref.current?.scrollTo(DEVICE_FRAME_SCROLL_TARGET.TOP, 'smooth');

      expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });
  });
});
