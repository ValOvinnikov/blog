import { HTTP_STATUS, isLegalPageKind, LEGAL_PAGE_KIND } from '@blog/config';
import { service } from '@blog/service';
import { SECTION_DOCUMENT_LOG } from '@web/constants/section-document';
import { SINGLE_LANGUAGE_ROUTING } from '@web/i18n/routing';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { getHostTenantSanityContext } from '@web/server/tenant/tenant-sanity-context/tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';
import { privateRedirect } from '@web/utils/private-redirect';
import { NextResponse } from 'next/server';

type TProps = { params: Promise<{ kind: string }> };

const notFoundResponse = () =>
  new NextResponse(null, { status: HTTP_STATUS.NOT_FOUND });

export async function GET(
  request: Request,
  { params }: TProps,
): Promise<NextResponse> {
  const { kind } = await params;
  if (!isLegalPageKind(kind) || kind === LEGAL_PAGE_KIND.OTHER) {
    return notFoundResponse();
  }

  const hostTenant = await getHostTenantSanityContext();
  if (!hostTenant.isResolvable) return notFoundResponse();

  const defaultLocale =
    (await resolveRequestTenant())?.locale ??
    SINGLE_LANGUAGE_ROUTING.defaultLocale;
  const result =
    await service.pages.sectionDocument.v1.getSectionDocumentByKind(kind, {
      ...hostTenant.tenant,
      locale: defaultLocale,
      defaultLocale,
    });

  if (!result.ok) {
    logger.error(SECTION_DOCUMENT_LOG.BY_KIND_FETCH_FAILED, {
      kind,
      error: result.error,
    });
    return new NextResponse(null, {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
  if (!result.data) return notFoundResponse();

  return privateRedirect(new URL(result.data.href, request.url));
}
