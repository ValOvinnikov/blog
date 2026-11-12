import { HTTP_STATUS } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { readInternalPageRequest } from '@web/server/internal-pages/read-internal-page-request/read-internal-page-request';
import {
  MOCK_INTERNAL_PAGE_ID,
  MOCK_INTERNAL_PAGE_REQUEST,
  mockInternalPageRouteContext,
} from '@web/testing/server/internal-pages/fixtures';
import { mockTenantSanityCredentials } from '@web/testing/server/tenant/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { respondToInternalPageRequest } from './respond-to-internal-page-request';

const readInternalPageRequestMock = vi.mocked(readInternalPageRequest);

vi.mock(
  '@web/server/internal-pages/read-internal-page-request/read-internal-page-request',
);

faker.seed(7183);

const MOCK_BODY = { tenantId: MOCK_TENANT_ID };
const MOCK_CREDENTIALS = mockTenantSanityCredentials();
const MOCK_RESPONSE = NextResponse.json({});
const bodySchema = z.object({ tenantId: z.uuid() });
const respondMock = vi.fn();

const callHelper = () =>
  respondToInternalPageRequest(
    MOCK_INTERNAL_PAGE_REQUEST,
    mockInternalPageRouteContext(),
    bodySchema,
    respondMock,
  );

describe(respondToInternalPageRequest, () => {
  beforeEach(() => {
    respondMock.mockResolvedValue(MOCK_RESPONSE);
  });

  it("answers with the route's response for the page", async () => {
    expect(await callHelper()).toBe(MOCK_RESPONSE);
    expect(readInternalPageRequestMock).toHaveBeenCalledExactlyOnceWith(
      MOCK_INTERNAL_PAGE_REQUEST,
      bodySchema,
    );
    expect(respondMock).toHaveBeenCalledExactlyOnceWith({
      id: MOCK_INTERNAL_PAGE_ID,
      body: MOCK_BODY,
      tenant: MOCK_CREDENTIALS,
    });
  });

  it('answers a refused request without reading the page', async () => {
    readInternalPageRequestMock.mockResolvedValue({
      refusal: new NextResponse(null, { status: HTTP_STATUS.UNAUTHORIZED }),
    });

    expect((await callHelper()).status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(respondMock).not.toHaveBeenCalled();
  });
});
