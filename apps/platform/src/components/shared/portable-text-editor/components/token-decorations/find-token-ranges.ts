import type {
  EditorSelection,
  PortableTextBlock,
  PortableTextSpan,
  PortableTextTextBlock,
} from '@portabletext/editor';

type TTokenRange = {
  id: string;
  range: NonNullable<EditorSelection>;
};

const isTextBlock = (
  block: PortableTextBlock,
): block is PortableTextTextBlock => block._type === 'block';

const isSpan = (
  child: PortableTextTextBlock['children'][number],
): child is PortableTextSpan => child._type === 'span';

const findOffsets = (text: string, needle: string): number[] => {
  const offsets: number[] = [];
  for (
    let offset = text.indexOf(needle);
    offset !== -1;
    offset = text.indexOf(needle, offset + needle.length)
  ) {
    offsets.push(offset);
  }
  return offsets;
};

export const findTokenRanges = (
  value: PortableTextBlock[],
  tokens: readonly string[],
): TTokenRange[] =>
  value.filter(isTextBlock).flatMap(({ _key: blockKey, children }) =>
    children.filter(isSpan).flatMap(({ _key: spanKey, text }) => {
      const path = [{ _key: blockKey }, 'children', { _key: spanKey }];

      return tokens.flatMap((token) => {
        const needle = `{${token}}`;
        return findOffsets(text, needle).map((offset) => ({
          id: `${blockKey}:${spanKey}:${offset}`,
          range: {
            anchor: { path, offset },
            focus: { path, offset: offset + needle.length },
          },
        }));
      });
    }),
  );
