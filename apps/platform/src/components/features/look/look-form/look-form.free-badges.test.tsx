import { TENANT_PLAN } from '@blog/db/constants';
import { LOOK_ROW, type TLookRow } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_DISABLED } from '@platform/testing/aria';
import { screen, within } from '@platform/testing/custom-render';
import {
  EDITORIAL,
  GROWTH,
  MOCK_SAVED_ACCENT_HUE,
  RESET_TO_PRESET,
} from '@platform/testing/look/look-form-fixtures';
import {
  lookRowTrigger,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import {
  setupArchived,
  setupLookForm,
} from '@platform/testing/look/look-form-setup';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;
const growthRowBadge = (row: TLookRow) =>
  within(lookRowTrigger(row)).queryByText(GROWTH, { exact: true });

describe(`<${LookForm.name}/> Growth badges on Free`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('offers no Reset to preset on Free, even with an accent hue off the preset', () => {
    setupLookForm({
      plan: TENANT_PLAN.FREE,
      initialValues: {
        ...defaultLookFormValues(),
        accentHue: MOCK_SAVED_ACCENT_HUE,
      },
    });

    const resetButton = screen.queryByRole('button', {
      name: RESET_TO_PRESET,
    });
    const editorialPreset = screen.getByRole('radio', { name: EDITORIAL });
    expect(resetButton).not.toBeInTheDocument();
    expect(editorialPreset).not.toHaveAttribute(ARIA_DISABLED, 'true');
  });

  it.each([
    { site: 'a Growth site', setup: () => setupLookForm() },
    {
      site: 'an archived Free site',
      setup: () => setupArchived({ plan: TENANT_PLAN.FREE }),
    },
  ])('shows no Growth badge on $site', ({ setup }) => {
    setup();

    const badges = screen.queryAllByText(GROWTH, { exact: true });

    expect(badges).toHaveLength(0);
  });

  describe('on Free', () => {
    beforeEach(() => {
      setupLookForm({ plan: TENANT_PLAN.FREE });
    });

    it.each([
      LOOK_ROW.TYPE,
      LOOK_ROW.SHAPE,
      LOOK_ROW.BUTTONS,
      LOOK_ROW.HEADER,
      LOOK_ROW.LANGUAGE_SWITCHER,
    ])('badges the folded %s row, every field of which is Growth', (row) => {
      expect(growthRowBadge(row)).toBeVisible();
    });

    it.each([LOOK_ROW.COLOUR, LOOK_ROW.BRAND, LOOK_ROW.FOOTER])(
      'leaves the folded %s row unbadged, as it keeps a live field',
      (row) => {
        expect(growthRowBadge(row)).not.toBeInTheDocument();
      },
    );

    it('drops the row badge once the row opens, leaving the field badges', async () => {
      await openLookRow(user, LOOK_ROW.TYPE);

      const typeCard = screen.getByRole('group', {
        name: LOOK_FORM.typeHeading,
      });
      const fieldBadges = within(typeCard).getAllByText(GROWTH, {
        exact: true,
      });

      expect(growthRowBadge(LOOK_ROW.TYPE)).not.toBeInTheDocument();
      expect(fieldBadges).toHaveLength(2);
    });

    it('never shows the old Growth plan lock wording', () => {
      const oldLock = screen.queryByText(
        messages.featuresSettings.planLockedBadge,
      );

      expect(oldLock).not.toBeInTheDocument();
    });
  });
});
