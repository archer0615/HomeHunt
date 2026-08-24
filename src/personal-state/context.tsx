import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { PersonalStateRepository } from './repository';
import { emptyPersonalState, type ListingPersonalState } from './types';

interface PersonalStateContextValue {
  ready: boolean;
  states: Record<string, ListingPersonalState>;
  error?: Error;
  toggleFavorite: (id: string) => Promise<void>;
  toggleVisited: (id: string) => Promise<void>;
  exclude: (id: string) => Promise<void>;
  undoExclude: (id: string) => Promise<void>;
}
const Context = createContext<PersonalStateContextValue | undefined>(undefined);
const defaultRepository = new PersonalStateRepository();
export function PersonalStateProvider({
  children,
  repository = defaultRepository,
}: {
  children: ReactNode;
  repository?: PersonalStateRepository;
}) {
  const [states, setStates] = useState<Record<string, ListingPersonalState>>({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error>();
  useEffect(() => {
    void repository
      .getAll()
      .then((items) => setStates(Object.fromEntries(items.map((item) => [item.listingId, item]))))
      .then(() => setReady(true))
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason : new Error('個人狀態載入失敗'));
        setReady(true);
      });
  }, [repository]);
  const update = useCallback(
    async (
      id: string,
      patch: Partial<Pick<ListingPersonalState, 'favorite' | 'excluded' | 'visited'>>,
    ) => {
      try {
        const next = await repository.set(id, patch);
        setStates((current) => ({ ...current, [id]: next }));
      } catch (reason) {
        setError(reason instanceof Error ? reason : new Error('個人狀態儲存失敗'));
        throw reason;
      }
    },
    [repository],
  );
  const value = useMemo(
    () => ({
      ready,
      states,
      error,
      toggleFavorite: async (id: string) =>
        update(id, { favorite: !(states[id] ?? emptyPersonalState(id)).favorite }),
      toggleVisited: async (id: string) =>
        update(id, { visited: !(states[id] ?? emptyPersonalState(id)).visited }),
      exclude: async (id: string) => update(id, { excluded: true }),
      undoExclude: async (id: string) => update(id, { excluded: false }),
    }),
    [ready, states, error, update],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
// eslint-disable-next-line react-refresh/only-export-components
export function usePersonalState(): PersonalStateContextValue {
  const value = useContext(Context);
  if (!value) throw new Error('usePersonalState must be used inside PersonalStateProvider');
  return value;
}
