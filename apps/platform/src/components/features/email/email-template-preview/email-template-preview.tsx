import { emailTemplatePreviewVariants } from './email-template-preview-variants';

export type TEmailTemplatePreviewProps = {
  html: string;
  title: string;
};

/**
 * Shows the HTML body only: sending headers (`List-Unsubscribe`), the
 * tenant-level logo and footer address, and the unbranded fallback used when
 * no tenant resolves for a host are not represented. Sandboxed, because the
 * HTML is a full document with its own inline styles.
 */
export const EmailTemplatePreview = ({
  html,
  title,
}: TEmailTemplatePreviewProps) => {
  const { root, frame } = emailTemplatePreviewVariants();

  return (
    <div className={root()}>
      <iframe title={title} srcDoc={html} sandbox="" className={frame()} />
    </div>
  );
};
