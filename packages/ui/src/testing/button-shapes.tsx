import {
  BUTTON_SHAPE,
  BUTTON_SHAPE_DECLARATIONS,
  type TButtonShape,
} from '@blog/config';
import type { CSSProperties, ReactNode } from 'react';

type TButtonShapesProps = {
  children: (buttonShape: TButtonShape) => ReactNode;
};

export const ButtonShapes = ({ children }: TButtonShapesProps) => (
  <div className="flex flex-wrap items-start gap-8">
    {Object.values(BUTTON_SHAPE).map((buttonShape) => (
      <div
        key={buttonShape}
        className="flex flex-col items-start gap-3"
        style={BUTTON_SHAPE_DECLARATIONS[buttonShape] as CSSProperties}
      >
        <p>{buttonShape}</p>
        {children(buttonShape)}
      </div>
    ))}
  </div>
);
