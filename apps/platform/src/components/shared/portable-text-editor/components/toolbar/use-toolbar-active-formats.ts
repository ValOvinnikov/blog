import {
  useEditor,
  useEditorSelector,
  type EditorSelector,
} from '@portabletext/editor';
import * as selectors from '@portabletext/editor/selectors';

const selectActiveLinkHref: EditorSelector<string> = (snapshot) => {
  const link = selectors
    .getActiveAnnotations(snapshot)
    .find((annotation) => annotation._type === 'link');
  return typeof link?.href === 'string' ? link.href : '';
};

export const useToolbarActiveFormats = () => {
  const editor = useEditor();

  return {
    isBoldActive: useEditorSelector(
      editor,
      selectors.isActiveDecorator('strong'),
    ),
    isItalicActive: useEditorSelector(
      editor,
      selectors.isActiveDecorator('em'),
    ),
    isHeadingActive: useEditorSelector(editor, selectors.isActiveStyle('h2')),
    isBulletListActive: useEditorSelector(
      editor,
      selectors.isActiveListItem('bullet'),
    ),
    isNumberedListActive: useEditorSelector(
      editor,
      selectors.isActiveListItem('number'),
    ),
    isLinkActive: useEditorSelector(
      editor,
      selectors.isActiveAnnotation('link'),
    ),
    activeLinkHref: useEditorSelector(editor, selectActiveLinkHref),
  };
};
