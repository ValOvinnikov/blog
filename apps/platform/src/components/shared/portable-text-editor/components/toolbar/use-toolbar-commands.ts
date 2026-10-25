import { useEditor } from '@portabletext/editor';

export const useToolbarCommands = () => {
  const editor = useEditor();

  const focusEditor = () => editor.send({ type: 'focus' });

  const toggleDecorator = (decorator: string) => {
    editor.send({ type: 'decorator.toggle', decorator });
    focusEditor();
  };

  const toggleStyle = (style: string) => {
    editor.send({ type: 'style.toggle', style });
    focusEditor();
  };

  const toggleListItem = (listItem: string) => {
    editor.send({ type: 'list item.toggle', listItem });
    focusEditor();
  };

  const addLink = (href: string) =>
    editor.send({
      type: 'annotation.add',
      annotation: { name: 'link', value: { href } },
    });

  const removeLink = () =>
    editor.send({
      type: 'annotation.remove',
      annotation: { name: 'link' },
    });

  return {
    focusEditor,
    toggleDecorator,
    toggleStyle,
    toggleListItem,
    addLink,
    removeLink,
  };
};
