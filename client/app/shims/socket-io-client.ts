export type Listener = (...args: never[]) => void;

export type Socket = {
  emit: (event: string, ...args: unknown[]) => void;
  on: (event: string, handler: Listener) => void;
  off: (event: string, handler?: Listener) => void;
  disconnect: () => void;
};

const createSocket = (): Socket => {
  const listeners = new Map<string, Set<Listener>>();

  return {
    emit: () => undefined,
    on: (event, handler) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)?.add(handler);
    },
    off: (event, handler) => {
      if (!listeners.has(event)) return;
      if (!handler) {
        listeners.delete(event);
        return;
      }
      listeners.get(event)?.delete(handler);
    },
    disconnect: () => {
      listeners.clear();
    },
  };
};

export default function io(_url: string): Socket {
  return createSocket();
}
