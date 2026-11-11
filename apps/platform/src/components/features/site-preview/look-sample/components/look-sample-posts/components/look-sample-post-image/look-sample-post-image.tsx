import { lookSamplePostImageVariants } from './look-sample-post-image-variants';

export const LookSamplePostImage = () => {
  const { root } = lookSamplePostImageVariants();

  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      aria-hidden="true"
      className={root()}
    >
      <path d="M-10 100 C 30 80, 60 80, 100 100 S 170 120, 210 100 S 280 80, 330 100" />
      <path
        d="M-10 130 C 30 110, 60 110, 100 130 S 170 150, 210 130 S 280 110, 330 130"
        strokeOpacity={0.6}
      />
    </svg>
  );
};
