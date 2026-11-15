import type { ITenantLocalizedParams } from '@shinefold/config';
import { CookieStatementPage } from '@web/components/pages/cookie-statement-page';
import { buildCookieStatementMetadata } from '@web/metadata/cookie-statement-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<ITenantLocalizedParams>;
};

export const revalidate = 86400;

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  await enterRequestContext(params);
  return buildCookieStatementMetadata();
}

export default async function CookieStatementRoute({ params }: TProps) {
  await enterRequestContext(params);

  return <CookieStatementPage />;
}
