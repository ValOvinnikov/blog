import type { TModulePack } from '@blog/config/constants';
import type { TMaybeNull } from '@blog/config/types';
import { MODULE_PACK_LABEL } from '@blog/studio/schema-types/inputs/requirement-warning-input/missing-requirement/get-missing-requirement';
import { getModulePickerIcon } from '@blog/studio/schema-types/inputs/requirement-warning-input/module-picker/module-picker-filter';
import { Badge, Box, Card, Flex, Text } from '@sanity/ui';
import { MenuItem } from '@sanity/ui/menu';
import { createElement, useId } from 'react';
import type { SchemaType } from 'sanity';

const AVAILABLE_STYLE = { cursor: 'pointer' } as const;

const TRANSPARENT_STYLE = { backgroundColor: 'transparent' } as const;

const ModulePickerRowContent = ({
  type,
  isAvailable,
}: {
  type: SchemaType;
  isAvailable: boolean;
}) => {
  const Icon = getModulePickerIcon(type);

  return (
    <Box flex={1}>
      <Flex align="center" gap={3}>
        {Icon && (
          <Text size={1} muted={!isAvailable}>
            {createElement(Icon)}
          </Text>
        )}
        <Box flex={1}>
          <Text
            size={1}
            weight="semibold"
            muted={!isAvailable}
            textOverflow="ellipsis"
          >
            {type.title ?? type.name}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
};

export const ModulePickerRow = ({
  type,
  missingModulePack,
  onSelect,
}: {
  type: SchemaType;
  missingModulePack: TMaybeNull<TModulePack>;
  onSelect: (type: SchemaType) => void;
}) => {
  const badgeId = useId();

  if (!missingModulePack) {
    return (
      <MenuItem style={AVAILABLE_STYLE} onClick={() => onSelect(type)}>
        <ModulePickerRowContent type={type} isAvailable={true} />
      </MenuItem>
    );
  }

  // A disabled menu item recolours its text below 4.5:1 contrast, so the row re-applies the default card colours.
  return (
    <MenuItem disabled={true} aria-describedby={badgeId}>
      <Card as="span" tone="default" style={TRANSPARENT_STYLE}>
        <Flex align="center" gap={3}>
          <ModulePickerRowContent type={type} isAvailable={false} />
          <Badge id={badgeId} aria-hidden={true} tone="primary">
            {MODULE_PACK_LABEL[missingModulePack]}
          </Badge>
        </Flex>
      </Card>
    </MenuItem>
  );
};
