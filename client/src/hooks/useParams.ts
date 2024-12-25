export const useParams = (...args: string[]): string[] => {
  const href = window.location.href;
  const URL = new window.URL(href);

  return [...URL.searchParams]
    .filter((param) => args.includes(param[0]))
    .map((p) => p[1]);
};
