import { Toggle } from '@base-ui/react/toggle';
import { Toolbar } from '@base-ui/react/toolbar';
import {
  Icon,
  type TRegisteredIconName,
} from '@platform/components/shared/icon';
import { Tooltip } from '@platform/components/shared/tooltip';

import { portableTextEditorToggleButtonVariants } from './portable-text-editor-toggle-button-variants';

export type TPortableTextEditorToggleButtonProps = {
  label: string;
  isActive: boolean;
  onToggle: () => void;
  icon?: TRegisteredIconName;
  isExpanded?: boolean;
  ariaControls?: string;
};

export const PortableTextEditorToggleButton = ({
  label,
  isActive,
  onToggle,
  icon,
  isExpanded,
  ariaControls,
}: TPortableTextEditorToggleButtonProps) => {
  const { button } = portableTextEditorToggleButtonVariants({
    isActive,
    isIconOnly: icon !== undefined,
  });
  const toggle = <Toggle pressed={isActive} onPressedChange={onToggle} />;

  if (icon === undefined) {
    return (
      <Toolbar.Button
        render={toggle}
        aria-expanded={isExpanded}
        aria-controls={ariaControls}
        className={button()}
      >
        {label}
      </Toolbar.Button>
    );
  }

  return (
    <Tooltip
      label={label}
      side="top"
      align="center"
      trigger={
        <Toolbar.Button
          render={toggle}
          aria-label={label}
          aria-expanded={isExpanded}
          aria-controls={ariaControls}
          className={button()}
        >
          <Icon name={icon} />
        </Toolbar.Button>
      }
    />
  );
};
