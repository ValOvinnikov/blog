import { toToolbarIcon } from '@blog/studio/schema-types/portable-text/toolbar-icon/toolbar-icon';
import {
  Bold,
  Code,
  Italic,
  Strikethrough,
  Subscript,
  Superscript,
  Underline,
} from 'lucide-react';
import type { BlockDecoratorDefinition } from 'sanity';

export const boldDecorator: BlockDecoratorDefinition = {
  title: 'Bold',
  value: 'strong',
  icon: toToolbarIcon(Bold),
};

export const italicDecorator: BlockDecoratorDefinition = {
  title: 'Italic',
  value: 'em',
  icon: toToolbarIcon(Italic),
};

export const codeDecorator: BlockDecoratorDefinition = {
  title: 'Code',
  value: 'code',
  icon: toToolbarIcon(Code),
};

export const underlineDecorator: BlockDecoratorDefinition = {
  title: 'Underline',
  value: 'underline',
  icon: toToolbarIcon(Underline),
};

export const strikeThroughDecorator: BlockDecoratorDefinition = {
  title: 'Strike',
  value: 'strike-through',
  icon: toToolbarIcon(Strikethrough),
};

export const subscriptDecorator: BlockDecoratorDefinition = {
  title: 'Subscript',
  value: 'sub',
  icon: toToolbarIcon(Subscript),
};

export const superscriptDecorator: BlockDecoratorDefinition = {
  title: 'Superscript',
  value: 'sup',
  icon: toToolbarIcon(Superscript),
};
