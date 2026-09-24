import { makeRawFaqPageQuestion } from '@blog/service/testing/shared/fixtures';

import { resolveFaqs } from './resolve-faqs';

describe('resolveFaqs', () => {
  it('returns an empty array when the page has no FAQ module', () => {
    expect(resolveFaqs([])).toEqual([]);
  });

  it('keeps every question in first-seen order', () => {
    const first = makeRawFaqPageQuestion({ id: 'block-faq-1' });
    const second = makeRawFaqPageQuestion({ id: 'block-faq-2' });

    expect(resolveFaqs([first, second])).toEqual([first, second]);
  });

  it('dedupes a question referenced by two modules, keeping its first occurrence', () => {
    const shared = makeRawFaqPageQuestion({ id: 'block-faq-1' });
    const other = makeRawFaqPageQuestion({
      id: 'block-faq-2',
      question: 'A different question',
      answer: 'A different answer.',
    });

    const faqs = resolveFaqs([shared, other, shared]);

    expect(faqs).toEqual([shared, other]);
  });
});
