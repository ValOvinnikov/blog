import {
  createOptionTilesInput,
  type TOptionTile,
} from '@blog/studio/schema-types/inputs/option-tiles-input/option-tiles-input';
import type { ComponentType } from 'react';
import { defineField, type StringDefinition } from 'sanity';

type TTileField<T extends string> = {
  name: string;
  title: string;
  description: string;
  tiles: readonly TOptionTile<T>[];
  emptyTitle?: string;
  Picture: ComponentType<{ value: T }>;
  initialValue?: T;
  validation?: StringDefinition['validation'];
  hidden?: StringDefinition['hidden'];
};

export const tileField = <T extends string>({
  name,
  title,
  description,
  tiles,
  emptyTitle,
  Picture,
  initialValue,
  validation,
  hidden,
}: TTileField<T>) =>
  defineField({
    name,
    title,
    type: 'string',
    description,
    options: { layout: 'radio', list: [...tiles] },
    components: {
      input: createOptionTilesInput({ tiles, emptyTitle, Picture }),
    },
    initialValue,
    validation,
    hidden,
  });
