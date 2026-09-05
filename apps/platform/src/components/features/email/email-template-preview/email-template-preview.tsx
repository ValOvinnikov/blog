import { emailTemplatePreviewVariants } from './email-template-preview-variants';

export type TEmailTemplatePreviewProps = {
  html: string;
  title: string;
};

/**
 * Renders exactly the HTML the tenant's email would send — built by
 * `buildTenantEmail`, the same function the real send path calls — so this
 * can never drift from what actually goes out. Sandboxed: the HTML is a
 * full document with its own inline styles, not something to compose with
 * the admin panel's own CSS.
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
