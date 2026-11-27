import { Card, Flex, Switch, Text } from '@sanity/ui';
import { toShownToggleValue } from '@shinefold/studio/schema-types/inputs/enabled-state-boolean-input/to-shown-toggle-value';
import { FormField, type BooleanInputProps } from 'sanity';

export const EnabledStateBooleanInput = (props: BooleanInputProps) => {
  const {
    schemaType,
    value,
    elementProps,
    id,
    path,
    level,
    validation,
    readOnly,
  } = props;
  const shownValue = toShownToggleValue(value, schemaType.initialValue);
  const checked = shownValue ?? false;
  const indeterminate = typeof shownValue !== 'boolean';

  return (
    <FormField
      title={schemaType.title}
      description={schemaType.description}
      inputId={id}
      path={path}
      level={level}
      validation={validation}
    >
      <Card
        border={true}
        radius={2}
        padding={3}
        tone={readOnly ? 'transparent' : undefined}
      >
        <Flex align="center" gap={3}>
          <Switch
            {...elementProps}
            checked={checked}
            readOnly={readOnly}
            indeterminate={indeterminate}
          />
          <Text size={1}>{checked ? 'Enabled' : 'Disabled'}</Text>
        </Flex>
      </Card>
    </FormField>
  );
};
