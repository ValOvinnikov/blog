import { emailTemplatePreviewVariants } from './email-template-preview-variants';

export type TEmailTemplatePreviewProps = {
  html: string;
  title: string;
};

/**
 * Renders the authored subject and body through the same read and
 * serializer the real send path uses, so that copy matches what goes out —
 * but the surrounding structure (actions, headers, brand fallback) is
 * generic and doesn't reproduce what any one template type actually sends.
 * Sandboxed: the HTML is a full document with its own inline styles, not
 * something to compose with the admin panel's own CSS.
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
