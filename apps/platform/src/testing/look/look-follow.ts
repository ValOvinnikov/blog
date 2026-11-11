import { LOCALE_ISO_CODES } from '@blog/config';
import type { TLookFollow } from '@platform/components/features/look/look-preview/use-look-follow';
import type { TDeviceFrameHandle } from '@platform/components/shared/device-frame';
import { DEVICE_FRAME_SCROLL_TARGET } from '@platform/constants/device-frame';
import type { TLookRow } from '@platform/constants/look-row';
import { PREVIEW_FRAME_STATUS_TEST_ID } from '@platform/constants/preview';
import messages from '@platform/i18n/messages/en.json';
import { screen } from '@platform/testing/custom-render';
import { stubResizeObserver } from '@platform/testing/resize-observer';
import { toLookFollowTarget } from '@platform/utils/look-follow-target/look-follow-target';
import { createTranslator } from 'next-intl';

const tFollow = createTranslator({
  locale: LOCALE_ISO_CODES.EN,
  messages,
  namespace: 'lookFollow',
});

type TFollowLineKey = Parameters<typeof tFollow.markup>[0];

export const followLine = (
  key: TFollowLineKey,
  values: Record<string, string | number> = {},
) => tFollow.markup(key, { ...values, strong: (chunks: string) => chunks });

const MOCK_MEASURED_EDGE = 40;
const MOCK_MEASURED_SIZE = {
  width: MOCK_MEASURED_EDGE,
  height: MOCK_MEASURED_EDGE,
};

export const stubMeasuredSample = () => {
  const rectSpy = vi
    .spyOn(Element.prototype, 'getBoundingClientRect')
    .mockReturnValue(new DOMRect(0, 0, MOCK_MEASURED_EDGE, MOCK_MEASURED_EDGE));
  const restoreResizeObserver = stubResizeObserver(() => MOCK_MEASURED_SIZE);

  return () => {
    restoreResizeObserver();
    rectSpy.mockRestore();
  };
};

export const mockOpenRowTarget = (row: TLookRow) =>
  toLookFollowTarget([row], row, false);

type TFakeFrameOptions = {
  top?: number;
  maxTop: number;
  contentHeight: number;
};

export const makeFakeFrame = ({
  top = 0,
  maxTop,
  contentHeight,
}: TFakeFrameOptions) => {
  const position = { top };
  const scrollTo = vi.fn<TDeviceFrameHandle['scrollTo']>((target) => {
    position.top = target === DEVICE_FRAME_SCROLL_TARGET.TOP ? 0 : maxTop;
  });
  const handle: TDeviceFrameHandle = {
    scrollTo,
    scrollBy: vi.fn(),
    getScrollMetrics: () => ({ top: position.top, maxTop, contentHeight }),
  };

  return { handle, scrollTo, position };
};

export const mockLookFollow = (
  overrides: Partial<TLookFollow> = {},
): TLookFollow => ({
  outline: undefined,
  isOn: true,
  isPaused: false,
  isFollowing: false,
  settled: undefined,
  onPressedChange: vi.fn(),
  onHandScroll: vi.fn(),
  resume: vi.fn(),
  scrollToTop: vi.fn(),
  ...overrides,
});

export const followStatusText = () =>
  screen.getByTestId(PREVIEW_FRAME_STATUS_TEST_ID).textContent;
