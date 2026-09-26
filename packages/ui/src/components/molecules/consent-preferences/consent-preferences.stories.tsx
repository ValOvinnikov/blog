import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import {
  ConsentPreferences,
  type IConsentCategory,
} from './consent-preferences';

const initialCategories: IConsentCategory[] = [
  {
    id: 'necessary',
    label: 'Necessary',
    description: 'Required for the site to function and cannot be disabled.',
    checked: true,
    locked: true,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Helps us understand how the site is used.',
    checked: true,
  },
  {
    id: 'marketing',
    label: 'Marketing',
    description: 'Used to show relevant ads on other sites.',
    checked: false,
  },
];

const meta = {
  title: 'Molecules/ConsentPreferences',
  component: ConsentPreferences,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    headingLevel: 2,
    heading: 'Manage cookie preferences',
    categories: initialCategories,
    onCategoryChange: () => {},
    saveLabel: 'Save preferences',
    onSave: () => {},
  },
} satisfies Meta<typeof ConsentPreferences>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

const InteractiveDemo = () => {
  const [categories, setCategories] = useState(initialCategories);

  return (
    <ConsentPreferences
      headingLevel={2}
      heading="Manage cookie preferences"
      categories={categories}
      onCategoryChange={(id, checked) =>
        setCategories((current) =>
          current.map((category) =>
            category.id === id ? { ...category, checked } : category,
          ),
        )
      }
      saveLabel="Save preferences"
      onSave={() => {}}
    />
  );
};

export const Interactive: TStory = {
  render: () => <InteractiveDemo />,
};
