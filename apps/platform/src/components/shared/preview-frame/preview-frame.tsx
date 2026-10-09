import type { ReactNode } from 'react';

import { previewFrameVariants } from './preview-frame-variants';

export type TPreviewFrameProps = {
  ariaLabel: string;
  widthControl: ReactNode;
  controls?: ReactNode;
  actions?: ReactNode;
  isNarrow?: boolean;
  notes?: ReactNode;
  children: ReactNode;
};

export const PreviewFrame = ({
  ariaLabel,
  widthControl,
  controls,
  actions,
  isNarrow = false,
  notes,
  children,
}: TPreviewFrameProps) => {
  const {
    root,
    toolbar,
    widthControl: widthControlSlot,
    actions: actionsSlot,
    stage,
    frame,
    notes: notesSlot,
  } = previewFrameVariants({ isNarrow });

  return (
    <section aria-label={ariaLabel} className={root()}>
      <div className={toolbar()}>
        <div className={widthControlSlot()}>{widthControl}</div>
        {controls}
        {actions && <div className={actionsSlot()}>{actions}</div>}
      </div>
      <div className={stage()}>
        <div className={frame()}>{children}</div>
      </div>
      {notes && <div className={notesSlot()}>{notes}</div>}
    </section>
  );
};
