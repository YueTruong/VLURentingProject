import type { Session } from "next-auth";

const SESSION_READY_TIMEOUT_MS = 1_200;

let currentSession: Session | null = null;
let isInitialized = false;
let readyResolvers = new Set<() => void>();

function flushReadyResolvers() {
  if (readyResolvers.size === 0) return;

  for (const resolve of readyResolvers) {
    resolve();
  }

  readyResolvers = new Set();
}

export function setClientSession(session: Session | null | undefined) {
  currentSession = session ?? null;

  if (!isInitialized) {
    isInitialized = true;
    flushReadyResolvers();
  }
}

export function getClientSession() {
  return currentSession;
}

export function getClientAccessToken() {
  return currentSession?.user?.accessToken ?? null;
}

export async function waitForClientSessionReady(timeoutMs = SESSION_READY_TIMEOUT_MS) {
  if (isInitialized) return;

  await new Promise<void>((resolve) => {
    const timeout = window.setTimeout(() => {
      readyResolvers.delete(handleResolve);
      resolve();
    }, timeoutMs);

    const handleResolve = () => {
      window.clearTimeout(timeout);
      readyResolvers.delete(handleResolve);
      resolve();
    };

    readyResolvers.add(handleResolve);
  });
}
