import { ICONS } from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  PREVIEW_DEVICE,
  PREVIEW_HEADING_LAYOUT,
  PREVIEW_MODE,
  PREVIEW_READOUT,
  type TPreviewDevice,
  type TPreviewHeadingLayout,
} from '@platform/constants/preview';
import { ARIA_PRESSED } from '@platform/testing/aria';
import {
  customRender,
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';
import { stubResizeObserver } from '@platform/testing/resize-observer';
import { TOOLTIP_HOVER_TIMEOUT } from '@platform/testing/tooltip';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { PreviewFrame } from './preview-frame';

faker.seed(6390);

const MOCK_LABEL = faker.lorem.words(2);
const MOCK_SAMPLE = faker.lorem.words(3);
const MOCK_CONTROL = faker.lorem.words(2);
const MOCK_END_SLOT = faker.lorem.words(2);
const MOCK_STATUS = faker.lorem.words(4);
const MOCK_ACTION = faker.lorem.words(2);
const LIVE_PREVIEW = 'Live preview';
const NARROW_ROW = PREVIEW_READOUT.LONG_MIN_WIDTH - 1;
const WIDE_ROW = 600;
const DESKTOP_LONG_READOUT = '1280 px wide · shown at 44%';
const PHONE_LONG_READOUT = '390 px wide · shown at 72%';

const setup = customRender(PreviewFrame, {
  ariaLabel: MOCK_LABEL,
  children: <p>{MOCK_SAMPLE}</p>,
});

describe(`<${PreviewFrame.name}/>`, () => {
  it('keeps the caller toolbar controls and the sample', () => {
    setup({ widthControl: <span>{MOCK_CONTROL}</span> });

    const section = screen.getByRole('region', { name: MOCK_LABEL });

    const control = within(section).getByText(MOCK_CONTROL);
    const sample = within(section).getByText(MOCK_SAMPLE);

    expect(control).toBeVisible();
    expect(sample).toBeVisible();
  });

  describe('heading', () => {
    let restoreResizeObserver: () => void;
    let rowWidth: number;

    const headingOf = (
      device: TPreviewDevice,
      scale: number,
      layout?: TPreviewHeadingLayout,
    ) => (
      <PreviewFrame ariaLabel={MOCK_LABEL}>
        <PreviewFrame.Heading device={device} scale={scale} layout={layout} />
      </PreviewFrame>
    );

    beforeEach(() => {
      rowWidth = WIDE_ROW;
      restoreResizeObserver = stubResizeObserver(() => ({
        width: rowWidth,
        height: 20,
      }));
    });

    afterEach(() => {
      restoreResizeObserver();
    });

    it.each([
      {
        device: PREVIEW_DEVICE.DESKTOP,
        scale: 0.4406,
        text: DESKTOP_LONG_READOUT,
      },
      {
        device: PREVIEW_DEVICE.DESKTOP,
        scale: 0.3469,
        text: '1280 px wide · shown at 35%',
      },
      {
        device: PREVIEW_DEVICE.TABLET,
        scale: 0.5153,
        text: '820 px wide · shown at 52%',
      },
      {
        device: PREVIEW_DEVICE.PHONE,
        scale: 0.7204,
        text: PHONE_LONG_READOUT,
      },
    ])(
      'reads "$text" under "Live preview" in a wide section',
      ({ device, scale, text }) => {
        renderWithIntl(headingOf(device, scale));

        const heading = screen.getByRole('heading', {
          level: 2,
          name: LIVE_PREVIEW,
        });
        const readout = screen.getByRole('status');

        expect(heading).toBeVisible();
        expect(readout).toHaveTextContent(text);
      },
    );

    it.each([
      {
        device: PREVIEW_DEVICE.TABLET,
        scale: 0.4805,
        text: '820 px · 48%',
      },
      {
        device: PREVIEW_DEVICE.PHONE,
        scale: 0.7204,
        text: '390 px · 72%',
      },
    ])(
      'reads "$text" under "Preview" in a narrow section',
      ({ device, scale, text }) => {
        rowWidth = NARROW_ROW;
        renderWithIntl(headingOf(device, scale));

        const heading = screen.getByRole('heading', { level: 2 });
        const readout = screen.getByRole('status');

        expect(heading).toHaveAccessibleName('Preview');
        expect(readout).toHaveTextContent(text);
      },
    );

    it('keeps the long form at the 476 px boundary', () => {
      rowWidth = PREVIEW_READOUT.LONG_MIN_WIDTH;
      renderWithIntl(headingOf(PREVIEW_DEVICE.DESKTOP, 0.4406));

      const heading = screen.getByRole('heading', { level: 2 });
      const readout = screen.getByRole('status');

      expect(heading).toHaveAccessibleName(LIVE_PREVIEW);
      expect(readout).toHaveTextContent(DESKTOP_LONG_READOUT);
    });

    it('reads the phone tab readout under a heading kept for assistive technology', () => {
      rowWidth = NARROW_ROW;
      renderWithIntl(
        headingOf(
          PREVIEW_DEVICE.PHONE,
          0.6197,
          PREVIEW_HEADING_LAYOUT.PHONE_TAB,
        ),
      );

      const heading = screen.getByRole('heading', {
        level: 2,
        name: LIVE_PREVIEW,
      });
      const readout = screen.getByRole('status');

      expect(heading).toBeInTheDocument();
      expect(readout).toHaveTextContent('390 px · shown at 62%');
    });

    it('updates the readout when the device and scale change', () => {
      const { rerender } = renderWithIntl(
        headingOf(PREVIEW_DEVICE.DESKTOP, 0.4406),
      );

      rerender(headingOf(PREVIEW_DEVICE.PHONE, 0.7204));

      const readout = screen.getByRole('status');

      expect(readout).toHaveTextContent(PHONE_LONG_READOUT);
    });
  });

  describe('toolbar', () => {
    const onDeviceChange = vi.fn();
    const onModeChange = vi.fn();
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
      setup({
        children: (
          <PreviewFrame.Toolbar
            device={PREVIEW_DEVICE.TABLET}
            onDeviceChange={onDeviceChange}
            mode={PREVIEW_MODE.DARK}
            onModeChange={onModeChange}
          >
            <span>{MOCK_END_SLOT}</span>
          </PreviewFrame.Toolbar>
        ),
      });
    });

    it('offers the devices and the colour scheme as named groups', () => {
      const toolbar = screen.getByRole('toolbar', { name: 'Preview options' });
      const devices = screen.getByRole('group', { name: 'Preview device' });
      const schemes = screen.getByRole('group', {
        name: 'Preview colour scheme',
      });

      const deviceButtons = within(devices).getAllByRole('button');
      const schemeButtons = within(schemes).getAllByRole('button');
      const endSlot = within(toolbar).getByText(MOCK_END_SLOT);

      expect(deviceButtons).toHaveLength(3);
      expect(schemeButtons).toHaveLength(2);
      expect(endSlot).toBeVisible();
    });

    it('presses the chosen device and colour scheme', () => {
      const tablet = screen.getByRole('button', { name: 'Tablet' });
      const dark = screen.getByRole('button', { name: 'Dark' });

      expect(tablet).toHaveAttribute(ARIA_PRESSED, 'true');
      expect(dark).toHaveAttribute(ARIA_PRESSED, 'true');
    });

    it('lands the first Tab on the pressed device', async () => {
      await user.tab();

      const tablet = screen.getByRole('button', { name: 'Tablet' });

      expect(tablet).toHaveFocus();
    });

    it.each([
      { name: 'Desktop', tooltip: 'Desktop · 1280 px' },
      { name: 'Tablet', tooltip: 'Tablet · 820 px' },
      { name: 'Phone', tooltip: 'Phone · 390 px' },
      { name: 'Light', tooltip: 'Light' },
      { name: 'Dark', tooltip: 'Dark' },
    ])('shows the "$tooltip" tooltip on the $name button', async (option) => {
      const button = screen.getByRole('button', { name: option.name });
      await user.hover(button);

      const tooltip = await screen.findByText(
        option.tooltip,
        {},
        TOOLTIP_HOVER_TIMEOUT,
      );

      expect(tooltip).toBeVisible();
    });

    it('reports the device the user picks', async () => {
      const phone = screen.getByRole('button', { name: 'Phone' });
      await user.click(phone);

      expect(onDeviceChange).toHaveBeenCalledWith(PREVIEW_DEVICE.PHONE);
    });

    it('reports the colour scheme the user picks', async () => {
      const light = screen.getByRole('button', { name: 'Light' });
      await user.click(light);

      expect(onModeChange).toHaveBeenCalledWith(PREVIEW_MODE.LIGHT);
    });
  });

  it('shows the status text with its trailing action', () => {
    setup({
      children: (
        <PreviewFrame.Status
          icon={ICONS.CROSSHAIR}
          action={<button type="button">{MOCK_ACTION}</button>}
        >
          {MOCK_STATUS}
        </PreviewFrame.Status>
      ),
    });

    const action = screen.getByRole('button', { name: MOCK_ACTION });

    const status = screen.getByText(MOCK_STATUS);

    expect(status).toBeVisible();
    expect(action).toBeVisible();
  });

  it('shows the status text without an action when the caller passes none', () => {
    setup({
      children: (
        <PreviewFrame.Status icon={ICONS.CROSSHAIR}>
          {MOCK_STATUS}
        </PreviewFrame.Status>
      ),
    });

    const status = screen.getByText(MOCK_STATUS);
    const action = screen.queryByRole('button');

    expect(status).toBeVisible();
    expect(action).not.toBeInTheDocument();
  });

  it('renders the stage part holding the sample', () => {
    setup({
      children: (
        <PreviewFrame.Stage isCompact={true}>
          <p>{MOCK_SAMPLE}</p>
        </PreviewFrame.Stage>
      ),
    });

    const sample = screen.getByText(MOCK_SAMPLE);

    expect(sample).toBeVisible();
  });
});
