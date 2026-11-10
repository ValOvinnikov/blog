import type { TMaybeNull } from '@blog/config';
import { getTenantSanityCredentials } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  listSanityWebhooks,
  type TSanityWebhook,
} from '@blog/db/utils/sanity-management-client/sanity-webhooks';
import { hasLength } from '@blog/utils/primitives';
import { createClient } from '@sanity/client';
import { SANITY_API_VERSION } from '@worker/constants/sanity-api';
import { grantPropagationRetryOptions } from '@worker/utils/grant-propagation-retry/grant-propagation-retry';
import { assertHomeMetaTitleLength } from '@worker/utils/home-meta-title-length/home-meta-title-length';
import type { TProvisionEnv } from '@worker/utils/provision-env/provision-env';
import {
  retryWithBackoff,
  type TRetryWithBackoffOptions,
} from '@worker/utils/retry-with-backoff/retry-with-backoff';
import { requireTenantManagementToken } from '@worker/utils/tenant-management-token/tenant-management-token';
import {
  listVercelProjectDomains,
  type TVercelDomain,
} from '@worker/utils/vercel-client/vercel-client';

import { revalidateWebhookUrl } from './create-revalidate-webhook';

const REQUIRED_SINGLETON_TYPES = [
  'settings_site',
  'settings_navigation',
  'settings_footer',
] as const;

export type TVerifyTenantSeededContentDeps = {
  createClient: typeof createClient;
  getCredentials: typeof getTenantSanityCredentials;
  listWebhooks: typeof listSanityWebhooks;
  listDomains: typeof listVercelProjectDomains;
  sleep: (ms: number) => Promise<void>;
};

const defaultDeps: TVerifyTenantSeededContentDeps = {
  createClient,
  getCredentials: getTenantSanityCredentials,
  listWebhooks: listSanityWebhooks,
  listDomains: listVercelProjectDomains,
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

async function readWithGrantPropagationRetry<T>(
  read: () => Promise<T>,
  retryOptions: TRetryWithBackoffOptions,
  wrapError: (error: unknown) => Error,
): Promise<T> {
  try {
    return await retryWithBackoff(read, retryOptions);
  } catch (error) {
    throw wrapError(error);
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

type THomePageParseFields = TMaybeNull<{
  headingBlock: TMaybeNull<{ heading?: TMaybeNull<string> }>;
  seo: TMaybeNull<{ metaTitle?: TMaybeNull<string> }>;
}>;

type TNavigationItemLinkCheck = {
  resolved: boolean;
};

// Reads right after a write in the same run retry, so propagation lag is never mistaken for absence.
export async function verifyTenantSeededContent(
  tenant: TTenant,
  env: TProvisionEnv,
  deps: TVerifyTenantSeededContentDeps = defaultDeps,
): Promise<void> {
  const credentials = await deps.getCredentials(tenant.id);

  if (!credentials) {
    throw new Error(
      `verifyTenantSeededContent: tenant "${tenant.id}" has no persisted Sanity read token yet — run the "Persist Sanity token" step first.`,
    );
  }

  const client = deps.createClient({
    projectId: credentials.projectId,
    dataset: credentials.dataset,
    token: credentials.token,
    apiVersion: SANITY_API_VERSION,
    useCdn: false,
  });

  const retryOptions = grantPropagationRetryOptions(deps.sleep);

  const foundTypes = await readWithGrantPropagationRetry(
    () =>
      client.fetch<string[]>('*[_type in $types]._type', {
        types: REQUIRED_SINGLETON_TYPES,
      }),
    retryOptions,
    (error) =>
      new Error(
        `verifyTenantSeededContent: tenant "${tenant.id}"'s persisted Sanity read token failed against its dataset: ${errorMessage(error)}`,
        { cause: error },
      ),
  );

  const missingTypes = REQUIRED_SINGLETON_TYPES.filter(
    (type) => !foundTypes.includes(type),
  );

  if (hasLength(missingTypes)) {
    throw new Error(
      `verifyTenantSeededContent: tenant "${tenant.id}"'s dataset is missing required starter document(s): ${missingTypes.join(', ')}.`,
    );
  }

  const navigationItems = await readWithGrantPropagationRetry<
    TMaybeNull<TNavigationItemLinkCheck[]>
  >(
    () =>
      client.fetch<TMaybeNull<TNavigationItemLinkCheck[]>>(
        '*[_type == "settings_navigation"][0].items[]{ "resolved": defined(link->_id) }',
      ),
    retryOptions,
    (error) =>
      new Error(
        `verifyTenantSeededContent: tenant "${tenant.id}"'s "settings_navigation" items read failed: ${errorMessage(error)}`,
        { cause: error },
      ),
  );

  const unresolvedNavigationItemCount = (navigationItems ?? []).filter(
    (item) => !item.resolved,
  ).length;

  if (unresolvedNavigationItemCount > 0) {
    throw new Error(
      `verifyTenantSeededContent: tenant "${tenant.id}"'s "settings_navigation" has ${unresolvedNavigationItemCount} item(s) with no resolvable "link" reference — re-run the "Seed content" step.`,
    );
  }

  const homePage = await readWithGrantPropagationRetry<THomePageParseFields>(
    () =>
      client.fetch<THomePageParseFields>(
        '*[_type == "page_home"][0]{ headingBlock, seo }',
      ),
    retryOptions,
    (error) =>
      new Error(
        `verifyTenantSeededContent: tenant "${tenant.id}"'s "page_home" read failed: ${errorMessage(error)}`,
        { cause: error },
      ),
  );

  if (!homePage) {
    throw new Error(
      `verifyTenantSeededContent: tenant "${tenant.id}"'s dataset has no "page_home" document — re-run the "Seed content" step.`,
    );
  }

  if (!homePage.headingBlock?.heading) {
    throw new Error(
      `verifyTenantSeededContent: tenant "${tenant.id}"'s "page_home" is missing a non-empty headingBlock.heading, which the home page's render query requires — re-run the "Seed content" step.`,
    );
  }

  if (!homePage.seo?.metaTitle) {
    throw new Error(
      `verifyTenantSeededContent: tenant "${tenant.id}"'s "page_home" is missing a non-empty seo.metaTitle, which the home page's render query requires — re-run the "Seed content" step.`,
    );
  }

  assertHomeMetaTitleLength(tenant.id, homePage.seo.metaTitle);

  const managementToken = await requireTenantManagementToken(tenant.id);
  const webhooks = await readWithGrantPropagationRetry<TSanityWebhook[]>(
    () =>
      deps.listWebhooks({
        token: managementToken,
        projectId: credentials.projectId,
      }),
    retryOptions,
    (error) =>
      new Error(
        `verifyTenantSeededContent: tenant "${tenant.id}"'s revalidate webhook check against its Sanity project failed: ${errorMessage(error)}`,
        { cause: error },
      ),
  );

  const expectedWebhookUrl = revalidateWebhookUrl(env.webAppBaseUrl);
  if (!webhooks.some((webhook) => webhook.url === expectedWebhookUrl)) {
    throw new Error(
      `verifyTenantSeededContent: tenant "${tenant.id}" has no revalidate webhook targeting "${expectedWebhookUrl}" on its Sanity project.`,
    );
  }

  const domains = await readWithGrantPropagationRetry<TVercelDomain[]>(
    () =>
      deps.listDomains({
        token: env.vercelToken,
        teamId: env.vercelTeamId,
        projectId: env.vercelWebProjectId,
      }),
    retryOptions,
    (error) =>
      new Error(
        `verifyTenantSeededContent: tenant "${tenant.id}"'s domain mapping check against the shared Vercel project failed: ${errorMessage(error)}`,
        { cause: error },
      ),
  );

  if (!domains.some((domain) => domain.name === tenant.primaryDomain)) {
    throw new Error(
      `verifyTenantSeededContent: tenant "${tenant.id}"'s domain "${tenant.primaryDomain}" is not mapped on the shared Vercel project.`,
    );
  }
}
