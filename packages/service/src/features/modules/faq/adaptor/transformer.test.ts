import { BRAND_VARIANT, CONTENT_ALIGNMENT } from '@blog/config';
import {
  makeRawCtaButton,
  makeRawFaqModule,
  makeRawFaqQuestionItem,
} from '@blog/service/testing/modules/fixtures';

import { toFaqModule } from './transformer';

describe('toFaqModule', () => {
  it('maps brandVariant straight through', () => {
    const raw = makeRawFaqModule({ brandVariant: BRAND_VARIANT.SECONDARY });

    const module = toFaqModule(raw);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('leaves contentAlignment and layout undefined when unset (no faked default)', () => {
    const raw = makeRawFaqModule({ contentAlignment: null, layout: null });

    const module = toFaqModule(raw);

    expect(module.contentAlignment).toBeUndefined();
    expect(module.layout).toBeUndefined();
  });

  it('passes through an authored contentAlignment', () => {
    const raw = makeRawFaqModule({
      contentAlignment: CONTENT_ALIGNMENT.CENTER,
    });

    const module = toFaqModule(raw);

    expect(module.contentAlignment).toBe(CONTENT_ALIGNMENT.CENTER);
  });

  it('keeps the questions in authored order', () => {
    const raw = makeRawFaqModule({
      questions: [
        makeRawFaqQuestionItem({ _id: 'question-b' }),
        makeRawFaqQuestionItem({ _id: 'question-a' }),
      ],
    });

    const module = toFaqModule(raw);

    expect(module.questions.map((question) => question.id)).toEqual([
      'question-b',
      'question-a',
    ]);
  });

  it('maps a dereferenced question to its id, question text and rich-text answer', () => {
    const raw = makeRawFaqModule({
      questions: [
        makeRawFaqQuestionItem({
          _id: 'question-pricing',
          question: 'How much does it cost?',
        }),
      ],
    });

    const module = toFaqModule(raw);

    expect(module.questions[0]).toMatchObject({
      id: 'question-pricing',
      question: 'How much does it cost?',
    });
    expect(module.questions[0]?.answer[0]?.children?.[0]?.text).toBe(
      'Most teams are live within a week.',
    );
  });

  it('returns an empty array for an absent ctaButtons field', () => {
    const raw = makeRawFaqModule({ ctaButtons: null });

    const module = toFaqModule(raw);

    expect(module.ctaButtons).toEqual([]);
  });

  it('maps authored ctaButtons', () => {
    const raw = makeRawFaqModule({ ctaButtons: [makeRawCtaButton()] });

    const module = toFaqModule(raw);

    expect(module.ctaButtons).toHaveLength(1);
    expect(module.ctaButtons[0]).toMatchObject({
      link: { label: 'Subscribe', href: '/newsletter' },
    });
  });
});
