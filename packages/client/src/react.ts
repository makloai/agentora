// @agentora/client/react — minimal hooks over a typed client action.
// React is a peer dependency; nothing here imports server code.
import { useCallback, useState } from 'react';

export interface ActionState<O> {
  data?: O;
  error?: unknown;
  loading: boolean;
}

export interface UseAction<I, O> extends ActionState<O> {
  /** Invoke the action; resolves with the output and updates state. */
  run: (input: I) => Promise<O>;
  /** Reset back to the idle state. */
  reset: () => void;
}

/**
 * Wrap a client action (e.g. `client.products.search`) in loading/data/error
 * state. The action is any `(input) => Promise<output>` — exactly what the typed
 * client's leaf methods are.
 */
export function useAction<I, O>(action: (input: I) => Promise<O>): UseAction<I, O> {
  const [state, setState] = useState<ActionState<O>>({ loading: false });

  const run = useCallback(
    async (input: I) => {
      setState({ loading: true });
      try {
        const data = await action(input);
        setState({ data, loading: false });
        return data;
      } catch (error) {
        setState({ error, loading: false });
        throw error;
      }
    },
    [action]
  );

  const reset = useCallback(() => setState({ loading: false }), []);

  return { ...state, run, reset };
}
