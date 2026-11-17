import { NextResponse } from 'next/server';

export const skimResponse = (message: string, status: number): NextResponse =>
  NextResponse.json({ message }, { status });
