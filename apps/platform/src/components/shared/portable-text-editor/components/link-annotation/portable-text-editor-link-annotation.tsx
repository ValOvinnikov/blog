import type { AnnotationRenderProps } from '@portabletext/editor';
import { sanitizeHref } from '@shinefold/email/html';

import { portableTextEditorLinkAnnotationVariants } from './portable-text-editor-link-annotation-variants';

export const PortableTextEditorLinkAnnotation = ({
  annotation,
  children,
}: AnnotationRenderProps) => {
  const { href } = annotation;
  const safeHref = sanitizeHref(typeof href === 'string' ? href : '');

  return (
    <a
      href={safeHref ?? undefined}
      rel="noopener noreferrer"
      className={
        safeHref ? portableTextEditorLinkAnnotationVariants() : undefined
      }
    >
      {children}
    </a>
  );
};
