import { countWords, isString, toInitial } from './strings';

describe(isString, () => {
  it.each([['abc'], ['']])('accepts the string %j', (value) => {
    expect(isString(value)).toBe(true);
  });

  it.each([[undefined], [null], [42], [['abc']]])('rejects %j', (value) => {
    expect(isString(value)).toBe(false);
  });
});

describe(toInitial, () => {
  it.each([
    { name: 'field notes', initial: 'F' },
    { name: '42 field notes', initial: '4' },
    { name: '  — émile’s log', initial: 'É' },
    { name: 'émile’s log', initial: 'É' },
  ])('takes "$initial" from "$name"', ({ name, initial }) => {
    expect(toInitial(name)).toBe(initial);
  });

  it.each([[''], ['  — ']])('has no initial for %j', (name) => {
    expect(toInitial(name)).toBeUndefined();
  });
});

describe(countWords, () => {
  it.each([
    { text: 'one two  three', count: 3 },
    { text: '  leading and trailing  ', count: 3 },
    { text: 'it’s a well-known fact — really.', count: 5 },
    { text: 'Ship 3 posts, then 12 more!', count: 6 },
  ])('counts $count words in "$text"', ({ text, count }) => {
    expect(countWords(text)).toBe(count);
  });

  it.each([[''], ['  — … ']])('counts no words in %j', (text) => {
    expect(countWords(text)).toBe(0);
  });
});
