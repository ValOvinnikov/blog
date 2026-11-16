import {
  flattenLandingParentChain,
  type TLandingParentChainNode,
} from '@shinefold/studio/schema-types/queries/landing-parent-chain/landing-parent-chain';

export const isInsideSection = (
  parentChain: TLandingParentChainNode | null | undefined,
): boolean =>
  flattenLandingParentChain(parentChain).some(
    ({ sectionNavigation }) => sectionNavigation === true,
  );
