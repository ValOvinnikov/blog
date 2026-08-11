import { Card, Flex, Switch, Text } from '@sanity/ui';
import { FormField, type BooleanInputProps } from 'sanity';

/**
 * Sanity's default boolean input reuses the field's `title` as both the
 * header label and the switch's own inline text, so a "Divider" field always
 * renders "Divider" next to the switch regardless of its value. This input
 * keeps the title as a normal field label and shows the current value
 * ("Enabled"/"Disabled") next to the switch instead.
 */
export function EnabledStateBooleanInput(props: BooleanInputProps) {
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
  const checked = value ?? false;
  const indeterminate = typeof value !== 'boolean';

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
}
