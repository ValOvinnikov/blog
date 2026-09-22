import { referencingModuleIdsQuery } from './query';

describe('referencingModuleIdsQuery', () => {
  it('selects modules by exact type prefix', () => {
    expect(referencingModuleIdsQuery.query).toContain(
      'string::startsWith(_type, "module_")',
    );
  });

  it('never selects modules with a tokenized match, which would also accept blog_module', () => {
    expect(referencingModuleIdsQuery.query).not.toContain('match');
  });

  it('matches a module that references the document directly', () => {
    expect(referencingModuleIdsQuery.query).toContain(
      'references($documentId)',
    );
  });

  it('matches a module that reaches the document through a link', () => {
    expect(referencingModuleIdsQuery.query).toContain(
      'references(*[_type == "link" && references($documentId)]._id)',
    );
  });

  it('parses a list of ids', () => {
    expect(() =>
      referencingModuleIdsQuery.parse(['module-a', 'module-b']),
    ).not.toThrow();
  });

  it('parses an empty list', () => {
    expect(() => referencingModuleIdsQuery.parse([])).not.toThrow();
  });

  it('rejects a result that is not a list of ids', () => {
    expect(() =>
      referencingModuleIdsQuery.parse([{ _id: 'module-a' }]),
    ).toThrow();
  });
});
