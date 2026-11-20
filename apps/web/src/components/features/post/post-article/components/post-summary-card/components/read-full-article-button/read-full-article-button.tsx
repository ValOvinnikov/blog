'use client';

import { Button } from '@shinefold/ui/components/atoms/button';
import { usePostSummary } from '@web/context/post-summary-provider';

export interface IReadFullArticleButtonProps {
  label: string;
}

export const ReadFullArticleButton = ({
  label,
}: IReadFullArticleButtonProps) => {
  const { closeToArticleBody } = usePostSummary();

  return <Button onClick={closeToArticleBody}>{label}</Button>;
};
