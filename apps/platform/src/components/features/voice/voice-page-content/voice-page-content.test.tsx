import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { makeReadyTenant } from '@platform/testing/tenants/fixtures';
import userEvent from '@testing-library/user-event';

import { VoicePageContent } from './voice-page-content';

const ADVANCED_SUMMARY = 'Advanced — 8 curated strings, 2 groups';

const openAdvanced = async () => {
  await userEvent.setup().click(screen.getByText(ADVANCED_SUMMARY));
};

const { getSiteConfigMock } = vi.hoisted(() => ({
  getSiteConfigMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: { siteConfig: { getSiteConfig: getSiteConfigMock } },
}));

vi.mock('@platform/server/auth/auth', () => ({ auth: vi.fn() }));

const tenant = makeReadyTenant();

const setup = customRenderAsync(VoicePageContent, { tenant });

describe(`<${VoicePageContent.name}/>`, () => {
  beforeEach(() => {
    getSiteConfigMock.mockReset();
  });

  it('shows every field blank, with no placeholder, when the tenant has no site_config row yet', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    await setup();
    await openAdvanced();

    expect(
      screen.getByRole('textbox', { name: 'Not Found Heading' }),
    ).toHaveValue('');
    expect(
      screen.getByRole('textbox', { name: 'Not Found Heading' }),
    ).not.toHaveAttribute('placeholder');
  });

  it('renders a previously-saved override as the field value', async () => {
    getSiteConfigMock.mockResolvedValue({
      voiceOverrides: { notFoundHeading: 'Nothing here' },
    });

    await setup();
    await openAdvanced();

    expect(
      screen.getByRole('textbox', { name: 'Not Found Heading' }),
    ).toHaveValue('Nothing here');
  });

  it('renders a stored rich (Portable Text) override as its plain text, not blank', async () => {
    getSiteConfigMock.mockResolvedValue({
      voiceOverrides: {
        blogListEmpty: [
          {
            _type: 'block',
            _key: 'k1',
            style: 'normal',
            children: [
              { _type: 'span', _key: 's1', text: 'Nothing published yet.' },
            ],
          },
        ],
      },
    });

    await setup();
    await openAdvanced();

    expect(
      screen.getByRole('textbox', { name: 'Blog List Empty' }),
    ).toHaveValue('Nothing published yet.');
  });

  it('passes the archived date through for a deprovisioned tenant', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    await setup({
      tenant: {
        ...tenant,
        deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
      },
    });

    expect(screen.getByText('This tenant is archived')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });
});
