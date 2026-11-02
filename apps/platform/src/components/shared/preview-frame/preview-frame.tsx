import { hasArrayGotItems } from '@blog/utils/primitives';
import { PreviewFrameHeading } from '@platform/components/shared/preview-frame/components/heading/preview-frame-heading';
import { PreviewFrameStage } from '@platform/components/shared/preview-frame/components/stage/preview-frame-stage';
import { PreviewFrameStatus } from '@platform/components/shared/preview-frame/components/status/preview-frame-status';
import { PreviewFrameToolbar } from '@platform/components/shared/preview-frame/components/toolbar/preview-frame-toolbar';
import { mapCompoundSlots, type TCompoundComponent } from '@platform/lib/react';
import { Fragment, type ElementType, type ReactNode } from 'react';

import { previewFrameVariants } from './preview-frame-variants';

const PreviewFrameParts = {
  Heading: PreviewFrameHeading,
  Toolbar: PreviewFrameToolbar,
  Stage: PreviewFrameStage,
  Status: PreviewFrameStatus,
} satisfies Record<string, ElementType>;

type TPreviewFrameProps = {
  ariaLabel: string;
  widthControl?: ReactNode;
  controls?: ReactNode;
  actions?: ReactNode;
  isNarrow?: boolean;
  notes?: ReactNode;
  children: ReactNode;
};

const PreviewFrameRoot = ({
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
    actions: actionsSlot,
    stage,
    frame,
    notes: notesSlot,
  } = previewFrameVariants({ isNarrow });
  const { slots, unmatched } = mapCompoundSlots(children, PreviewFrameParts);
  const hasToolbar = Boolean(widthControl || controls || actions);

  return (
    <section aria-label={ariaLabel} className={root()}>
      {slots.Heading}
      {hasToolbar && (
        <div className={toolbar()}>
          {widthControl}
          {controls}
          {actions && <div className={actionsSlot()}>{actions}</div>}
        </div>
      )}
      {slots.Toolbar}
      {hasArrayGotItems(unmatched) && (
        <div className={stage()}>
          <div className={frame()}>
            {unmatched.map((node, index) => (
              <Fragment key={index}>{node}</Fragment>
            ))}
          </div>
        </div>
      )}
      {slots.Stage}
      {slots.Status}
      {notes && <div className={notesSlot()}>{notes}</div>}
    </section>
  );
};

export const PreviewFrame: TCompoundComponent<
  typeof PreviewFrameRoot,
  typeof PreviewFrameParts
> = Object.assign(PreviewFrameRoot, PreviewFrameParts);
