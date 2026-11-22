import { SANITY_PERSPECTIVE } from '@shinefold/config/constants';
import type {
  TMaybeNull,
  TMaybeUndefined,
  TNullable,
} from '@shinefold/config/types';
import { SlugUrlPreview } from '@shinefold/studio/schema-types/inputs/slug-url-preview/slug-url-preview-input';
import {
  buildNestedRoutePrefix,
  buildSlugUrlPreviewPath,
} from '@shinefold/studio/schema-types/inputs/slug-url-preview/slug-url-preview-path';
import {
  flattenLandingParentChain,
  LANDING_PARENT_CHAIN_QUERY,
  type TLandingParentChainNode,
} from '@shinefold/studio/schema-types/queries/landing-parent-chain/landing-parent-chain';
import { STUDIO_API_VERSION } from '@shinefold/studio/studio-api-version';
import { useEffect, useState } from 'react';
import {
  type Reference,
  type SlugInputProps,
  useClient,
  useFormValue,
} from 'sanity';

const useAncestorSlugs = (parentId: TMaybeUndefined<string>) => {
  const client = useClient({ apiVersion: STUDIO_API_VERSION });
  const [fetched, setFetched] = useState<{
    parentId: string;
    slugs: TNullable<string>[];
  }>();

  useEffect(() => {
    if (!parentId) return;

    let isCurrent = true;
    client
      .withConfig({ perspective: SANITY_PERSPECTIVE.DRAFTS })
      .fetch<TMaybeNull<TLandingParentChainNode>>(LANDING_PARENT_CHAIN_QUERY, {
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
  const parent = useFormValue(['parent']) as TMaybeUndefined<Reference>;
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
