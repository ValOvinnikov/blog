import { ICONS } from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  PREVIEW_DEVICE,
  PREVIEW_HEADING_LAYOUT,
  PREVIEW_MODE,
  PREVIEW_READOUT,
  type TPreviewHeadingLayout,
} from '@platform/constants/preview';
import { ARIA_PRESSED } from '@platform/testing/aria';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { stubResizeObserver } from '@platform/testing/resize-observer';
import userEvent from '@testing-library/user-event';

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
    const renderHeading = (layout?: TPreviewHeadingLayout) =>
      setup({
        children: (
          <PreviewFrame.Heading
            device={PREVIEW_DEVICE.DESKTOP}
            scale={0.4406}
            layout={layout}
          />
        ),
      });

    it('names the section "Live preview" with the long readout', () => {
      renderHeading();

      const heading = screen.getByRole('heading', {
        level: 2,
        name: LIVE_PREVIEW,
      });
      const readout = screen.getByRole('status');

      expect(heading).toBeVisible();
      expect(readout).toHaveTextContent('1280 px wide · shown at 44%');
    });

    describe('in a narrow section', () => {
      let restoreResizeObserver: () => void;

      beforeEach(() => {
        restoreResizeObserver = stubResizeObserver(() => ({
          width: NARROW_ROW,
          height: 20,
        }));
      });

      afterEach(() => {
        restoreResizeObserver();
      });

      it('switches to "Preview" and the short readout', () => {
        renderHeading();

        const heading = screen.getByRole('heading', { level: 2 });
        const readout = screen.getByRole('status');

        expect(heading).toHaveTextContent('Preview');
        expect(readout).toHaveTextContent('1280 px · 44%');
      });
    });

    it('reads the phone tab readout under a heading kept for assistive technology', () => {
      renderHeading(PREVIEW_HEADING_LAYOUT.PHONE_TAB);

      const heading = screen.getByRole('heading', {
        level: 2,
        name: LIVE_PREVIEW,
      });
      const readout = screen.getByRole('status');

      expect(heading).toBeInTheDocument();
      expect(readout).toHaveTextContent('1280 px · shown at 44%');
    });
  });

  describe('toolbar', () => {
    const onDeviceChange = vi.fn();
    const onModeChange = vi.fn();

    beforeEach(() => {
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

    it('reports the device the user picks', async () => {
      const user = userEvent.setup();

      const phone = screen.getByRole('button', { name: 'Phone' });
      await user.click(phone);

      expect(onDeviceChange).toHaveBeenCalledWith(PREVIEW_DEVICE.PHONE);
    });

    it('reports the colour scheme the user picks', async () => {
      const user = userEvent.setup();

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
