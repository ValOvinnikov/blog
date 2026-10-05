import { planTemplates } from './plan-templates';

const hero = { _type: 'reference', _ref: 'hero-1' };
const modules = [{ _key: 'm1', _type: 'module_cta', _ref: 'cta-1' }];

describe(planTemplates, () => {
  it("gives every page in a translation group the default-language page's layout", () => {
    const plan = planTemplates(
      [
        {
          _id: 'about-nl',
          _type: 'page_landing',
          language: 'NL',
          title: 'Over ons',
          modules: [],
        },
        {
          _id: 'about-en',
          _type: 'page_landing',
          language: 'EN',
          title: 'About',
          hero,
          modules,
        },
      ],
      [{ pageIds: ['about-en', 'about-nl'] }],
    );

    const expected = {
      _id: 'template-about-en',
      _type: 'template_landing',
      title: 'About',
      hero,
      modules,
    };
    expect(plan.get('about-en')).toEqual(expected);
    expect(plan.get('about-nl')).toEqual(expected);
  });

  it('gives a standalone page a template of its own', () => {
    const plan = planTemplates(
      [{ _id: 'page_home', _type: 'page_home', title: 'Home', hero }],
      [],
    );

    expect(plan.get('page_home')).toEqual({
      _id: 'template-page_home',
      _type: 'template_home',
      title: 'Home',
      hero,
      modules: undefined,
    });
  });

  it('takes the layout from the published page over its draft', () => {
    const plan = planTemplates(
      [
        {
          _id: 'drafts.about-en',
          _type: 'page_landing',
          language: 'EN',
          title: 'Draft',
          modules: [],
        },
        {
          _id: 'about-en',
          _type: 'page_landing',
          language: 'EN',
          title: 'About',
          modules,
        },
      ],
      [],
    );

    expect(plan.get('about-en')).toMatchObject({ title: 'About', modules });
  });

  it('takes the layout from a draft-only page', () => {
    const plan = planTemplates(
      [
        {
          _id: 'drafts.contact',
          _type: 'page_landing',
          language: 'EN',
          title: 'Contact',
          modules,
        },
      ],
      [],
    );

    expect(plan.get('contact')).toMatchObject({
      _id: 'template-contact',
      modules,
    });
  });
});
