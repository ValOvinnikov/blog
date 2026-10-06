export const GRID_IMAGE_SIZES: Record<1 | 2 | 3 | 4, string> = {
  1: '100vw',
  2: '(min-width: 640px) 50vw, 100vw',
  3: '(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw',
  4: '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw',
};

export const CAROUSEL_IMAGE_SIZES =
  '(min-width: 768px) 33vw, (min-width: 640px) 50vw, 85vw';
