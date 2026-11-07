import type { TModulePack } from '@blog/config/constants';
import { textSizedIcon } from '@blog/studio/schema-types/icons/text-sized-icon/text-sized-icon';
import { getMissingModulePack } from '@blog/studio/schema-types/inputs/requirement-warning-input/missing-requirement/get-missing-requirement';
import {
  ALL_ITEMS_TAB,
  filterModulePickerTypes,
  getModulePickerIcon,
  isModulePickerSearchShown,
} from '@blog/studio/schema-types/inputs/requirement-warning-input/module-picker/module-picker-sections';
import { hasArrayGotItems, hasLength } from '@blog/utils/primitives';
import { Box, Card, Flex, Tab, TabList, Text, TextInput } from '@sanity/ui';
import { Menu, MenuItem } from '@sanity/ui/menu';
import { Search } from 'lucide-react';
import { useState } from 'react';
import {
  type InsertMenuOptions,
  type SchemaType,
  useTranslation,
} from 'sanity';

const SearchIcon = textSizedIcon(Search);

const STICKY_HEADER_STYLE = {
  position: 'sticky',
  top: 0,
  zIndex: 1,
  borderBottom: '1px solid var(--card-border-color)',
} as const;

export const ModulePickerMenu = ({
  types,
  insertMenu = {},
  entitledModulePacks,
  onSelect,
  onEscape,
}: {
  types: readonly SchemaType[];
  insertMenu?: InsertMenuOptions;
  entitledModulePacks: readonly TModulePack[];
  onSelect: (type: SchemaType) => void;
  onEscape: () => void;
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState(ALL_ITEMS_TAB);
  const groups = insertMenu.groups ?? [];
  const showSearch = isModulePickerSearchShown(insertMenu.filter, types.length);
  const showTabs = hasArrayGotItems(groups);
  const shown = filterModulePickerTypes({ types, groups, tab, query });
  const tabs = [
    {
      name: ALL_ITEMS_TAB,
      title: t('inputs.array.insert-menu.filter.all-items'),
    },
    ...groups,
  ];

  return (
    <Menu padding={0} onEscape={onEscape}>
      {(showSearch || showTabs) && (
        <Card paddingBottom={1} style={STICKY_HEADER_STYLE}>
          {showSearch && (
            <Box paddingTop={1} paddingX={1}>
              <TextInput
                autoFocus={true}
                border={false}
                fontSize={1}
                icon={SearchIcon}
                placeholder={t('inputs.array.insert-menu.search.placeholder')}
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
              />
            </Box>
          )}
          {showTabs && (
            <Box paddingTop={1} paddingX={1}>
              <TabList gap={1}>
                {tabs.map((group) => (
                  <Tab
                    key={group.name}
                    id={`${group.name}-tab`}
                    aria-controls={`${group.name}-panel`}
                    label={group.title ?? group.name}
                    selected={group.name === tab}
                    onClick={() => setTab(group.name)}
                  />
                ))}
              </TabList>
            </Box>
          )}
        </Card>
      )}
      <Box padding={1}>
        {hasLength(shown) ? (
          <Flex direction="column" gap={1}>
            {shown.map((type) => (
              <MenuItem
                key={type.name}
                disabled={Boolean(
                  getMissingModulePack(type.name, entitledModulePacks),
                )}
                icon={getModulePickerIcon(type)}
                text={type.title ?? type.name}
                onClick={() => onSelect(type)}
              />
            ))}
          </Flex>
        ) : (
          <Box padding={2}>
            <Text muted={true} size={1}>
              {t('inputs.array.insert-menu.search.no-results')}
            </Text>
          </Box>
        )}
      </Box>
    </Menu>
  );
};
