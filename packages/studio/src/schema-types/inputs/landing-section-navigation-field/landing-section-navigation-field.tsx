import { SANITY_PERSPECTIVE } from '@shinefold/config/constants';
import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config/types';
import { PAGE_LANDING_TYPE } from '@shinefold/studio/schema-types/documents/pages/landing/landing-type';
import { isInsideSection } from '@shinefold/studio/schema-types/inputs/landing-section-navigation-field/is-inside-section';
import {
  LANDING_PARENT_CHAIN_QUERY,
  type TLandingParentChainNode,
} from '@shinefold/studio/schema-types/queries/landing-parent-chain/landing-parent-chain';
import { STUDIO_API_VERSION } from '@shinefold/studio/studio-api-version';
import { hasLength, isString } from '@shinefold/utils/primitives';
import { useEffect, useState } from 'react';
import {
  type BooleanFieldProps,
  getPublishedId,
  type Reference,
  useClient,
  useFormValue,
} from 'sanity';

const HAS_CHILDREN_QUERY = `count(*[_type == $type && parent._ref == $id]) > 0`;

const useDraftsQuery = <T,>(
  query: string,
  params: TMaybeUndefined<Record<string, string>>,
) => {
  const client = useClient({ apiVersion: STUDIO_API_VERSION });
  const key = params ? JSON.stringify(params) : undefined;
  const [fetched, setFetched] = useState<{ key: string; result: T }>();

  useEffect(() => {
    if (!key) return;

    let isCurrent = true;
    client
      .withConfig({ perspective: SANITY_PERSPECTIVE.DRAFTS })
      .fetch<T>(query, JSON.parse(key) as Record<string, string>)
      .then((result) => {
        if (isCurrent) setFetched({ key, result });
      })
      .catch(() => {});

    return () => {
      isCurrent = false;
    };
  }, [client, query, key]);

  return key && fetched?.key === key ? fetched.result : undefined;
};

const renderWhen = (isApplicable: boolean, props: BooleanFieldProps) =>
  isApplicable || hasLength(props.validation)
    ? props.renderDefault(props)
    : null;

export const SectionNavigationField = (props: BooleanFieldProps) => {
  const documentId = useFormValue(['_id']);
  const hasChildren = useDraftsQuery<boolean>(
    HAS_CHILDREN_QUERY,
    isString(documentId)
      ? { id: getPublishedId(documentId), type: PAGE_LANDING_TYPE }
      : undefined,
  );

  return renderWhen(hasChildren === true, props);
};

export const ShowSectionNavigationField = (props: BooleanFieldProps) => {
  const parent = useFormValue(['parent']) as TMaybeUndefined<Reference>;
  const parentChain = useDraftsQuery<TMaybeNull<TLandingParentChainNode>>(
    LANDING_PARENT_CHAIN_QUERY,
    parent?._ref ? { parentId: parent._ref } : undefined,
  );

  return renderWhen(isInsideSection(parentChain), props);
};
