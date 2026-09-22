import type { TPortableTextBody } from '@blog/service';
import {
  mergeComponents,
  PortableText as PortableTextRoot,
  type PortableTextComponents,
} from '@portabletext/react';

import { baseComponents } from './config';

export interface IPortableTextProps {
  value: TPortableTextBody;
  components?: PortableTextComponents;
}

export const PortableText = ({ value, components }: IPortableTextProps) => {
  const merged = components
    ? mergeComponents(baseComponents, components)
    : baseComponents;

  return <PortableTextRoot value={value} components={merged} />;
};
