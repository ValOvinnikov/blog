import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import {
  ConsentPreferences,
  type IConsentCategory,
} from './consent-preferences';

const categories: IConsentCategory[] = [
  {
    id: 'necessary',
    label: 'Necessary',
    description: 'Required for the site to function and cannot be disabled.',
    isLocked: true,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Helps us understand how the site is used.',
  },
  {
    id: 'marketing',
    label: 'Marketing',
    description: 'Used to show relevant ads on other sites.',
  },
];

const initialValues: Record<string, boolean> = {
  necessary: true,
  analytics: true,
  marketing: false,
};

const meta = {
  title: 'Molecules/ConsentPreferences',
  component: ConsentPreferences,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    headingLevel: 2,
    heading: 'Manage cookie preferences',
    categories,
    values: initialValues,
    onCategoryChange: () => {},
    saveLabel: 'Save preferences',
    onSave: () => {},
  },
} satisfies Meta<typeof ConsentPreferences>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

const InteractiveDemo = () => {
  const [values, setValues] = useState(initialValues);

  return (
    <ConsentPreferences
      headingLevel={2}
      heading="Manage cookie preferences"
      categories={categories}
      values={values}
      onCategoryChange={(id, checked) =>
        setValues((current) => ({ ...current, [id]: checked }))
      }
      saveLabel="Save preferences"
      onSave={() => {}}
    />
  );
};

export const Interactive: TStory = {
  render: () => <InteractiveDemo />,
};
