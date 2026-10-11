import { useEffect, useRef } from 'react';

export function useDebouncedCallback<A extends unknown[]>(fn: (...args: A) => void, delayMs: number) {
  const fnRef = useRef(fn);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  fnRef.current = fn;

  useEffect(() => () => clearTimeout(timer.current), []);

  return {
    call: (...args: A) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fnRef.current(...args), delayMs);
    },
    cancel: () => clearTimeout(timer.current),
  };
}
