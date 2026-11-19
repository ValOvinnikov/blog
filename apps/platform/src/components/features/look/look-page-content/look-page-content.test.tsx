import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { buildVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { ARIA_DISABLED } from '@platform/testing/aria';
import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import { screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  growthBadgesOutsideNote,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import { setupLookPageContent as setup } from '@platform/testing/look/look-page-content-setup';
import {
  arrangeLookPageQueries,
  getSiteConfigMock,
} from '@platform/testing/look/mock-look-page-db';
import { mockViewer } from '@platform/testing/memberships/fixtures';
import { mockSiteConfig } from '@platform/testing/site-config/fixtures';
import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import { PRESET_ID } from '@shinefold/config';
import { TENANT_PLAN } from '@shinefold/config/constants';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookPageContent } from './look-page-content';

vi.mock('@shinefold/db', async () =>
  (await import('@platform/testing/look/mock-look-page-db')).mockLookPageDb(),
);

vi.mock('@platform/server/settings-features/get-enabled-capabilities');

vi.mock('@platform/utils/env/env');

const MOCK_ACCENT_HUE = 28;
const { radiusScaleOptionLabel: RADIUS_LABEL } = messages.lookForm;

const tLogoHue = makeEnTranslator('logoHueField');

describe(`<${LookPageContent.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    arrangeLookPageQueries();
  });

  it('renders the Console defaults when the tenant has no saved look yet', async () => {
    await setup();

    const heading = screen.getByRole('heading', { name: 'Look' });
    const consoleRadio = screen.getByRole('radio', { name: 'Console' });

    expect(getSiteConfigMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(heading).toBeVisible();
    expect(consoleRadio).toBeChecked();
  });

  it("renders the tenant's saved look when one exists", async () => {
    getSiteConfigMock.mockResolvedValue(
      mockSiteConfig({
        preset: PRESET_ID.EDITORIAL,
        accentHue: MOCK_ACCENT_HUE,
      }),
    );

    await setup();
    await openLookRow(user, LOOK_ROW.COLOUR);

    const editorialRadio = screen.getByRole('radio', { name: 'Editorial' });
    const hueValue = screen.getByText(
      tLogoHue('hueValue', { hue: MOCK_ACCENT_HUE }),
    );

    expect(editorialRadio).toBeChecked();
    expect(hueValue).toBeVisible();
  });

  describe('the Growth note on a Free tenant', () => {
    const freeTenant = mockReadyTenant({ plan: TENANT_PLAN.FREE });

    it('shows an owner the note', async () => {
      await setup({ tenant: freeTenant, viewer: mockViewer() });

      const title = screen.getByText(messages.growthNote.title);

      expect(title).toBeVisible();
    });

    it.each([
      ['an admin', mockViewer({ admin: mockAdmin() })],
      [
        'an admin with a virtual membership',
        mockViewer({
          membership: buildVirtualAdminMembership(
            mockAdmin().userId,
            MOCK_TENANT_ID,
          ),
        }),
      ],
    ])(
      'shows %s no note, but the badges and locked fields',
      async (_name, viewer) => {
        await setup({ tenant: freeTenant, viewer });
        await openLookRow(user, LOOK_ROW.SHAPE);

        const title = screen.queryByText(messages.growthNote.title);
        const badges = growthBadgesOutsideNote();
        const lockedRadius = screen.getByRole('button', {
          name: RADIUS_LABEL.MD,
        });

        expect(title).not.toBeInTheDocument();
        expect(badges.length).toBeGreaterThan(0);
        expect(lockedRadius).toHaveAttribute(ARIA_DISABLED, 'true');
      },
    );
  });

  it('shows the archived notice for a deprovisioned tenant', async () => {
    await setup({
      tenant: mockReadyTenant({ deprovisionedAt: MOCK_ARCHIVED_AT }),
    });

    expectArchivedOffersNoSave();
  });
});
