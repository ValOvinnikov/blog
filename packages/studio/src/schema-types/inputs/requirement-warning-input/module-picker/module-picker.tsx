import type { TMaybeNull } from '@blog/config/types';
import { textSizedIcon } from '@blog/studio/schema-types/icons/text-sized-icon/text-sized-icon';
import type { TEntitlementState } from '@blog/studio/schema-types/inputs/requirement-warning-input/missing-requirement/get-missing-requirement';
import { ModulePickerMenu } from '@blog/studio/schema-types/inputs/requirement-warning-input/module-picker/module-picker-menu';
import { ModulePickerTypesContext } from '@blog/studio/schema-types/inputs/requirement-warning-input/module-picker/module-picker-types-context';
import { Button, Grid, useClickOutsideEvent } from '@sanity/ui';
import { Popover } from '@sanity/ui/popover';
import { Plus } from 'lucide-react';
import { useContext, useRef, useState } from 'react';
import {
  type ArrayInputFunctionsProps,
  type ArraySchemaType,
  type SchemaType,
  usePortalBoundary,
  useTranslation,
} from 'sanity';

type TModulePickerProps = ArrayInputFunctionsProps<
  { _key: string },
  ArraySchemaType
>;

const AddIcon = textSizedIcon(Plus);

const GRID_STYLE = {
  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
};

export const createModulePicker = ({
  entitledModulePacks,
}: TEntitlementState) =>
  function ModulePicker({
    schemaType,
    readOnly,
    onItemAppend,
    onValueCreate,
  }: TModulePickerProps) {
    const { t } = useTranslation();
    const types = useContext(ModulePickerTypesContext) ?? schemaType.of;
    const [open, setOpen] = useState(false);
    const [gridElement, setGridElement] =
      useState<TMaybeNull<HTMLDivElement>>(null);
    const [toggleElement, setToggleElement] =
      useState<TMaybeNull<HTMLButtonElement>>(null);
    const popoverRef = useRef<TMaybeNull<HTMLDivElement>>(null);
    const floatingBoundary = usePortalBoundary() ?? undefined;

    useClickOutsideEvent(
      () => setOpen(false),
      () => [popoverRef.current, toggleElement],
    );

    const close = () => {
      setOpen(false);
      toggleElement?.focus();
    };

    const append = (type: SchemaType) => {
      // Sanity types `onValueCreate` with the array's own schema type, but calls it with the member type.
      onItemAppend(onValueCreate(type as ArraySchemaType));
      setOpen(false);
    };

    return (
      <Grid ref={setGridElement} gap={1} style={GRID_STYLE}>
        <Button
          ref={setToggleElement}
          icon={AddIcon}
          mode="ghost"
          gap={3}
          padding={3}
          text={t('inputs.array.action.add-item-select-type')}
          disabled={readOnly}
          selected={open}
          onClick={() => setOpen((wasOpen) => !wasOpen)}
        />
        {!readOnly && (
          <Popover
            ref={popoverRef}
            open={open}
            animate={true}
            constrainSize={true}
            overflow="hidden"
            portal={true}
            placement="bottom"
            fallbackPlacements={['top']}
            floatingBoundary={floatingBoundary}
            referenceBoundary={gridElement}
            referenceElement={toggleElement}
            content={
              <ModulePickerMenu
                types={types}
                insertMenu={schemaType.options?.insertMenu}
                entitledModulePacks={entitledModulePacks}
                onSelect={append}
                onEscape={close}
              />
            }
          />
        )}
      </Grid>
    );
  };
