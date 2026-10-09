import { Toggle } from '@base-ui/react/toggle';
import { Toolbar } from '@base-ui/react/toolbar';

import { portableTextEditorToggleButtonVariants } from './portable-text-editor-toggle-button-variants';

export type TPortableTextEditorToggleButtonProps = {
  label: string;
  isActive: boolean;
  isBold?: boolean;
  isItalic?: boolean;
  onToggle: () => void;
  isExpanded?: boolean;
  ariaControls?: string;
};

export const PortableTextEditorToggleButton = ({
  label,
  isActive,
  isBold,
  isItalic,
  onToggle,
  isExpanded,
  ariaControls,
}: TPortableTextEditorToggleButtonProps) => {
  return (
    <Toolbar.Button
      render={<Toggle pressed={isActive} onPressedChange={onToggle} />}
      aria-expanded={isExpanded}
      aria-controls={ariaControls}
      className={portableTextEditorToggleButtonVariants({
        isActive,
        isBold,
        isItalic,
      })}
    >
      {label}
    </Toolbar.Button>
  );
};
