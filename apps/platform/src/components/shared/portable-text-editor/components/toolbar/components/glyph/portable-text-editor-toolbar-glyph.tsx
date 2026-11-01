import { ICONS, SIZE } from '@blog/config';
import {
  Icon,
  type TRegisteredIconName,
} from '@platform/components/shared/icon';
import type { TPortableTextEditorSize } from '@platform/components/shared/portable-text-editor/portable-text-editor-variants';
import { ICON_SIZE } from '@platform/constants/icon';

import { portableTextEditorToolbarGlyphVariants } from './portable-text-editor-toolbar-glyph-variants';

export type TPortableTextEditorToolbarGlyphProps = {
  icon: TRegisteredIconName;
  size: TPortableTextEditorSize;
};

export const PortableTextEditorToolbarGlyph = ({
  icon,
  size,
}: TPortableTextEditorToolbarGlyphProps) => {
  const { bold, italic } = portableTextEditorToolbarGlyphVariants();

  if (size !== SIZE.SM) return <Icon name={icon} />;

  if (icon === ICONS.BOLD) {
    return (
      <span aria-hidden={true} className={bold()}>
        B
      </span>
    );
  }

  if (icon === ICONS.ITALIC) {
    return (
      <span aria-hidden={true} className={italic()}>
        I
      </span>
    );
  }

  return <Icon name={icon} size={ICON_SIZE.XS} strokeWidth={2} />;
};
