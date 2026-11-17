import { faker } from '@faker-js/faker';
import { DEVICE_FRAME_TEST_ID } from '@platform/constants/device-frame';
import {
  PREVIEW_DEVICE,
  PREVIEW_DEVICE_WIDTH,
} from '@platform/constants/preview';
import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import { stubResizeObserver } from '@platform/testing/resize-observer';
import { MOCK_TENANT_URL } from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { DraftPreviewFrame } from './draft-preview-frame';

faker.seed(71801);

const t = makeEnTranslator('draftPreview');
const tDevice = makeEnTranslator('devicePreview');
const MOCK_PUBLISHED_URL = `${MOCK_TENANT_URL}/${faker.lorem.slug()}`;
const MOCK_FRAME_URL = `${MOCK_PUBLISHED_URL}?preview=${faker.string.alphanumeric(40)}`;

const setup = customRender(DraftPreviewFrame, {
  frameUrl: MOCK_FRAME_URL,
  publishedUrl: MOCK_PUBLISHED_URL,
});

const MOCK_STAGE_WIDTH = 564;
const MOCK_STAGE_HEIGHT = 300;

const frame = () => screen.getByTitle(t('frameTitle'));
const deviceContent = () => screen.getByTestId(DEVICE_FRAME_TEST_ID.CONTENT);

describe(`<${DraftPreviewFrame.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;
  let restoreResizeObserver: () => void;

  beforeEach(() => {
    restoreResizeObserver = stubResizeObserver(() => ({
      width: MOCK_STAGE_WIDTH,
      height: MOCK_STAGE_HEIGHT,
    }));
    user = userEvent.setup();
    refresh = mockRouterRefresh();
    setup();
  });

  afterEach(() => {
    restoreResizeObserver();
  });

  it("frames the tenant's site at the signed address, at the true desktop width", () => {
    const iframe = frame();
    const content = deviceContent();

    expect(iframe).toHaveAttribute('src', MOCK_FRAME_URL);
    expect(content).toContainElement(iframe);
    expect(content).toHaveStyle({
      width: `${PREVIEW_DEVICE_WIDTH[PREVIEW_DEVICE.DESKTOP]}px`,
    });
  });

  it('lets the framed draft be scrolled and clicked', () => {
    const content = deviceContent();

    expect(content).not.toHaveAttribute('inert');
  });

  it('resizes the frame to the chosen device width', async () => {
    const phone = screen.getByRole('button', { name: tDevice('devicePhone') });

    await user.click(phone);

    expect(deviceContent()).toHaveStyle({
      width: `${PREVIEW_DEVICE_WIDTH[PREVIEW_DEVICE.PHONE]}px`,
    });
  });

  it('reloads the page, so a new token frames the latest saved draft', async () => {
    const reload = screen.getByRole('button', { name: t('reload') });

    await user.click(reload);

    expect(refresh).toHaveBeenCalledOnce();
  });

  it('links to the published page in a new tab', () => {
    const link = screen.getByRole('link', {
      name: new RegExp(t('openPublished')),
    });

    expect(link).toHaveAttribute('href', MOCK_PUBLISHED_URL);
    expect(link).toHaveAttribute('target', '_blank');
  });
});
