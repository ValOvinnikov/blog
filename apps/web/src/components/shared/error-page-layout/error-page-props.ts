export type TErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};
