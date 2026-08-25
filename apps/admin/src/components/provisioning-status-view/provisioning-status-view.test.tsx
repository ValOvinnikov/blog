import messages from '@admin/i18n/messages/en.json';
import {
  act,
  fireEvent,
  renderWithIntl,
  screen,
  waitFor,
  within,
} from '@admin/testing/custom-render';
import {
  idleProvisioningSteps,
  makeTenant,
} from '@admin/testing/tenants/fixtures';
import { LOCALE_ISO_CODES } from '@blog/config';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement } from 'react';

import { ProvisioningStatusView } from './provisioning-status-view';

const render = renderWithIntl;

// `rerender()` replaces the entire previously-rendered tree, so a rerender
// that needs to keep going through `useTranslations` context has to
// re-supply this wrapper itself — `renderWithIntl`'s own wrapping only
// covers the initial render.
const withIntl = (ui: ReactElement) => {
  return (
    <NextIntlClientProvider locale={LOCALE_ISO_CODES.EN} messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
};

const STEP_POLL_INTERVAL_MS = 4000;
const DOMAIN_POLL_INTERVAL_MS = 10000;
// Mirrors the component's own `RETRY_BASELINE_MAX_TICKS`.
const RETRY_BASELINE_MAX_TICKS = 75;

const {
  retryProvisioningStepActionMock,
  getTenantProvisioningStatusActionMock,
  getDomainVerificationStatusActionMock,
  updateTenantDetailsActionMock,
} = vi.hoisted(() => ({
  retryProvisioningStepActionMock: vi.fn(),
  getTenantProvisioningStatusActionMock: vi.fn(),
  getDomainVerificationStatusActionMock: vi.fn(),
  updateTenantDetailsActionMock: vi.fn(),
}));

vi.mock('@admin/server/provisioning/retry-provisioning-step-action', () => ({
  retryProvisioningStepAction: retryProvisioningStepActionMock,
}));

vi.mock(
  '@admin/server/provisioning/get-tenant-provisioning-status-action',
  () => ({
    getTenantProvisioningStatusAction: getTenantProvisioningStatusActionMock,
  }),
);

vi.mock(
  '@admin/server/provisioning/get-domain-verification-status-action',
  () => ({
    getDomainVerificationStatusAction: getDomainVerificationStatusActionMock,
  }),
);

// `TenantDetailsPanel` is rendered unmocked here — its own save action
// transitively pulls in Auth.js via `requireAdmin`, mocked out purely to
// keep this render test from loading that chain.
vi.mock('@admin/server/tenants/update-tenant-details-action', () => ({
  updateTenantDetailsAction: updateTenantDetailsActionMock,
}));

describe(ProvisioningStatusView, () => {
  beforeEach(() => {
    retryProvisioningStepActionMock.mockReset();
    retryProvisioningStepActionMock.mockResolvedValue({
      outcome: 'dispatched',
    });
    getTenantProvisioningStatusActionMock.mockReset();
    getTenantProvisioningStatusActionMock.mockResolvedValue(undefined);
    getDomainVerificationStatusActionMock.mockReset();
    getDomainVerificationStatusActionMock.mockResolvedValue('NOT_CONFIGURED');
    updateTenantDetailsActionMock.mockReset();
  });

  it('splits the heading into an eyebrow and the tenant name', () => {
    const tenant = makeTenant({ name: 'Acme Inc.' });
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
      />,
    );

    expect(screen.getByText('Provisioning status')).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Acme Inc.' }),
    ).toBeVisible();
  });

  it('shows the invited-pending owner badge when the tenant has no resolved owner email', () => {
    const tenant = makeTenant();
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail={undefined}
      />,
    );

    expect(screen.getByText('Owner')).toBeVisible();
    expect(screen.getByText('Invited, pending')).toBeVisible();
  });

  it('hides the invited-pending owner badge once the tenant has a resolved owner email', () => {
    const tenant = makeTenant();
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
      />,
    );

    expect(screen.queryByText('Invited, pending')).not.toBeInTheDocument();
  });

  it('renders the steps column as a semantic aside landmark', () => {
    const tenant = makeTenant();
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
      />,
    );

    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  it('lists all six provisioning steps in order, in operator language', () => {
    const tenant = makeTenant();
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
      />,
    );

    const headings = [
      'Create the content workspace',
      'Add starter content',
      'Deploy the content editor',
      'Connect the site to its content',
      'Connect the custom domain',
      'Wire up the CMS to the site',
    ];
    for (const heading of headings) {
      expect(screen.getByText(heading)).toBeVisible();
    }
  });

  it('shows the current status for a running step', () => {
    const tenant = makeTenant({
      provisioningSteps: {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
        },
      },
    });
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
      />,
    );

    expect(screen.getAllByText('Running…')[0]).toBeVisible();
  });

  it("shows a running step's number in its circle instead of a spinner", () => {
    const tenant = makeTenant({
      provisioningSteps: {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
        },
      },
    });
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
      />,
    );

    expect(screen.queryAllByRole('status')).toHaveLength(0);
    expect(
      screen.getByText('1', { selector: 'span[aria-hidden="true"]' }),
    ).toBeVisible();
  });

  it('exposes exactly one accessible announcement per step across all four statuses', () => {
    const tenant = makeTenant({
      provisioningSteps: {
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.IDLE,
        },
        [TENANT_PROVISIONING_STEP.SEED_CONTENT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
        },
        [TENANT_PROVISIONING_STEP.DEPLOY_STUDIO]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error: 'Vercel deploy failed',
        },
        [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
          status: TENANT_PROVISIONING_STEP_STATUS.IDLE,
        },
        [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: {
          status: TENANT_PROVISIONING_STEP_STATUS.IDLE,
        },
      },
    });
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
      />,
    );

    // No spinner anywhere — the badge text is the sole accessible source now.
    expect(screen.queryAllByRole('status')).toHaveLength(0);

    for (const text of ['Not started', 'Running…', 'Done', 'Failed']) {
      for (const element of screen.getAllByText(text)) {
        expect(element).not.toHaveAttribute('aria-hidden');
      }
    }

    // Every circle glyph is aria-hidden regardless of status — it's purely
    // decorative now that the badge carries the announcement.
    expect(
      screen.getByText('1', { selector: 'span[aria-hidden="true"]' }),
    ).toBeVisible();
    expect(
      screen.getByText('2', { selector: 'span[aria-hidden="true"]' }),
    ).toBeVisible();
    expect(
      screen.getByText('✓', { selector: 'span[aria-hidden="true"]' }),
    ).toBeVisible();
    expect(
      screen.getByText('!', { selector: 'span[aria-hidden="true"]' }),
    ).toBeVisible();
  });

  it('renders the tenant details panel as an editable form while every step is idle', () => {
    const tenant = makeTenant({
      name: 'Acme Inc.',
      slug: 'acme',
      provisioningSteps: idleProvisioningSteps(),
    });
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
      />,
    );

    expect(screen.getByText('Tenant details')).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Slug' })).toHaveValue('acme');
  });

  it('locks every tenant details field while a step is running, stating why', () => {
    const tenant = makeTenant({
      name: 'Acme Inc.',
      slug: 'acme',
      provisioningSteps: {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
        },
      },
    });
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
      />,
    );

    expect(screen.getByText('Tenant details')).toBeVisible();

    const slugInput = screen.getByRole('textbox', { name: 'Slug' });
    expect(slugInput).toHaveValue('acme');
    expect(slugInput).toBeDisabled();
    expect(slugInput).toHaveAccessibleDescription(
      'Locked while provisioning is running.',
    );
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('locks only the field a completed step already consumed once provisioning has FAILED, leaving the field that caused the failure editable', () => {
    // Mirrors the real 409 case: DEPLOY_STUDIO completed (locking slug), but
    // MAP_DOMAIN itself failed — so primaryDomain, the field that actually
    // caused the failure, stays editable.
    const tenant = makeTenant({
      name: 'Acme Inc.',
      slug: 'acme',
      primaryDomain: 'taken-domain.example.com',
      provisioningSteps: {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.SEED_CONTENT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.DEPLOY_STUDIO]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error: 'Vercel deploy failed: 409 domain_already_in_use',
        },
      },
    });
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
      />,
    );

    const slugInput = screen.getByRole('textbox', { name: 'Slug' });
    expect(slugInput).toBeDisabled();
    expect(slugInput).toHaveAccessibleDescription(
      'Locked — the "Deploy the content editor" step has already completed and used this value.',
    );

    const domainInput = screen.getByRole('textbox', {
      name: 'Primary domain',
    });
    expect(domainInput).not.toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Name' })).not.toBeDisabled();
  });

  it('lets the operator correct the failing domain and Retry re-runs provisioning with the new value', async () => {
    const correctedProvisioningSteps = {
      ...idleProvisioningSteps(),
      [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
        status: TENANT_PROVISIONING_STEP_STATUS.DONE,
      },
      [TENANT_PROVISIONING_STEP.SEED_CONTENT]: {
        status: TENANT_PROVISIONING_STEP_STATUS.DONE,
      },
      [TENANT_PROVISIONING_STEP.DEPLOY_STUDIO]: {
        status: TENANT_PROVISIONING_STEP_STATUS.DONE,
      },
      [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: {
        status: TENANT_PROVISIONING_STEP_STATUS.DONE,
      },
      [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
        status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
        error: 'Vercel deploy failed: 409 domain_already_in_use',
      },
    };
    const correctedTenant = makeTenant({
      id: 'tenant-1',
      primaryDomain: 'new-domain.example.com',
      provisioningSteps: correctedProvisioningSteps,
    });
    updateTenantDetailsActionMock.mockResolvedValue({
      ok: true,
      tenant: correctedTenant,
    });
    const user = userEvent.setup();
    const tenant = makeTenant({
      id: 'tenant-1',
      primaryDomain: 'taken-domain.example.com',
      provisioningSteps: correctedProvisioningSteps,
    });
    const { rerender } = render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
      />,
    );

    await user.clear(screen.getByRole('textbox', { name: 'Primary domain' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Primary domain' }),
      'new-domain.example.com',
    );
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({
          primaryDomain: 'new-domain.example.com',
        }),
      );
    });

    // Stands in for `router.refresh()` causing the parent Server Component
    // to re-fetch and pass down the now-persisted tenant — proving the
    // corrected value actually reached the tenant row before Retry runs,
    // rather than merely that Save and Retry were each clicked in order.
    rerender(
      withIntl(
        <ProvisioningStatusView
          tenant={correctedTenant}
          domainVerificationStatus="NOT_CONFIGURED"
          ownerEmail="owner@example.com"
        />,
      ),
    );

    expect(
      await screen.findByRole('textbox', { name: 'Primary domain' }),
    ).toHaveValue('new-domain.example.com');

    await user.click(
      screen.getByRole('button', { name: 'Retry provisioning' }),
    );

    await waitFor(() => {
      expect(retryProvisioningStepActionMock).toHaveBeenCalledWith('tenant-1');
    });
  });

  it('shows a single overall status badge and a single Retry button in the tenant details header for a failed step, with no per-step Retry buttons in the sidebar', () => {
    const tenant = makeTenant({
      provisioningSteps: {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.DEPLOY_STUDIO]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error: 'Vercel deploy failed: build error',
        },
      },
    });
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
      />,
    );

    expect(
      screen.getAllByRole('button', { name: 'Retry provisioning' }),
    ).toHaveLength(1);
    expect(
      within(screen.getByRole('complementary')).queryByRole('button', {
        name: 'Retry provisioning',
      }),
    ).not.toBeInTheDocument();
    // One "Failed" per the DEPLOY_STUDIO step's visually-hidden sidebar
    // announcement, one for the header's single overall status badge.
    expect(screen.getAllByText('Failed')).toHaveLength(2);
  });

  it("no longer renders a step's raw error text inline in the sidebar", () => {
    const tenant = makeTenant({
      provisioningSteps: {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.DEPLOY_STUDIO]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error: 'Vercel deploy failed: build error',
        },
      },
    });
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
      />,
    );

    expect(
      within(screen.getByRole('complementary')).queryByText(
        'Vercel deploy failed: build error',
      ),
    ).not.toBeInTheDocument();
  });

  it('does not render a parsed error card when no step has failed', () => {
    const tenant = makeTenant({ provisioningSteps: idleProvisioningSteps() });
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
      />,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  describe('parsed error at the top of the tenant details panel', () => {
    const renderFailed = (error: string) => {
      const tenant = makeTenant({
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error,
          },
        },
      });
      render(
        <ProvisioningStatusView
          tenant={tenant}
          domainVerificationStatus="NOT_CONFIGURED"
          ownerEmail="owner@example.com"
        />,
      );
    };

    it('maps a 403 permission failure to a friendly headline and next step, with the raw text under Technical details', () => {
      const rawError =
        'Sanity Access API POST /access/project/d8ui85m2/invites failed: 403 {"statusCode":403,"error":"Forbidden","message":"Missing permission to invite administrators."}';
      renderFailed(rawError);

      expect(
        screen.getByRole('heading', {
          name: 'Missing permission to complete this step',
        }),
      ).toBeVisible();
      expect(
        screen.getByText('Grant the missing permission, then retry.'),
      ).toBeVisible();
      expect(screen.getByText('Technical details')).toBeVisible();
      expect(screen.getByText(rawError)).toBeInTheDocument();
    });

    it('maps a 400 duplicate/already-in-use failure to a friendly headline and next step', () => {
      const rawError =
        'Sanity Access API POST /access/project/d8ui85m2/invites failed: 400 {"statusCode":400,"error":"Bad Request","message":"This email is already a member of another project."}';
      renderFailed(rawError);

      expect(
        screen.getByRole('heading', {
          name: 'Already in use by another tenant',
        }),
      ).toBeVisible();
      expect(
        screen.getByText('Resolve the conflict, then retry.'),
      ).toBeVisible();
    });

    it('maps a network/timeout failure to a friendly headline and next step', () => {
      renderFailed('fetch failed');

      expect(
        screen.getByRole('heading', {
          name: "Couldn't reach the provisioning service",
        }),
      ).toBeVisible();
      expect(screen.getByText('Wait a moment, then retry.')).toBeVisible();
    });

    it('falls back to a generic friendly headline and preserved raw text for an unrecognised failure shape', () => {
      const rawError = 'CORS API is down';
      renderFailed(rawError);

      expect(
        screen.getByRole('heading', { name: 'This step failed' }),
      ).toBeVisible();
      expect(
        screen.getByText(
          'Retry, or check the technical details before asking for help.',
        ),
      ).toBeVisible();
      expect(screen.getByText(rawError)).toBeInTheDocument();
    });
  });

  it('re-dispatches the workflow for this tenant when Retry is clicked', async () => {
    const tenant = makeTenant({
      provisioningSteps: {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error: 'Vercel Domains API returned 500',
        },
      },
    });
    const user = userEvent.setup();
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Retry provisioning' }),
    );

    await waitFor(() => {
      expect(retryProvisioningStepActionMock).toHaveBeenCalledWith('tenant-1');
    });
  });

  it('shows the live DNS verification status', () => {
    const tenant = makeTenant();
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="VERIFIED"
        ownerEmail="owner@example.com"
      />,
    );

    const dnsCard = screen.getByRole('heading', {
      name: 'Domain verification',
    }).parentElement as HTMLElement;
    expect(within(dnsCard).getByText('acme.example.com')).toBeVisible();
    expect(within(dnsCard).getByText('Verified')).toBeVisible();
  });

  it('keeps the NOT_CONFIGURED badge short and explains it in adjacent text, without naming env vars', () => {
    const tenant = makeTenant();
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
      />,
    );

    expect(screen.getByText('Unavailable')).toBeVisible();

    const hint = screen.getByText(
      "The Vercel integration isn't configured on this deployment, so domain verification can't run — this isn't specific to this tenant.",
    );
    expect(hint).toBeVisible();
    expect(hint.textContent).not.toMatch(
      /VERCEL_API_TOKEN|VERCEL_WEB_PROJECT_ID/,
    );
  });

  it('shows a Start provisioning action when every step is idle', () => {
    const tenant = makeTenant({ provisioningSteps: idleProvisioningSteps() });
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
      />,
    );

    expect(
      screen.getAllByRole('button', { name: 'Start provisioning' }),
    ).toHaveLength(1);
  });

  it('hides the Start provisioning action once any step has progressed past idle', () => {
    const tenant = makeTenant({
      provisioningSteps: {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
        },
      },
    });
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Start provisioning' }),
    ).not.toBeInTheDocument();
  });

  it('re-dispatches the workflow for this tenant when Start provisioning is clicked', async () => {
    const tenant = makeTenant({ provisioningSteps: idleProvisioningSteps() });
    const user = userEvent.setup();
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Start provisioning' }),
    );

    await waitFor(() => {
      expect(retryProvisioningStepActionMock).toHaveBeenCalledWith('tenant-1');
    });
  });

  it('immediately hides Start, shows the running badge, and locks tenant fields before the dispatch resolves', async () => {
    const tenant = makeTenant({ provisioningSteps: idleProvisioningSteps() });
    let resolveDispatch:
      ((result: { outcome: 'dispatched' }) => void) | undefined;
    retryProvisioningStepActionMock.mockReturnValue(
      new Promise((resolve) => {
        resolveDispatch = resolve;
      }),
    );
    const user = userEvent.setup();
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Start provisioning' }),
    );

    // Still pending — the dispatch promise hasn't resolved yet, but the
    // operator already sees it's running rather than a frozen page.
    expect(
      screen.queryByRole('button', { name: 'Start provisioning' }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText('Running…').length).toBeGreaterThan(0);
    expect(screen.getByRole('textbox', { name: 'Slug' })).toBeDisabled();

    await act(async () => {
      resolveDispatch?.({ outcome: 'dispatched' });
      await Promise.resolve();
    });
  });

  it('shows a distinguishable error and re-enables Start when the dispatch fails, reverting the optimistic running state', async () => {
    const tenant = makeTenant({ provisioningSteps: idleProvisioningSteps() });
    retryProvisioningStepActionMock.mockResolvedValue({
      outcome: 'dispatch-error',
    });
    const user = userEvent.setup();
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Start provisioning' }),
    );

    expect(
      await screen.findByText("Couldn't start provisioning — try again."),
    ).toBeVisible();
    expect(
      await screen.findByRole('button', { name: 'Start provisioning' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Slug' })).not.toBeDisabled();
  });

  it('shows a not-found-specific error when the tenant no longer exists server-side', async () => {
    const tenant = makeTenant({ provisioningSteps: idleProvisioningSteps() });
    retryProvisioningStepActionMock.mockResolvedValue({
      outcome: 'not-found',
    });
    const user = userEvent.setup();
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Start provisioning' }),
    );

    expect(
      await screen.findByText(
        "Couldn't find this tenant — refresh the page and try again.",
      ),
    ).toBeVisible();
  });

  it('treats "already-in-progress" as a no-op — no error shown, dispatch still reported', async () => {
    const tenant = makeTenant({ provisioningSteps: idleProvisioningSteps() });
    retryProvisioningStepActionMock.mockResolvedValue({
      outcome: 'already-in-progress',
    });
    const user = userEvent.setup();
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Start provisioning' }),
    );

    await waitFor(() => {
      expect(retryProvisioningStepActionMock).toHaveBeenCalledWith('tenant-1');
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a Go to tenant button linking to the tenant admin area once provisioning is READY', () => {
    const tenant = makeTenant({
      slug: 'acme',
      provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
    });
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
      />,
    );

    expect(
      screen.getByRole('link', { name: 'Go to tenant →' }),
    ).toHaveAttribute('href', '/t/acme');
  });

  it('hides the Go to tenant button before provisioning reaches READY', () => {
    const tenant = makeTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
    });
    render(
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
      />,
    );

    expect(
      screen.queryByRole('link', { name: 'Go to tenant →' }),
    ).not.toBeInTheDocument();
  });

  describe('live polling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('polls for fresh status while provisioning is not terminal, and re-renders on a new result', async () => {
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
        },
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
          },
        },
      });
      render(
        <ProvisioningStatusView
          tenant={tenant}
          domainVerificationStatus="NOT_CONFIGURED"
          ownerEmail="owner@example.com"
        />,
      );

      const sidebar = screen.getByRole('complementary');
      expect(within(sidebar).getByText('Running…')).toBeVisible();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });

      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledWith(
        'tenant-1',
      );
      expect(within(sidebar).getByText('Done')).toBeVisible();
      expect(within(sidebar).queryByText('Running…')).not.toBeInTheDocument();
    });

    it('announces a polled step-status transition through a stable aria-live region', async () => {
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
        },
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
          },
        },
      });
      render(
        <ProvisioningStatusView
          tenant={tenant}
          domainVerificationStatus="NOT_CONFIGURED"
          ownerEmail="owner@example.com"
        />,
      );

      const sidebar = screen.getByRole('complementary');
      const liveRegionBefore = within(sidebar)
        .getByText('Running…')
        .closest('[aria-live="polite"]');
      expect(liveRegionBefore).not.toBeNull();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });

      // The new status text is announced by the same live region — not a
      // freshly mounted one, which some screen readers announce on mount
      // regardless of content, defeating the point of a targeted update.
      const liveRegionAfter = within(sidebar)
        .getByText('Done')
        .closest('[aria-live="polite"]');
      expect(liveRegionAfter).toBe(liveRegionBefore);
    });

    it('stops polling once the tenant reaches a terminal status', async () => {
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
        provisioningSteps: idleProvisioningSteps(),
      });
      render(
        <ProvisioningStatusView
          tenant={tenant}
          domainVerificationStatus="NOT_CONFIGURED"
          ownerEmail="owner@example.com"
        />,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
      });

      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(1);
    });

    it('does not poll at all when the tenant is already at a terminal status', async () => {
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
      });
      render(
        <ProvisioningStatusView
          tenant={tenant}
          domainVerificationStatus="NOT_CONFIGURED"
          ownerEmail="owner@example.com"
        />,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
      });

      expect(getTenantProvisioningStatusActionMock).not.toHaveBeenCalled();
    });

    it('stops polling once an early step fails with nothing else running, even though provisioningStatus stays non-terminal', async () => {
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
        },
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        // `provisioningStatus` only ever settles on the *last* step, so a
        // step 1 failure genuinely leaves it non-terminal — this is the bug
        // this test guards against regressing.
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: 'fetch failed',
          },
        },
      });
      render(
        <ProvisioningStatusView
          tenant={tenant}
          domainVerificationStatus="NOT_CONFIGURED"
          ownerEmail="owner@example.com"
        />,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 3);
      });

      // No further calls — the action is not called again once the failure
      // with nothing running has been observed.
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(1);
    });

    it('keeps polling, unchanged, while a step is RUNNING', async () => {
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
        },
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
        },
      });
      render(
        <ProvisioningStatusView
          tenant={tenant}
          domainVerificationStatus="NOT_CONFIGURED"
          ownerEmail="owner@example.com"
        />,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 3);
      });

      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(3);
    });

    it('keeps polling across a Retry even when the first post-retry tick still reflects the pre-retry snapshot', async () => {
      const failedSteps = {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error: 'fetch failed',
        },
      };
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        provisioningSteps: failedSteps,
      });
      render(
        <ProvisioningStatusView
          tenant={tenant}
          domainVerificationStatus="NOT_CONFIGURED"
          ownerEmail="owner@example.com"
        />,
      );

      // Confirm it's genuinely stopped on mount — a step already failed with
      // nothing running must never schedule a poll in the first place.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
      });
      expect(getTenantProvisioningStatusActionMock).not.toHaveBeenCalled();

      // A real GitHub Actions dispatch only acknowledges GitHub's receipt of
      // the request — it does not wait for a runner to actually pick up the
      // job, which routinely takes longer than one poll interval. Model
      // that: the very next tick after Retry still reports the exact same
      // failed-and-nothing-running snapshot as before the click.
      getTenantProvisioningStatusActionMock.mockResolvedValueOnce({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        provisioningSteps: failedSteps,
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
        },
      });

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: 'Retry provisioning' }),
        );
      });

      // First tick after Retry: still the stale, unchanged snapshot.
      // Polling must NOT stop on this — it hasn't yet observed the retry
      // taking effect.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(1);

      // Second tick: the retried workflow has now actually started —
      // polling picks up the change.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(2);
      const sidebar = screen.getByRole('complementary');
      expect(within(sidebar).getByText('Running…')).toBeVisible();
    });

    it('stops polling once the retry-baseline wait is exhausted, even though the fetched steps never change', async () => {
      const failedSteps = {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error: 'fetch failed',
        },
      };
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        provisioningSteps: failedSteps,
      });
      // Models a retry whose dispatched workflow never actually starts —
      // every tick reports the exact same failed-and-nothing-running
      // snapshot forever.
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        provisioningSteps: failedSteps,
      });
      render(
        <ProvisioningStatusView
          tenant={tenant}
          domainVerificationStatus="NOT_CONFIGURED"
          ownerEmail="owner@example.com"
        />,
      );

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: 'Retry provisioning' }),
        );
      });

      // Advance well past the cap, one tick's worth of real time at a time
      // (rather than in a single large jump) so each tick's resulting state
      // change — including the interval being torn down once the cap
      // fires — is actually committed before the next tick is simulated.
      for (let tick = 0; tick < RETRY_BASELINE_MAX_TICKS + 5; tick += 1) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
        });
      }

      // Polling must have stopped once the cap was reached — it never grew
      // past that regardless of how much further time was simulated.
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(
        RETRY_BASELINE_MAX_TICKS,
      );
    });

    it('clears the retry baseline as soon as a real transition arrives, without waiting for the cap', async () => {
      const failedSteps = {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error: 'fetch failed',
        },
      };
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        provisioningSteps: failedSteps,
      });
      render(
        <ProvisioningStatusView
          tenant={tenant}
          domainVerificationStatus="NOT_CONFIGURED"
          ownerEmail="owner@example.com"
        />,
      );

      // A handful of stale ticks first — still well short of the cap — then
      // the workflow genuinely starts.
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        provisioningSteps: failedSteps,
      });

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: 'Retry provisioning' }),
        );
      });

      for (let tick = 0; tick < 3; tick += 1) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
        });
      }
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(3);

      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
        },
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });

      const sidebar = screen.getByRole('complementary');
      expect(within(sidebar).getByText('Running…')).toBeVisible();

      // Polling keeps going normally past the transition — it wasn't
      // waiting on the cap to notice the change.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
      });
      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(6);
    });

    it('stops polling once the component unmounts', async () => {
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      });
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: idleProvisioningSteps(),
      });
      const { unmount } = render(
        <ProvisioningStatusView
          tenant={tenant}
          domainVerificationStatus="NOT_CONFIGURED"
          ownerEmail="owner@example.com"
        />,
      );

      unmount();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * 2);
      });

      expect(getTenantProvisioningStatusActionMock).not.toHaveBeenCalled();
    });

    it('surfaces a stalled-poll indicator, keeps the last-known state visible, and keeps retrying when a poll tick rejects', async () => {
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
        },
      });
      getTenantProvisioningStatusActionMock.mockRejectedValueOnce(
        new Error('NEXT_REDIRECT'),
      );
      render(
        <ProvisioningStatusView
          tenant={tenant}
          domainVerificationStatus="NOT_CONFIGURED"
          ownerEmail="owner@example.com"
        />,
      );

      const sidebar = screen.getByRole('complementary');
      expect(within(sidebar).getByText('Running…')).toBeVisible();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });

      // Last-known state stays visible — a rejected tick never clears it.
      expect(within(sidebar).getByText('Running…')).toBeVisible();
      expect(
        screen.getByText(
          "Couldn't refresh the latest status — retrying automatically.",
        ),
      ).toBeVisible();

      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
          },
        },
      });

      // The interval never stopped — the very next tick succeeds on its own.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });

      expect(
        screen.queryByText(
          "Couldn't refresh the latest status — retrying automatically.",
        ),
      ).not.toBeInTheDocument();
      expect(within(sidebar).getByText('Done')).toBeVisible();
    });
  });

  describe('domain verification polling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('polls for fresh domain verification status on its own interval, and re-renders on a new result', async () => {
      const tenant = makeTenant({ primaryDomain: 'acme.example.com' });
      getDomainVerificationStatusActionMock.mockResolvedValue('VERIFIED');
      render(
        <ProvisioningStatusView
          tenant={tenant}
          domainVerificationStatus="PENDING"
          ownerEmail="owner@example.com"
        />,
      );

      expect(screen.getByText('Pending — awaiting DNS')).toBeVisible();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(DOMAIN_POLL_INTERVAL_MS);
      });

      expect(getDomainVerificationStatusActionMock).toHaveBeenCalledWith(
        tenant.id,
      );
      expect(screen.getByText('Verified')).toBeVisible();
    });

    it('announces a polled DNS-status transition through a stable aria-live region', async () => {
      const tenant = makeTenant({ primaryDomain: 'acme.example.com' });
      getDomainVerificationStatusActionMock.mockResolvedValue('VERIFIED');
      render(
        <ProvisioningStatusView
          tenant={tenant}
          domainVerificationStatus="PENDING"
          ownerEmail="owner@example.com"
        />,
      );

      const liveRegionBefore = screen
        .getByText('Pending — awaiting DNS')
        .closest('[aria-live="polite"]');
      expect(liveRegionBefore).not.toBeNull();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(DOMAIN_POLL_INTERVAL_MS);
      });

      const liveRegionAfter = screen
        .getByText('Verified')
        .closest('[aria-live="polite"]');
      expect(liveRegionAfter).toBe(liveRegionBefore);
    });

    it('stops polling the domain once it reaches VERIFIED', async () => {
      const tenant = makeTenant();
      getDomainVerificationStatusActionMock.mockResolvedValue('VERIFIED');
      render(
        <ProvisioningStatusView
          tenant={tenant}
          domainVerificationStatus="PENDING"
          ownerEmail="owner@example.com"
        />,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(DOMAIN_POLL_INTERVAL_MS);
      });
      expect(getDomainVerificationStatusActionMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(DOMAIN_POLL_INTERVAL_MS * 2);
      });
      expect(getDomainVerificationStatusActionMock).toHaveBeenCalledTimes(1);
    });

    it('does not poll the domain at all when it is already NOT_CONFIGURED', async () => {
      const tenant = makeTenant();
      render(
        <ProvisioningStatusView
          tenant={tenant}
          domainVerificationStatus="NOT_CONFIGURED"
          ownerEmail="owner@example.com"
        />,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(DOMAIN_POLL_INTERVAL_MS * 2);
      });

      expect(getDomainVerificationStatusActionMock).not.toHaveBeenCalled();
    });

    it('keeps polling the domain after provisioning itself reaches a terminal status', async () => {
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
      });
      getDomainVerificationStatusActionMock.mockResolvedValue('PENDING');
      render(
        <ProvisioningStatusView
          tenant={tenant}
          domainVerificationStatus="PENDING"
          ownerEmail="owner@example.com"
        />,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(DOMAIN_POLL_INTERVAL_MS);
      });

      expect(getDomainVerificationStatusActionMock).toHaveBeenCalledWith(
        tenant.id,
      );
      // Step polling never starts — provisioning was already terminal — so
      // this is genuinely the domain check running on its own.
      expect(getTenantProvisioningStatusActionMock).not.toHaveBeenCalled();
    });

    it('never delays step polling behind a slow or hanging domain check', async () => {
      const tenant = makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      });
      getDomainVerificationStatusActionMock.mockImplementation(
        () => new Promise(() => {}),
      );
      getTenantProvisioningStatusActionMock.mockResolvedValue({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: idleProvisioningSteps(),
      });
      render(
        <ProvisioningStatusView
          tenant={tenant}
          domainVerificationStatus="PENDING"
          ownerEmail="owner@example.com"
        />,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });

      expect(getTenantProvisioningStatusActionMock).toHaveBeenCalledTimes(1);
    });
  });
});
