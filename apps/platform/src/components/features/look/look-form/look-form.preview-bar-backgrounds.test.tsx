import { LOOK_ROW } from '@platform/constants/look-row';
import { LOOK_SAMPLE_BREADCRUMBS_TEST_ID } from '@platform/constants/look-sample';
import { SAMPLE_HEADER_TEST_ID } from '@platform/constants/sample-header';
import { SKIN_ATTRIBUTE } from '@platform/constants/site-theme-frame';
import messages from '@platform/i18n/messages/en.json';
import { screen } from '@platform/testing/custom-render';
import {
  chooseSegment,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import { BRAND_VARIANT } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(async () => {
    user = userEvent.setup();
    setupLookForm();
    await openLookRow(user, LOOK_ROW.HEADER);
  });

  it('previews the chosen header background before saving', async () => {
    await chooseSegment(
      user,
      LOOK_FORM.headerBackgroundLabel,
      LOOK_FORM.skinLabel.INK,
    );

    const sampleHeader = screen.getByTestId(SAMPLE_HEADER_TEST_ID);
    expect(sampleHeader).toHaveAttribute(SKIN_ATTRIBUTE, BRAND_VARIANT.INK);
  });

  it('previews the chosen breadcrumb background before saving', async () => {
    await openLookRow(user, LOOK_ROW.DETAILS);
    await chooseSegment(
      user,
      LOOK_FORM.breadcrumbBackgroundLabel,
      LOOK_FORM.skinLabel.SECONDARY,
    );

    const sampleBreadcrumbs = screen.getByTestId(
      LOOK_SAMPLE_BREADCRUMBS_TEST_ID,
    );
    expect(sampleBreadcrumbs).toHaveAttribute(
      SKIN_ATTRIBUTE,
      BRAND_VARIANT.SECONDARY,
    );
  });

  it('shows the breadcrumb row on the page tint while it is Plain', () => {
    const sampleBreadcrumbs = screen.getByTestId(
      LOOK_SAMPLE_BREADCRUMBS_TEST_ID,
    );
    expect(sampleBreadcrumbs).not.toHaveAttribute(SKIN_ATTRIBUTE);
  });
});
