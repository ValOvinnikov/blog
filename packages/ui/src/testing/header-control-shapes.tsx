import {
  HEADER_CONTROL_SHAPE_DECLARATIONS,
  type THeaderControlShape,
} from '@blog/config';
import type { ReactNode } from 'react';

import { StyleVariants } from './style-variants';

type THeaderControlShapesProps = {
  children: (headerControlShape: THeaderControlShape) => ReactNode;
};

export const HeaderControlShapes = ({
  children,
}: THeaderControlShapesProps) => (
  <StyleVariants
    declarations={HEADER_CONTROL_SHAPE_DECLARATIONS}
    className="flex flex-wrap items-start gap-8"
    variantClassName="flex flex-col items-start gap-3"
  >
    {children}
  </StyleVariants>
);
