'use client';

import { useEditor, useEditorSelector } from '@portabletext/editor';
import * as selectors from '@portabletext/editor/selectors';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { PortableTextEditorLinkControl } from './components/link-control/portable-text-editor-link-control';
import { PortableTextEditorToggleButton } from './components/toggle-button/portable-text-editor-toggle-button';
import { portableTextEditorToolbarVariants } from './portable-text-editor-toolbar-variants';

const findActiveLinkHref = (
  annotations: ReturnType<typeof selectors.getActiveAnnotations>,
): string => {
  const link = annotations.find((annotation) => annotation._type === 'link');
  return typeof link?.href === 'string' ? link.href : '';
};

/**
 * The editor's formatting controls — deliberately limited to exactly what
 * `@blog/email`'s serializer renders (bold, italic, one heading level, two
 * list types, link), so nothing offered here can produce copy that silently
 * disappears from the sent email.
 */
export const PortableTextEditorToolbar = () => {
  const t = useTranslations('portableTextEditorToolbar');
  const editor = useEditor();
  const linkControlId = useId();
  const [isLinkControlOpen, setIsLinkControlOpen] = useState(false);

  const isBoldActive = useEditorSelector(
    editor,
    selectors.isActiveDecorator('strong'),
  );
  const isItalicActive = useEditorSelector(
    editor,
    selectors.isActiveDecorator('em'),
  );
  const isHeadingActive = useEditorSelector(
    editor,
    selectors.isActiveStyle('h2'),
  );
  const isBulletListActive = useEditorSelector(
    editor,
    selectors.isActiveListItem('bullet'),
  );
  const isNumberedListActive = useEditorSelector(
    editor,
    selectors.isActiveListItem('number'),
  );
  const isLinkActive = useEditorSelector(
    editor,
    selectors.isActiveAnnotation('link'),
  );
  const activeAnnotations = useEditorSelector(
    editor,
    selectors.getActiveAnnotations,
  );

  const { root, divider } = portableTextEditorToolbarVariants();

  const focusEditor = () => editor.send({ type: 'focus' });

  const handleLinkApply = (href: string) => {
    if (isLinkActive) {
      editor.send({ type: 'annotation.remove', annotation: { name: 'link' } });
    }
    editor.send({
      type: 'annotation.add',
      annotation: { name: 'link', value: { href } },
    });
    setIsLinkControlOpen(false);
    focusEditor();
  };

  const handleLinkRemove = () => {
    editor.send({ type: 'annotation.remove', annotation: { name: 'link' } });
    setIsLinkControlOpen(false);
    focusEditor();
  };

  return (
    <div>
      <div className={root()}>
        <PortableTextEditorToggleButton
          label={t('bold')}
          isActive={isBoldActive}
          isBold={true}
          onToggle={() => {
            editor.send({ type: 'decorator.toggle', decorator: 'strong' });
            focusEditor();
          }}
        />
        <PortableTextEditorToggleButton
          label={t('italic')}
          isActive={isItalicActive}
          isItalic={true}
          onToggle={() => {
            editor.send({ type: 'decorator.toggle', decorator: 'em' });
            focusEditor();
          }}
        />
        <span aria-hidden="true" className={divider()} />
        <PortableTextEditorToggleButton
          label={t('heading')}
          isActive={isHeadingActive}
          onToggle={() => {
            editor.send({
              type: 'style.toggle',
              style: isHeadingActive ? 'normal' : 'h2',
            });
            focusEditor();
          }}
        />
        <span aria-hidden="true" className={divider()} />
        <PortableTextEditorToggleButton
          label={t('bulletList')}
          isActive={isBulletListActive}
          onToggle={() => {
            editor.send({ type: 'list item.toggle', listItem: 'bullet' });
            focusEditor();
          }}
        />
        <PortableTextEditorToggleButton
          label={t('numberedList')}
          isActive={isNumberedListActive}
          onToggle={() => {
            editor.send({ type: 'list item.toggle', listItem: 'number' });
            focusEditor();
          }}
        />
        <span aria-hidden="true" className={divider()} />
        <PortableTextEditorToggleButton
          label={t('link')}
          isActive={isLinkActive}
          isExpanded={isLinkControlOpen}
          ariaControls={linkControlId}
          onToggle={() => setIsLinkControlOpen((open) => !open)}
        />
      </div>
      {isLinkControlOpen && (
        <PortableTextEditorLinkControl
          id={linkControlId}
          initialHref={findActiveLinkHref(activeAnnotations)}
          hasExistingLink={isLinkActive}
          onApply={handleLinkApply}
          onRemove={handleLinkRemove}
          onCancel={() => {
            setIsLinkControlOpen(false);
            focusEditor();
          }}
        />
      )}
    </div>
  );
};
