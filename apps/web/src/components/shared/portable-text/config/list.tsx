import type { PortableTextReactComponents } from '@portabletext/react';

import { portableTextVariants } from '../portable-text-variants';

const s = portableTextVariants();

export const listComponents: PortableTextReactComponents['list'] = {
  bullet: ({ children }) => <ul className={s.bulletList()}>{children}</ul>,
  number: ({ children }) => <ol className={s.numberList()}>{children}</ol>,
};
