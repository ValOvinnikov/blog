import { LockIcon } from '@blog/studio/schema-types/icons/lock-icon/lock-icon';
import { textSizedIcon } from '@blog/studio/schema-types/icons/text-sized-icon/text-sized-icon';
import {
  getLockedModulesNote,
  getMissingModulePack,
  getModulePackPlanLabel,
  type TEntitlementState,
} from '@blog/studio/schema-types/inputs/requirement-warning-input/missing-requirement/get-missing-requirement';
import {
  getModulePickerSections,
  getOffPlanModulePack,
} from '@blog/studio/schema-types/inputs/requirement-warning-input/module-picker/module-picker-sections';
import { getModuleTitle } from '@blog/studio/structure/module-kinds/module-kinds';
import { hasLength } from '@blog/utils/primitives';
import { Badge, Box, Button, Grid, Text, TextInput } from '@sanity/ui';
import { Menu, MenuButton, MenuDivider, MenuItem } from '@sanity/ui/menu';
import { Plus, Search } from 'lucide-react';
import { Fragment, useId, useState } from 'react';
import {
  type ArrayInputFunctionsProps,
  type ArraySchemaType,
  type SchemaType,
  useTranslation,
} from 'sanity';

type TModulePickerProps = ArrayInputFunctionsProps<
  { _key: string },
  ArraySchemaType
>;

const AddIcon = textSizedIcon(Plus);
const SearchIcon = textSizedIcon(Search);

const SectionLabel = ({ title }: { title: string }) => (
  <Box paddingX={3} paddingTop={3} paddingBottom={2}>
    <Text size={1} weight="medium" muted={true}>
      {title}
    </Text>
  </Box>
);

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
    const id = useId();
    const [query, setQuery] = useState('');
    const sections = getModulePickerSections({
      types: schemaType.of,
      groups: schemaType.options?.insertMenu?.groups,
      query,
    });
    const offPlanPack = getOffPlanModulePack(
      schemaType.of,
      entitledModulePacks,
    );
    const addButton = (
      <Button
        icon={AddIcon}
        mode="ghost"
        padding={3}
        text={t('inputs.array.action.add-item-select-type')}
        disabled={readOnly}
      />
    );

    if (readOnly) {
      return <Grid>{addButton}</Grid>;
    }

    const append = (type: SchemaType) =>
      // Sanity types `onValueCreate` with the array's own schema type, but calls it with the member type.
      onItemAppend(onValueCreate(type as ArraySchemaType));

    return (
      <Grid>
        <MenuButton
          id={id}
          button={addButton}
          onClose={() => setQuery('')}
          popover={{ portal: true, matchReferenceWidth: true }}
          menu={
            <Menu>
              <TextInput
                autoFocus={true}
                border={false}
                fontSize={1}
                icon={SearchIcon}
                placeholder={t('inputs.array.insert-menu.search.placeholder')}
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
              />
              {sections.map((section) => (
                <Fragment key={section.name}>
                  {section.title && <SectionLabel title={section.title} />}
                  {section.types.map((type) => {
                    const missingPack = getMissingModulePack(
                      type.name,
                      entitledModulePacks,
                    );

                    return missingPack ? (
                      <MenuItem
                        key={type.name}
                        disabled={true}
                        icon={LockIcon}
                        text={getModuleTitle(type.name)}
                        iconRight={
                          <Badge>{getModulePackPlanLabel(missingPack)}</Badge>
                        }
                      />
                    ) : (
                      <MenuItem
                        key={type.name}
                        icon={type.icon}
                        text={type.title ?? type.name}
                        onClick={() => append(type)}
                      />
                    );
                  })}
                </Fragment>
              ))}
              {!hasLength(sections) && (
                <Box padding={3}>
                  <Text size={1} muted={true}>
                    {t('inputs.array.insert-menu.search.no-results')}
                  </Text>
                </Box>
              )}
              {offPlanPack && (
                <>
                  <MenuDivider />
                  <Box padding={3}>
                    <Text size={1} muted={true}>
                      {getLockedModulesNote(offPlanPack)}
                    </Text>
                  </Box>
                </>
              )}
            </Menu>
          }
        />
      </Grid>
    );
  };
