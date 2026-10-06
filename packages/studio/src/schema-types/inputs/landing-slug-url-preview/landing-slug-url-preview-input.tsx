import { SlugUrlPreview } from '@blog/studio/schema-types/inputs/slug-url-preview/slug-url-preview-input';
import {
  buildNestedRoutePrefix,
  buildSlugUrlPreviewPath,
} from '@blog/studio/schema-types/inputs/slug-url-preview/slug-url-preview-path';
import {
  flattenLandingParentChain,
  LANDING_PARENT_CHAIN_QUERY,
  type TLandingParentChainNode,
} from '@blog/studio/schema-types/queries/landing-parent-chain/landing-parent-chain';
import { useEffect, useState } from 'react';
import {
  type Reference,
  type SlugInputProps,
  useClient,
  useFormValue,
} from 'sanity';

const PARENT_CHAIN_API_VERSION = '2025-02-19';

const useAncestorSlugs = (parentId: string | undefined) => {
  const client = useClient({ apiVersion: PARENT_CHAIN_API_VERSION });
  const [fetched, setFetched] = useState<{
    parentId: string;
    slugs: (string | null | undefined)[];
  }>();

  useEffect(() => {
    if (!parentId) return;

    let isCurrent = true;
    client
      .withConfig({ perspective: 'drafts' })
      .fetch<TLandingParentChainNode | null>(LANDING_PARENT_CHAIN_QUERY, {
        parentId,
      })
      .then((chain) => {
        if (!isCurrent) return;
        setFetched({
          parentId,
          slugs: flattenLandingParentChain(chain).map(({ slug }) => slug),
        });
      })
      .catch(() => {});

    return () => {
      isCurrent = false;
    };
  }, [client, parentId]);

  return parentId && fetched?.parentId === parentId ? fetched.slugs : [];
};

export const LandingSlugUrlPreviewInput = (props: SlugInputProps) => {
  const parent = useFormValue(['parent']) as Reference | undefined;
  const ancestorSlugs = useAncestorSlugs(parent?._ref);

  return (
    <SlugUrlPreview
      inputProps={props}
      path={buildSlugUrlPreviewPath(
        buildNestedRoutePrefix(ancestorSlugs),
        props.value?.current,
      )}
    />
  );
};
