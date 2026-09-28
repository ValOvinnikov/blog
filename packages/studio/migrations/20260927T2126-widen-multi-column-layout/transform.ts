import type { Path } from 'sanity/migrate';

const LEGACY_TYPE = 'layout';
const TARGET_TYPE = 'wideLayout';

export type TModuleLayoutNode = {
  _type: string;
  [key: string]: unknown;
};

export const isLayoutFieldPath = (path: Path): boolean =>
  path.length === 1 && path[0] === 'layout';

export const widenModuleLayoutType = (
  node: TModuleLayoutNode,
  path: Path,
): TModuleLayoutNode | undefined => {
  if (node._type !== LEGACY_TYPE) return undefined;
  if (!isLayoutFieldPath(path)) return undefined;

  return { ...node, _type: TARGET_TYPE };
};
