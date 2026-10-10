import { PREVIEW_WIDTH, type TPreviewWidth } from '@blog/config';

import { emailTemplatePreviewVariants } from './email-template-preview-variants';

export type TEmailTemplatePreviewProps = {
  html: string;
  title: string;
  width?: TPreviewWidth;
};

// Sandboxed: the HTML is a full document with its own inline styles.
export const EmailTemplatePreview = ({
  html,
  title,
  width = PREVIEW_WIDTH.DESKTOP,
}: TEmailTemplatePreviewProps) => {
  const { root, frame } = emailTemplatePreviewVariants({ width });

  return (
    <div className={root()}>
      <iframe
        title={title}
        srcDoc={html}
        sandbox=""
        className={frame()}
        data-width={width}
      />
    </div>
  );
};
