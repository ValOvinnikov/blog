import {
  SANITY_API_SURFACE,
  SANITY_PROJECT_ARCHIVE_OUTCOME,
  SANITY_PROJECT_DELETE_OUTCOME,
  SANITY_PROJECT_TOGGLE_RESULT,
  SANITY_PROJECT_UNARCHIVE_OUTCOME,
  type TOutcome,
  type TSanityProjectArchiveOutcome,
  type TSanityProjectDeleteOutcome,
  type TSanityProjectToggleResult,
  type TSanityProjectUnarchiveOutcome,
} from '@blog/config';
import { SANITY_API_PATH } from '@blog/db/utils/sanity-management-client/sanity-api-paths';
import {
  sanityApiError,
  sanityManagementRequest,
  sanityManagementResponse,
} from '@blog/db/utils/sanity-management-client/sanity-api-request';
import { toOutcome } from '@blog/utils/to-outcome';

const BILLING_PERMISSION_TEXT = 'billing permission';
const HTTP_NOT_FOUND = 404;
const HTTP_UNAUTHORIZED = 401;

export type TSanityDeleteResult = TOutcome<TSanityProjectDeleteOutcome>;

export async function deleteSanityProject(input: {
  token: string;
  projectId: string;
}): Promise<TSanityDeleteResult> {
  const path = SANITY_API_PATH.project(input.projectId);
  const response = await sanityManagementResponse(
    path,
    input.token,
    { method: 'DELETE' },
    [HTTP_NOT_FOUND, HTTP_UNAUTHORIZED],
  );

  if (response.status === HTTP_NOT_FOUND) {
    return toOutcome(SANITY_PROJECT_DELETE_OUTCOME.ALREADY_GONE);
  }

  if (response.status === HTTP_UNAUTHORIZED) {
    const body = await response.text().catch(() => '');
    if (body.toLowerCase().includes(BILLING_PERMISSION_TEXT)) {
      return toOutcome(
        SANITY_PROJECT_DELETE_OUTCOME.BLOCKED_BY_BILLING_PERMISSION,
      );
    }
    throw sanityApiError(
      SANITY_API_SURFACE.MANAGEMENT,
      'DELETE',
      path,
      response,
      body,
    );
  }

  return toOutcome(SANITY_PROJECT_DELETE_OUTCOME.DELETED);
}

async function setSanityProjectDisabledByUser(input: {
  token: string;
  projectId: string;
  disabled: boolean;
}): Promise<TSanityProjectToggleResult> {
  const path = SANITY_API_PATH.project(input.projectId);
  const getResponse = await sanityManagementResponse(path, input.token, {}, [
    HTTP_NOT_FOUND,
  ]);

  if (getResponse.status === HTTP_NOT_FOUND) {
    return SANITY_PROJECT_TOGGLE_RESULT.ALREADY_GONE;
  }

  const project = (await getResponse.json()) as { isDisabledByUser?: boolean };
  if (Boolean(project.isDisabledByUser) === input.disabled) {
    return SANITY_PROJECT_TOGGLE_RESULT.ALREADY_IN_STATE;
  }

  await sanityManagementRequest(path, input.token, {
    method: 'PATCH',
    body: JSON.stringify({ isDisabledByUser: input.disabled }),
  });

  return SANITY_PROJECT_TOGGLE_RESULT.CHANGED;
}

export type TSanityArchiveResult = TOutcome<TSanityProjectArchiveOutcome>;

export async function archiveSanityProject(input: {
  token: string;
  projectId: string;
}): Promise<TSanityArchiveResult> {
  const result = await setSanityProjectDisabledByUser({
    ...input,
    disabled: true,
  });

  if (result === SANITY_PROJECT_TOGGLE_RESULT.ALREADY_GONE) {
    return toOutcome(SANITY_PROJECT_ARCHIVE_OUTCOME.ALREADY_GONE);
  }
  if (result === SANITY_PROJECT_TOGGLE_RESULT.ALREADY_IN_STATE) {
    return toOutcome(SANITY_PROJECT_ARCHIVE_OUTCOME.ALREADY_ARCHIVED);
  }
  return toOutcome(SANITY_PROJECT_ARCHIVE_OUTCOME.ARCHIVED);
}

export type TSanityUnarchiveResult = TOutcome<TSanityProjectUnarchiveOutcome>;

export async function unarchiveSanityProject(input: {
  token: string;
  projectId: string;
}): Promise<TSanityUnarchiveResult> {
  const result = await setSanityProjectDisabledByUser({
    ...input,
    disabled: false,
  });

  if (result === SANITY_PROJECT_TOGGLE_RESULT.ALREADY_GONE) {
    return toOutcome(SANITY_PROJECT_UNARCHIVE_OUTCOME.ALREADY_GONE);
  }
  if (result === SANITY_PROJECT_TOGGLE_RESULT.ALREADY_IN_STATE) {
    return toOutcome(SANITY_PROJECT_UNARCHIVE_OUTCOME.ALREADY_ACTIVE);
  }
  return toOutcome(SANITY_PROJECT_UNARCHIVE_OUTCOME.UNARCHIVED);
}
