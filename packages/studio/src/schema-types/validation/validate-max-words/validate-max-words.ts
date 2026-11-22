import {
  countBlockWords,
  type TTextBlock,
} from '@shinefold/utils/portable-text';

export const validateMaxWords =
  (maxWords: number) =>
  (value: TTextBlock[] | undefined): true | string => {
    const words = countBlockWords(value ?? []);

    return words > maxWords
      ? `Keep it to ${maxWords} words or fewer; this has ${words}.`
      : true;
  };
