import { faker } from '@faker-js/faker';
import {
  PREVIEW_DEVICE,
  PREVIEW_DEVICE_WIDTH,
} from '@platform/constants/preview';
import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockRouterRefresh } from '@platform/testing/mock-router';
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

const frame = () => screen.getByTitle(t('frameTitle'));

describe(`<${DraftPreviewFrame.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
    setup();
  });

  it("frames the tenant's site at the signed address, desktop-wide", () => {
    const iframe = frame();

    expect(iframe).toHaveAttribute('src', MOCK_FRAME_URL);
    expect(iframe).toHaveStyle({
      width: `${PREVIEW_DEVICE_WIDTH[PREVIEW_DEVICE.DESKTOP]}px`,
    });
  });

  it('resizes the frame to the chosen device width', async () => {
    const phone = screen.getByRole('button', { name: tDevice('devicePhone') });

    await user.click(phone);

    expect(frame()).toHaveStyle({
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
