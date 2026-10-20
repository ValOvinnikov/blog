import { SANITY_API_PATH } from '@blog/db/utils/sanity-management-client/sanity-api-paths';
import { sanityManagementRequest } from '@blog/db/utils/sanity-management-client/sanity-api-request';

export type TSanityProject = { id: string };

export async function createSanityProject(input: {
  token: string;
  displayName: string;
  organizationId: string;
}): Promise<TSanityProject> {
  return sanityManagementRequest<TSanityProject>(
    SANITY_API_PATH.projects(),
    input.token,
    {
      method: 'POST',
      body: JSON.stringify({
        displayName: input.displayName,
        organizationId: input.organizationId,
      }),
    },
  );
}

export async function createSanityDataset(input: {
  token: string;
  projectId: string;
  dataset: string;
}): Promise<void> {
  await sanityManagementRequest(
    SANITY_API_PATH.projectDataset(input.projectId, input.dataset),
    input.token,
    { method: 'PUT', body: JSON.stringify({ aclMode: 'public' }) },
  );
}

export type TSanityDataset = { name: string };

export async function listSanityDatasets(input: {
  token: string;
  projectId: string;
}): Promise<TSanityDataset[]> {
  return sanityManagementRequest<TSanityDataset[]>(
    SANITY_API_PATH.projectDatasets(input.projectId),
    input.token,
  );
}

export async function addSanityCorsOrigin(input: {
  token: string;
  projectId: string;
  origin: string;
  allowCredentials?: boolean;
}): Promise<void> {
  await sanityManagementRequest(
    SANITY_API_PATH.projectCors(input.projectId),
    input.token,
    {
      method: 'POST',
      body: JSON.stringify({
        origin: input.origin,
        allowCredentials: input.allowCredentials ?? false,
      }),
    },
  );
}

export type TSanityCorsOrigin = { id: string; origin: string };

export async function listSanityCorsOrigins(input: {
  token: string;
  projectId: string;
}): Promise<TSanityCorsOrigin[]> {
  return sanityManagementRequest<TSanityCorsOrigin[]>(
    SANITY_API_PATH.projectCors(input.projectId),
    input.token,
  );
}
