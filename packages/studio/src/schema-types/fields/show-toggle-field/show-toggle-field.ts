import { EnabledStateBooleanInput } from '@shinefold/studio/schema-types/inputs/enabled-state-boolean-input/enabled-state-boolean-input';
import { type ConditionalProperty, defineField } from 'sanity';

type TShowToggleFieldOptions = {
  name: string;
  title: string;
  description: string;
  initialValue: boolean;
  hidden?: ConditionalProperty;
};

export const showToggleField = ({
  name,
  title,
  description,
  initialValue,
  hidden,
}: TShowToggleFieldOptions) =>
  defineField({
    name,
    title,
    type: 'boolean',
    description,
    components: { input: EnabledStateBooleanInput },
    initialValue,
    hidden,
  });
