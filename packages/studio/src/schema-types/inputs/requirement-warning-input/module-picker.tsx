import { textSizedIcon } from '@blog/studio/schema-types/icons/text-sized-icon/text-sized-icon';
import {
  getMissingModulePack,
  getModulePackPlanLabel,
  type TEntitlementState,
} from '@blog/studio/schema-types/inputs/requirement-warning-input/get-missing-requirement';
import { getModulePickerSections } from '@blog/studio/schema-types/inputs/requirement-warning-input/module-picker-sections';
import { getModuleTitle } from '@blog/studio/structure/module-kinds/module-kinds';
import { Badge, Box, Button, Grid, Text, TextInput } from '@sanity/ui';
import { Menu, MenuButton, MenuDivider, MenuItem } from '@sanity/ui/menu';
import { Lock, Plus, Search } from 'lucide-react';
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
const LockIcon = textSizedIcon(Lock);

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
    const { sections, offPlan } = getModulePickerSections({
      types: schemaType.of,
      groups: schemaType.options?.insertMenu?.groups,
      entitledModulePacks,
      query,
    });
    const offPlanPack = offPlan
      .map(({ name }) => getMissingModulePack(name, entitledModulePacks))
      .find(Boolean);
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
                  {section.types.map((type) => (
                    <MenuItem
                      key={type.name}
                      icon={type.icon}
                      text={type.title ?? type.name}
                      onClick={() => append(type)}
                    />
                  ))}
                </Fragment>
              ))}
              {offPlanPack && (
                <>
                  <MenuDivider />
                  <SectionLabel title={getModulePackPlanLabel(offPlanPack)} />
                  {offPlan.map(({ name }) => (
                    <MenuItem
                      key={name}
                      disabled={true}
                      icon={LockIcon}
                      text={getModuleTitle(name)}
                      iconRight={
                        <Badge>{getModulePackPlanLabel(offPlanPack)}</Badge>
                      }
                    />
                  ))}
                </>
              )}
              {!offPlanPack && sections.length === 0 && (
                <Box padding={3}>
                  <Text size={1} muted={true}>
                    {t('inputs.array.insert-menu.search.no-results')}
                  </Text>
                </Box>
              )}
            </Menu>
          }
        />
      </Grid>
    );
  };
