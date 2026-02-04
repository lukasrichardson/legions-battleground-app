export const  appendQueryParams = (
  baseUrl: string,
  params: Record<string, string | number | boolean | string[] | undefined | null>
): string => {
  const url = new URL(baseUrl);
  const searchParams = new URLSearchParams(url.search);

  for (const key in params) {
    const value = params[key];
    // Check if the value is not null or undefined, and is not an empty string
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      if (Array.isArray(value)) {
        // If the value is an array, append each item as a separate parameter
        value.forEach(item => {
          searchParams.append(key, String(item));
        });
      } else {
        searchParams.set(key, String(value));
      }
    }
  }

  url.search = searchParams.toString();
  return url.toString();
}