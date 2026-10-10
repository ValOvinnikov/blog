import type {
  PortableTextBlock,
  PortableTextTextBlock,
} from '@portabletext/editor';

type TListItemBlock = PortableTextTextBlock & { listItem: string };

type TListItemRun = {
  position: number;
  setSize: number;
};

const isListItemBlock = (
  entry: PortableTextBlock | undefined,
): entry is TListItemBlock =>
  entry?._type === 'block' &&
  (entry as PortableTextTextBlock).listItem !== undefined;

const countRunNeighbours = (
  value: PortableTextBlock[],
  fromIndex: number,
  step: 1 | -1,
  listItem: string,
  level: number,
): number => {
  let count = 0;
  for (let i = fromIndex; i >= 0 && i < value.length; i += step) {
    const entry = value[i];
    if (!isListItemBlock(entry)) break;
    if ((entry.level ?? 1) !== level) continue;
    if (entry.listItem !== listItem) break;
    count += 1;
  }
  return count;
};

export const getListItemRun = (
  value: PortableTextBlock[],
  index: number | undefined,
): TListItemRun | undefined => {
  if (index === undefined) return undefined;

  const block = value[index];
  if (!isListItemBlock(block)) return undefined;

  const { listItem, level = 1 } = block;
  const before = countRunNeighbours(value, index - 1, -1, listItem, level);
  const after = countRunNeighbours(value, index + 1, 1, listItem, level);

  return { position: before + 1, setSize: before + after + 1 };
};

export const isSameListItemRun = (
  a: TListItemRun | undefined,
  b: TListItemRun | undefined,
): boolean => a?.position === b?.position && a?.setSize === b?.setSize;
