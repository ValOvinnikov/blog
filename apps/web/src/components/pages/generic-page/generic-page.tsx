import type { ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { ModuleRenderer } from '@web/modules/module-renderer';
import { notFound } from 'next/navigation';

import { genericPageVariants } from './generic-page-variants';

type TGenericPageProps = ILocalizedParams & { slug: string };

/**
 * GenericPage — `/{slug}` composition for standalone `page_generic`
 * documents: fetches the page via `service.pages.generic.v1.getPage`, then
 * renders its `modules[]` through the shared `ModuleRenderer` inside the
 * common page shell. `Header`/`Footer` stay owned by `[locale]/layout.tsx`.
 */
export async function GenericPage({ slug, locale }: TGenericPageProps) {
  const result = await service.pages.generic.v1.getPage(slug);

  if (!result.ok) {
    notFound();
  }

  const { modules } = result.data;

  return (
    <main className={genericPageVariants()}>
      <ModuleRenderer modules={modules} locale={locale} />
    </main>
  );
}
