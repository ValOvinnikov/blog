import { EnabledStateBooleanInput } from '@blog/studio/schema-types/inputs/enabled-state-boolean-input';
import { defineField } from 'sanity';

type TShowToggleFieldOptions = {
  name: string;
  title: string;
  description: string;
  initialValue: boolean;
};

export const showToggleField = ({
  name,
  title,
  description,
  initialValue,
}: TShowToggleFieldOptions) =>
  defineField({
    name,
    title,
    type: 'boolean',
    description,
    components: { input: EnabledStateBooleanInput },
    initialValue,
  });
