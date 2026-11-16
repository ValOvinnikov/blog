import type { THttpStatus } from '@shinefold/config/constants';
import { NextResponse } from 'next/server';

export const respondEmpty = (status: THttpStatus): NextResponse =>
  new NextResponse(null, { status });
