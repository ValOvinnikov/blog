import { HTTP_STATUS } from '@shinefold/config';
import { CACHE_CONTROL, CACHE_CONTROL_HEADER } from '@web/constants/http';
import { NextResponse } from 'next/server';

// Uptime checks hit this instead of a page so Neon's compute can idle-suspend between them.
export function GET(): NextResponse {
  return new NextResponse(null, {
    status: HTTP_STATUS.OK,
    headers: { [CACHE_CONTROL_HEADER]: CACHE_CONTROL.PRIVATE_NO_STORE },
  });
}
