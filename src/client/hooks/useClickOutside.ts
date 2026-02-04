import { RefObject, useEffect, useCallback } from 'react';

export const useClickOutside = (ref: RefObject<HTMLElement>, callback: () => void) => {
  const handleClick = useCallback((e: MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.localName === "html") {
      return;
    }
    if (ref.current && !ref.current.contains(e.target as HTMLElement)) {
      callback();
    }
  }, [ref, callback]);

  useEffect(() => {
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    }
  }, [handleClick]); // Add dependency array
}