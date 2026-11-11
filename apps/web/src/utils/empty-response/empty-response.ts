import type { THttpStatus } from '@blog/config/constants';
import { NextResponse } from 'next/server';

export const respondEmpty = (status: THttpStatus): NextResponse =>
  new NextResponse(null, { status });
