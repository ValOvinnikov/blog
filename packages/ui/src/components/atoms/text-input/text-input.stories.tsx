import { ICONS, SIZE } from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { ButtonShapes } from '@blog/ui/testing/button-shapes';
import { SurfaceBands } from '@blog/ui/testing/surface-bands';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { TextInput } from './text-input';

const EMAIL = 'you@example.com';
const EMAIL_LABEL = 'Email address';

const meta = {
  title: 'Atoms/TextInput',
  component: TextInput,
  tags: ['autodocs'],
  args: {
    value: '',
    onChange: () => {},
    ariaLabel: EMAIL_LABEL,
    placeholder: EMAIL,
  },
} satisfies Meta<typeof TextInput>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithLeadingIcon: TStory = {
  args: { leadingIcon: '›' },
};

/** `leadingIcon` accepts any `ReactNode`, not just a glyph — e.g. an `Icon`. */
export const WithLeadingIconAsIcon: TStory = {
  args: { leadingIcon: <Icon name={ICONS.CHEVRON_RIGHT} size={SIZE.SM} /> },
};

export const WithTrailingIcon: TStory = {
  args: { trailingIcon: <Icon name={ICONS.CHEVRON_RIGHT} size={SIZE.SM} /> },
};

export const WithLeadingAndTrailingIcon: TStory = {
  args: {
    leadingIcon: '›',
    trailingIcon: <Icon name={ICONS.CHEVRON_RIGHT} size={SIZE.SM} />,
  },
};

export const Invalid: TStory = {
  args: { isInvalid: true, value: 'not-an-email', leadingIcon: '›' },
};

export const Disabled: TStory = {
  args: { value: EMAIL, isDisabled: true },
};

/** An empty disabled field still shows its placeholder, dimmed relative to an active field's. */
export const DisabledEmpty: TStory = {
  args: { value: '', isDisabled: true },
};

export const OnBands: TStory = {
  render: (args) => (
    <SurfaceBands>
      <TextInput {...args} />
      <TextInput {...args} isInvalid={true} value="not-an-email" />
      <TextInput {...args} isDisabled={true} value={EMAIL} />
    </SurfaceBands>
  ),
};

const InteractiveDemo = () => {
  const [value, setValue] = useState('');

  return (
    <TextInput
      value={value}
      onChange={setValue}
      ariaLabel={EMAIL_LABEL}
      placeholder={EMAIL}
      leadingIcon="›"
    />
  );
};

export const Interactive: TStory = {
  render: () => <InteractiveDemo />,
};

export const ButtonShapesRow: TStory = {
  name: 'Button shapes',
  render: (args) => (
    <ButtonShapes>{() => <TextInput {...args} />}</ButtonShapes>
  ),
};
