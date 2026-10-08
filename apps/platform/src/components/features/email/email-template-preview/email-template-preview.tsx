import { emailTemplatePreviewVariants } from './email-template-preview-variants';

export type TEmailPreviewWidth = 'desktop' | 'mobile';

export type TEmailTemplatePreviewProps = {
  html: string;
  title: string;
  width?: TEmailPreviewWidth;
};

// Sandboxed: the HTML is a full document with its own inline styles.
export const EmailTemplatePreview = ({
  html,
  title,
  width = 'desktop',
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
