export const appendSearchParams = (key: string, value: string) => {
  const url = new URL(window.location.href);

  if (url.searchParams.has(key)) {
    url.searchParams.set(key, value);
  } else {
    url.searchParams.append(key, value);
  }

  history.replaceState(null, "", url.toString());
};
