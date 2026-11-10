import { BUTTON_SHAPE_DECLARATIONS, type TButtonShape } from '@blog/config';
import type { ReactNode } from 'react';

import { StyleVariants } from './style-variants';

type TButtonShapesProps = {
  children: (buttonShape: TButtonShape) => ReactNode;
};

export const ButtonShapes = ({ children }: TButtonShapesProps) => (
  <StyleVariants
    declarations={BUTTON_SHAPE_DECLARATIONS}
    className="flex flex-wrap items-start gap-8"
    variantClassName="flex flex-col items-start gap-3"
  >
    {children}
  </StyleVariants>
);
