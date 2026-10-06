import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { isInsideSection } from '@blog/studio/schema-types/inputs/landing-section-navigation-field/is-inside-section';
import {
  LANDING_PARENT_CHAIN_QUERY,
  type TLandingParentChainNode,
} from '@blog/studio/schema-types/queries/landing-parent-chain/landing-parent-chain';
import { useEffect, useState } from 'react';
import {
  type BooleanFieldProps,
  getPublishedId,
  type Reference,
  useClient,
  useFormValue,
} from 'sanity';

const SECTION_NAVIGATION_API_VERSION = '2025-02-19';

const HAS_CHILDREN_QUERY = `count(*[_type == $type && parent._ref == $id]) > 0`;

const useDraftsQuery = <T,>(
  query: string,
  params: Record<string, string> | undefined,
) => {
  const client = useClient({ apiVersion: SECTION_NAVIGATION_API_VERSION });
  const key = params ? JSON.stringify(params) : undefined;
  const [fetched, setFetched] = useState<{ key: string; result: T }>();

  useEffect(() => {
    if (!key) return;

    let isCurrent = true;
    client
      .withConfig({ perspective: 'drafts' })
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
  isApplicable || props.validation.length > 0
    ? props.renderDefault(props)
    : null;

export const SectionNavigationField = (props: BooleanFieldProps) => {
  const documentId = useFormValue(['_id']) as string | undefined;
  const hasChildren = useDraftsQuery<boolean>(
    HAS_CHILDREN_QUERY,
    documentId
      ? { id: getPublishedId(documentId), type: PAGE_LANDING_TYPE }
      : undefined,
  );

  return renderWhen(hasChildren === true, props);
};

export const ShowSectionNavigationField = (props: BooleanFieldProps) => {
  const parent = useFormValue(['parent']) as Reference | undefined;
  const parentChain = useDraftsQuery<TLandingParentChainNode | null>(
    LANDING_PARENT_CHAIN_QUERY,
    parent?._ref ? { parentId: parent._ref } : undefined,
  );

  return renderWhen(isInsideSection(parentChain), props);
};
