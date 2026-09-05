import { portableTextEditorToggleButtonVariants } from './portable-text-editor-toggle-button-variants';

export type TPortableTextEditorToggleButtonProps = {
  label: string;
  isActive: boolean;
  isBold?: boolean;
  isItalic?: boolean;
  onToggle: () => void;
};

/** One toolbar control shared by every decorator/style/list toggle — a bold/italic/heading/list button differs only in label, active state and the event it sends. */
export const PortableTextEditorToggleButton = ({
  label,
  isActive,
  isBold,
  isItalic,
  onToggle,
}: TPortableTextEditorToggleButtonProps) => {
  return (
    <button
      type="button"
      aria-pressed={isActive}
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
