import {
  useEditor,
  useEditorSelector,
  type TextBlockRenderProps,
} from '@portabletext/editor';

import { getListItemRun, isSameListItemRun } from './list-item-run';

export const PortableTextEditorTextBlock = ({
  attributes,
  children,
  node,
}: TextBlockRenderProps) => {
  const editor = useEditor();
  const run = useEditorSelector(
    editor,
    ({ context, blockIndexMap }) =>
      getListItemRun(context.value, blockIndexMap.get(node._key)),
    isSameListItemRun,
  );

  const styled = node.style === 'h2' ? <h2>{children}</h2> : <p>{children}</p>;

  if (node.listItem === undefined) {
    return <div {...attributes}>{styled}</div>;
  }

  const { position = 1, setSize = 1 } = run ?? {};
  const listItem = (
    <li aria-posinset={position} aria-setsize={setSize}>
      {styled}
    </li>
  );

  return (
    <div {...attributes}>
      {node.listItem === 'number' ? (
        <ol start={position}>{listItem}</ol>
      ) : (
        <ul>{listItem}</ul>
      )}
    </div>
  );
};
