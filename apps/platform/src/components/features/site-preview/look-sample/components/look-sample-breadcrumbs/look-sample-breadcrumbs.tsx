import { LOOK_SAMPLE_BREADCRUMBS_TEST_ID } from '@platform/constants/look-sample';
import { SAMPLE_LINK_HREF } from '@platform/constants/sample-link';
import { BRAND_VARIANT, type TBrandVariant } from '@shinefold/config';
import { Breadcrumbs } from '@shinefold/ui/components/molecules/breadcrumbs';
import { useTranslations } from 'next-intl';

import { lookSampleBreadcrumbsVariants } from './look-sample-breadcrumbs-variants';

export type TLookSampleBreadcrumbsProps = {
  background: TBrandVariant;
  homeLabel: string;
};

export const LookSampleBreadcrumbs = ({
  background,
  homeLabel,
}: TLookSampleBreadcrumbsProps) => {
  const t = useTranslations('lookPreview');
  const tTopbar = useTranslations('topbar');
  const isPlain = background === BRAND_VARIANT.PRIMARY;
  const { root, inner } = lookSampleBreadcrumbsVariants({ isPlain });

  return (
    <div
      className={root()}
      data-skin={isPlain ? undefined : background}
      data-testid={LOOK_SAMPLE_BREADCRUMBS_TEST_ID}
    >
      <div className={inner()}>
        <Breadcrumbs
          ariaLabel={tTopbar('breadcrumbAriaLabel')}
          items={[
            { label: homeLabel, href: SAMPLE_LINK_HREF },
            { label: t('sampleHeading'), href: SAMPLE_LINK_HREF },
          ]}
        />
      </div>
    </div>
  );
};
