import {
  EMPTY_REDIRECT_PLAN,
  planLandingRedirects,
} from '@blog/studio/document-actions/plan-landing-redirects/plan-landing-redirects';

const move = (from: string, to: string, livePaths: string[] = []) => ({
  from,
  to,
  isPrefix: livePaths.length > 0,
  livePaths,
});

describe(planLandingRedirects, () => {
  it('plans nothing when the path is unchanged', () => {
    expect(planLandingRedirects(move('/faq', '/faq'), [])).toEqual(
      EMPTY_REDIRECT_PLAN,
    );
  });

  it('redirects the old path to the new one', () => {
    expect(planLandingRedirects(move('/faq', '/help/faq'), [])).toEqual({
      create: { source: '/faq', destination: '/help/faq', isPrefix: false },
      update: [],
      remove: [],
    });
  });

  it('makes one prefix redirect when the page has sub-pages', () => {
    const plan = planLandingRedirects(
      move('/modules', '/catalog', ['/catalog/faq', '/catalog/pricing']),
      [],
    );

    expect(plan.create).toEqual({
      source: '/modules',
      destination: '/catalog',
      isPrefix: true,
    });
  });

  it('points a redirect that led to the old path at the new one', () => {
    const plan = planLandingRedirects(move('/faq', '/help/faq'), [
      { _id: 'r1', source: '/questions', destination: '/faq' },
    ]);

    expect(plan.update).toEqual([{ _id: 'r1', destination: '/help/faq' }]);
  });

  it('rebases a redirect into the moved subtree', () => {
    const plan = planLandingRedirects(
      move('/modules', '/catalog', ['/catalog/faq']),
      [{ _id: 'r1', source: '/old-faq', destination: '/modules/faq' }],
    );

    expect(plan.update).toEqual([{ _id: 'r1', destination: '/catalog/faq' }]);
  });

  it('leaves a redirect beneath the old path alone when the page has no sub-pages', () => {
    const plan = planLandingRedirects(move('/modules', '/catalog'), [
      { _id: 'r1', source: '/old-faq', destination: '/modules/faq' },
    ]);

    expect(plan.update).toEqual([]);
    expect(plan.remove).toEqual([]);
  });

  it('removes a redirect that would loop once the page moves back', () => {
    const plan = planLandingRedirects(move('/help/faq', '/faq'), [
      { _id: 'r1', source: '/faq', destination: '/help/faq' },
    ]);

    expect(plan.remove).toEqual(['r1']);
    expect(plan.update).toEqual([]);
  });

  it('removes a redirect whose source is now a live page', () => {
    const plan = planLandingRedirects(
      move('/modules', '/catalog', ['/catalog/faq']),
      [
        { _id: 'r1', source: '/catalog', destination: '/shop' },
        { _id: 'r2', source: '/catalog/faq', destination: '/help' },
      ],
    );

    expect(plan.remove).toEqual(['r1', 'r2']);
  });

  it('replaces an existing redirect from the old path', () => {
    const plan = planLandingRedirects(move('/faq', '/help/faq'), [
      { _id: 'r1', source: '/faq', destination: '/somewhere' },
    ]);

    expect(plan.remove).toEqual(['r1']);
    expect(plan.create?.destination).toBe('/help/faq');
  });
});
