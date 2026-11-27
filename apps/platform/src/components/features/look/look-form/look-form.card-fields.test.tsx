import { LOOK_FIELD_LABEL_TEST_ID } from '@platform/constants/look-form';
import { LOOK_ROW, type TLookRow } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { screen, within } from '@platform/testing/custom-render';
import { openLookRow } from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';
import { LOOK_ROW_TITLE_KEY } from './look-row-title-key';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;

const fieldLabelsIn = (container: HTMLElement) =>
  within(container)
    .getAllByTestId(LOOK_FIELD_LABEL_TEST_ID)
    .map((label) => label.textContent);

describe(`<${LookForm.name}/> card fields`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    setupLookForm();
  });

  it.each<{ row: TLookRow; labels: string[] }>([
    {
      row: LOOK_ROW.BRAND,
      labels: [
        LOOK_FORM.brandNameLabel,
        LOOK_FORM.logoFieldLabel,
        LOOK_FORM.logoDarkFieldLabel,
        LOOK_FORM.logoHueLabel,
        LOOK_FORM.faviconFieldLabel,
      ],
    },
    {
      row: LOOK_ROW.COLOUR,
      labels: [
        LOOK_FORM.accentHueLabel,
        LOOK_FORM.buttonColorLabel,
        LOOK_FORM.buttonColorDarkLabel,
        LOOK_FORM.colorModeLabel,
      ],
    },
    {
      row: LOOK_ROW.TYPE,
      labels: [
        LOOK_FORM.headingFontLabel,
        LOOK_FORM.bodyFontLabel,
        LOOK_FORM.headingWeightLabel,
        LOOK_FORM.headingCaseLabel,
      ],
    },
    {
      row: LOOK_ROW.SHAPE,
      labels: [
        LOOK_FORM.radiusScaleLabel,
        LOOK_FORM.buttonShapeLabel,
        LOOK_FORM.densityLabel,
        LOOK_FORM.cardStyleLabel,
        LOOK_FORM.imageProportionLabel,
        LOOK_FORM.dividerWidthLabel,
      ],
    },
    {
      row: LOOK_ROW.FOOTER,
      labels: [
        LOOK_FORM.footerLayoutLabel,
        LOOK_FORM.footerBackgroundLabel,
        LOOK_FORM.footerSurfaceLabel,
      ],
    },
    {
      row: LOOK_ROW.DETAILS,
      labels: [
        LOOK_FORM.spinnerStyleLabel,
        LOOK_FORM.busyButtonStyleLabel,
        LOOK_FORM.breadcrumbBackgroundLabel,
        LOOK_FORM.cookieSettingsButtonLabel,
      ],
    },
  ])('lists the $row card fields in order', async ({ row, labels }) => {
    await openLookRow(user, row);

    const card = screen.getByRole('group', {
      name: LOOK_FORM[LOOK_ROW_TITLE_KEY[row]],
    });

    expect(fieldLabelsIn(card)).toEqual(labels);
  });

  it.each([
    {
      heading: LOOK_FORM.headerLayoutHeading,
      labels: [
        LOOK_FORM.headerLayoutLabel,
        LOOK_FORM.headerBarStyleLabel,
        LOOK_FORM.headerBackgroundLabel,
        LOOK_FORM.headerSubmenuStyleLabel,
      ],
    },
    {
      heading: LOOK_FORM.headerLinksHeading,
      labels: [LOOK_FORM.navLinkStyleLabel],
    },
    {
      heading: LOOK_FORM.headerButtonsHeading,
      labels: [
        LOOK_FORM.headerControlStyleLabel,
        LOOK_FORM.headerControlShapeLabel,
        LOOK_FORM.languageSwitcherStyleLabel,
      ],
    },
    {
      heading: LOOK_FORM.headerActionHeading,
      labels: [
        LOOK_FORM.headerActionStyleLabel,
        LOOK_FORM.headerActionPhonePlacementLabel,
      ],
    },
    {
      heading: LOOK_FORM.headerAccountHeading,
      labels: [
        LOOK_FORM.accountButtonStyleLabel,
        LOOK_FORM.accountPanelStyleLabel,
        LOOK_FORM.accountPhonePlacementLabel,
      ],
    },
  ])(
    'names the Header $heading sub-section and lists its fields in order',
    async ({ heading, labels }) => {
      await openLookRow(user, LOOK_ROW.HEADER);

      const subsection = screen.getByRole('group', { name: heading });

      expect(fieldLabelsIn(subsection)).toEqual(labels);
    },
  );
});
