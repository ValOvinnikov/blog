import {
  MODULE_PAGE_CONTEXT,
  routes,
  type ILocalizedParams,
} from '@blog/config';
import { service } from '@blog/service';
import { Heading } from '@blog/ui/atoms/heading';
import {
  Breadcrumbs,
  type IBreadcrumbItem,
} from '@blog/ui/molecules/breadcrumbs';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { ModuleRenderer } from '@web/modules/module-renderer';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { env } from '@web/utils/env/env';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { genericPageVariants } from './generic-page-variants';

type TGenericPageProps = ILocalizedParams & { slug: string };

const s = genericPageVariants();

/**
 * GenericPage — `/{slug}` composition for standalone `page_generic`
 * documents: fetches the page via `service.pages.generic.v1.getPage`,
 * renders a `Home › {title}` `Breadcrumbs` trail (plus its `BreadcrumbList`
 * JSON-LD) inside a `BreadcrumbBar` sibling before `<main>`, then its own
 * `title` as the page's `<h1>` — `page_generic` documents allow only
 * `module_content`/`module_cta` modules, neither of which renders a heading
 * of its own, so this page-level `<h1>` is the only heading guaranteed to
 * exist — before rendering `modules[]` through the shared `ModuleRenderer`.
 * Each module owns its own full-bleed background/width via `Section`, so
 * `<main>` here is otherwise an unconstrained root. `Header`/`Footer` stay
 * owned by `[locale]/layout.tsx`.
 */
export const GenericPage = async ({ slug, locale }: TGenericPageProps) => {
  const [result, breadcrumbsT] = await Promise.all([
    service.pages.generic.v1.getPage(slug),
    getTranslations('breadcrumbs'),
  ]);

  if (!result.ok) {
    notFound();
  }

  const { title, modules } = result.data;

  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? '';
  const trail: IBreadcrumbItem[] = [
    { label: breadcrumbsT('home'), href: routes.home() },
    { label: title, href: routes.genericPage(slug) },
  ];
  const breadcrumbListSchema = buildBreadcrumbListSchema(trail, siteUrl);

  return (
    <>
      {breadcrumbListSchema && <JsonLd schema={breadcrumbListSchema} />}

      <BreadcrumbBar>
        <Breadcrumbs
          items={trail}
          ariaLabel={breadcrumbsT('ariaLabel')}
          linkAs={SmartLink}
        />
      </BreadcrumbBar>

      <main className={s.root()}>
        <Heading level={1} visual="section" className={s.heading()}>
          {title}
        </Heading>
        <ModuleRenderer
          modules={modules}
          locale={locale}
          context={{ type: MODULE_PAGE_CONTEXT.GENERIC, isPaginated: false }}
        />
      </main>
    </>
  );
};
