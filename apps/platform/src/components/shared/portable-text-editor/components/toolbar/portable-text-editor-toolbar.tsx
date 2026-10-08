'use client';

import {
  useEditor,
  useEditorSelector,
  type SchemaDefinition,
} from '@portabletext/editor';
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

export type TPortableTextEditorToolbarProps = {
  schema: SchemaDefinition;
};

const hasName = (
  entries: readonly { name: string }[] | undefined,
  name: string,
): boolean => entries?.some((entry) => entry.name === name) ?? false;

/** Offers only what `schema` allows, so no control can author a mark the value's renderer would drop. */
export const PortableTextEditorToolbar = ({
  schema,
}: TPortableTextEditorToolbarProps) => {
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
  const hasBold = hasName(schema.decorators, 'strong');
  const hasItalic = hasName(schema.decorators, 'em');
  const hasHeading = hasName(schema.styles, 'h2');
  const hasBulletList = hasName(schema.lists, 'bullet');
  const hasNumberedList = hasName(schema.lists, 'number');
  const hasLink = hasName(schema.annotations, 'link');
  const hasLists = hasBulletList || hasNumberedList;

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
        {hasBold && (
          <PortableTextEditorToggleButton
            label={t('bold')}
            isActive={isBoldActive}
            isBold={true}
            onToggle={() => {
              editor.send({ type: 'decorator.toggle', decorator: 'strong' });
              focusEditor();
            }}
          />
        )}
        {hasItalic && (
          <PortableTextEditorToggleButton
            label={t('italic')}
            isActive={isItalicActive}
            isItalic={true}
            onToggle={() => {
              editor.send({ type: 'decorator.toggle', decorator: 'em' });
              focusEditor();
            }}
          />
        )}
        {hasHeading && (
          <>
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
          </>
        )}
        {hasLists && <span aria-hidden="true" className={divider()} />}
        {hasBulletList && (
          <PortableTextEditorToggleButton
            label={t('bulletList')}
            isActive={isBulletListActive}
            onToggle={() => {
              editor.send({ type: 'list item.toggle', listItem: 'bullet' });
              focusEditor();
            }}
          />
        )}
        {hasNumberedList && (
          <PortableTextEditorToggleButton
            label={t('numberedList')}
            isActive={isNumberedListActive}
            onToggle={() => {
              editor.send({ type: 'list item.toggle', listItem: 'number' });
              focusEditor();
            }}
          />
        )}
        {hasLink && (
          <>
            <span aria-hidden="true" className={divider()} />
            <PortableTextEditorToggleButton
              label={t('link')}
              isActive={isLinkActive}
              isExpanded={isLinkControlOpen}
              ariaControls={linkControlId}
              onToggle={() => setIsLinkControlOpen((open) => !open)}
            />
          </>
        )}
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
