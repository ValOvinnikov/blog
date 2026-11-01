'use client';

import { Toolbar } from '@base-ui/react/toolbar';
import { ICONS, SIZE } from '@blog/config';
import type { TPortableTextEditorSize } from '@platform/components/shared/portable-text-editor/portable-text-editor-variants';
import { Tooltip } from '@platform/components/shared/tooltip';
import type { SchemaDefinition } from '@portabletext/editor';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { PortableTextEditorLinkControl } from './components/link-control/portable-text-editor-link-control';
import { PortableTextEditorToggleButton } from './components/toggle-button/portable-text-editor-toggle-button';
import { getSchemaFormats } from './get-schema-formats';
import { portableTextEditorToolbarVariants } from './portable-text-editor-toolbar-variants';
import { useToolbarActiveFormats } from './use-toolbar-active-formats';
import { useToolbarCommands } from './use-toolbar-commands';

export type TPortableTextEditorToolbarProps = {
  schema: SchemaDefinition;
  size?: TPortableTextEditorSize;
};

/** Offers only what `schema` allows, so no control can author a mark the value's renderer would drop. */
export const PortableTextEditorToolbar = ({
  schema,
  size = SIZE.MD,
}: TPortableTextEditorToolbarProps) => {
  const t = useTranslations('portableTextEditorToolbar');
  const {
    focusEditor,
    toggleDecorator,
    toggleStyle,
    toggleListItem,
    addLink,
    removeLink,
  } = useToolbarCommands();
  const linkControlId = useId();
  const [isLinkControlOpen, setIsLinkControlOpen] = useState(false);

  const {
    isBoldActive,
    isItalicActive,
    isHeadingActive,
    isBulletListActive,
    isNumberedListActive,
    isLinkActive,
    activeLinkHref,
  } = useToolbarActiveFormats();

  const { root, bar, divider } = portableTextEditorToolbarVariants({ size });
  const {
    hasBold,
    hasItalic,
    hasHeading,
    hasBulletList,
    hasNumberedList,
    hasLink,
  } = getSchemaFormats(schema);
  const hasLists = hasBulletList || hasNumberedList;

  const handleLinkApply = (href: string) => {
    if (isLinkActive) {
      removeLink();
    }
    addLink(href);
    setIsLinkControlOpen(false);
    focusEditor();
  };

  const handleLinkRemove = () => {
    removeLink();
    setIsLinkControlOpen(false);
    focusEditor();
  };

  return (
    <Tooltip.Provider>
      <div className={root()}>
        <Toolbar.Root className={bar()}>
          {hasBold && (
            <PortableTextEditorToggleButton
              size={size}
              label={t('bold')}
              isActive={isBoldActive}
              icon={ICONS.BOLD}
              onToggle={() => toggleDecorator('strong')}
            />
          )}
          {hasItalic && (
            <PortableTextEditorToggleButton
              size={size}
              label={t('italic')}
              isActive={isItalicActive}
              icon={ICONS.ITALIC}
              onToggle={() => toggleDecorator('em')}
            />
          )}
          {hasHeading && (
            <>
              <Toolbar.Separator className={divider()} />
              <PortableTextEditorToggleButton
                size={size}
                label={t('heading')}
                isActive={isHeadingActive}
                onToggle={() => toggleStyle(isHeadingActive ? 'normal' : 'h2')}
              />
            </>
          )}
          {hasLists && <Toolbar.Separator className={divider()} />}
          {hasBulletList && (
            <PortableTextEditorToggleButton
              size={size}
              label={t('bulletList')}
              isActive={isBulletListActive}
              onToggle={() => toggleListItem('bullet')}
            />
          )}
          {hasNumberedList && (
            <PortableTextEditorToggleButton
              size={size}
              label={t('numberedList')}
              isActive={isNumberedListActive}
              onToggle={() => toggleListItem('number')}
            />
          )}
          {hasLink && (
            <>
              <Toolbar.Separator className={divider()} />
              <PortableTextEditorToggleButton
                size={size}
                label={t('link')}
                icon={ICONS.LINK}
                isActive={isLinkActive}
                isExpanded={isLinkControlOpen}
                ariaControls={linkControlId}
                onToggle={() => setIsLinkControlOpen((open) => !open)}
              />
            </>
          )}
        </Toolbar.Root>
        {isLinkControlOpen && (
          <PortableTextEditorLinkControl
            id={linkControlId}
            initialHref={activeLinkHref}
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
    </Tooltip.Provider>
  );
};
