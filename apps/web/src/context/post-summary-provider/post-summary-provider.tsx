'use client';

import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config';
import type { IWithChildren } from '@shinefold/config/react';
import {
  createContext,
  type RefObject,
  useContext,
  useId,
  useRef,
  useState,
} from 'react';

export interface IPostSummaryContextValue {
  isOpen: boolean;
  cardId: string;
  articleBodyRef: RefObject<TMaybeNull<HTMLDivElement>>;
  toggle: () => void;
  closeToArticleBody: () => void;
}

const PostSummaryContext =
  createContext<TMaybeUndefined<IPostSummaryContextValue>>(undefined);

export const PostSummaryProvider = ({ children }: IWithChildren) => {
  const [isOpen, setIsOpen] = useState(false);
  const cardId = useId();
  const articleBodyRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    setIsOpen((open) => !open);
  };

  const closeToArticleBody = () => {
    setIsOpen(false);
    articleBodyRef.current?.focus();
  };

  return (
    <PostSummaryContext.Provider
      value={{ isOpen, cardId, articleBodyRef, toggle, closeToArticleBody }}
    >
      {children}
    </PostSummaryContext.Provider>
  );
};

export const usePostSummary = (): IPostSummaryContextValue => {
  const context = useContext(PostSummaryContext);
  if (!context) {
    throw new Error('usePostSummary must be used within a PostSummaryProvider');
  }
  return context;
};
