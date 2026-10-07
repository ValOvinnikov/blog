import { showToggleField } from '@blog/studio/schema-types/fields/show-toggle-field/show-toggle-field';

export const showImagesField = ({ subject }: { subject: string }) =>
  showToggleField({
    name: 'showImages',
    title: 'Show Images',
    description: `Show each ${subject}'s image on its card.`,
    initialValue: true,
  });
