export const setQueryParams = (name: string, value: string | null) => {
  const url = new URL(window.location.href);
  if (!value) {
    url.searchParams.delete(name);
  } else {
    url.searchParams.set(name, value);
  }

  const method = "replaceState";
  window.history[method](null, "", url);
};
