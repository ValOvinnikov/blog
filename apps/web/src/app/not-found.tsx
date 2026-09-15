import { StandaloneNotFoundPage } from '@web/components/pages/standalone-not-found-page';
import { buildNotFoundMetadata } from '@web/metadata/not-found-metadata';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return buildNotFoundMetadata();
}

/** The root-level not-found boundary — resolves no tenant and must never call `headers()`. */
export default async function NotFound() {
  return await StandaloneNotFoundPage();
}
