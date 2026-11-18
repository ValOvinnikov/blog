import { Card, Flex, Switch, Text } from '@sanity/ui';
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
};
