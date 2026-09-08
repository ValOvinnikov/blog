import { BRAND_VARIANT, CONTAINER_WIDTH } from '@blog/config';
import { service } from '@blog/service';
import { NewsletterForm } from '@web/components/shared/newsletter-form';
import { Section } from '@web/components/shared/section';
import { getPostPage } from '@web/server/post/get-post-page';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { logger } from '@web/utils/logger/logger';

export type TPostNewsletterProps = {
  slug: string;
  tenant: string;
};

/** Renders the post-foot compact newsletter signup when the post opts in and the settings resolve; renders nothing otherwise. */
export const PostNewsletter = async ({
  slug,
  tenant,
}: TPostNewsletterProps) => {
  const result = await getPostPage(slug, tenant);
  const post = guardPageLoaderResult(result, 'post_newsletter.fetch_failed', {
    slug,
  });
  if (!post.newsletterEnabled) return null;

  const tenantContext = await getTenantSanityContext(tenant);
  const settingsResult =
    await service.global.newsletterSettings.v1.getNewsletterSettings(
      tenantContext,
    );

  if (!settingsResult.ok) {
    logger.error('post_newsletter.newsletter_settings_fetch_failed', {
      slug,
      error: settingsResult.error,
    });
    return null;
  }

  return (
    <Section
      brandVariant={BRAND_VARIANT.PRIMARY}
      layout={{ containerWidth: CONTAINER_WIDTH.FULL }}
    >
      <NewsletterForm variant="compact" heading={settingsResult.data.heading} />
    </Section>
  );
};
