import { Toggle } from '@base-ui/react/toggle';
import { Toolbar } from '@base-ui/react/toolbar';
import { Tooltip } from '@base-ui/react/tooltip';
import { SIZE, type TIconName } from '@blog/config';
import { Icon } from '@platform/components/shared/icon';

import { portableTextEditorToggleButtonVariants } from './portable-text-editor-toggle-button-variants';

export type TPortableTextEditorToggleButtonProps = {
  label: string;
  isActive: boolean;
  onToggle: () => void;
  icon?: TIconName;
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
  const { button, tooltip } = portableTextEditorToggleButtonVariants({
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
    <Tooltip.Root>
      <Toolbar.Button
        render={<Tooltip.Trigger render={toggle} />}
        aria-label={label}
        aria-expanded={isExpanded}
        aria-controls={ariaControls}
        className={button()}
      >
        <Icon name={icon} size={SIZE.SM} />
      </Toolbar.Button>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={6}>
          <Tooltip.Popup className={tooltip()}>{label}</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
};
