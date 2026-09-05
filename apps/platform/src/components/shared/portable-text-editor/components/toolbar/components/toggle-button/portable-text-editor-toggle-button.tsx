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

/** One toolbar control shared by every decorator/style/list toggle — a bold/italic/heading/list button differs only in label, active state and the event it sends. */
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
    <button
      type="button"
      aria-pressed={isActive}
      aria-expanded={isExpanded}
      aria-controls={ariaControls}
      onClick={onToggle}
      className={portableTextEditorToggleButtonVariants({
        isActive,
        isBold,
        isItalic,
      })}
    >
      {label}
    </button>
  );
};
