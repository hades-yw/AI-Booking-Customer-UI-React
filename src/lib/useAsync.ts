import { useEffect, useRef, useState } from "react";

interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
}

/**
 * Runs an async fetcher on mount and whenever `deps` change, exposing a
 * simple {data, loading, error} tuple. Guards against setting state after
 * the effect has been superseded (fast tab switches, dep changes mid-flight).
 */
export function useAsync<T>(fetcher: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: undefined, loading: true, error: undefined });
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    setState((prev) => ({ ...prev, loading: true, error: undefined }));

    fetcher()
      .then((data) => {
        if (requestId.current === id) setState({ data, loading: false, error: undefined });
      })
      .catch((error: Error) => {
        if (requestId.current === id) setState({ data: undefined, loading: false, error });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
