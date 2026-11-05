/**
 * A 200 on "initiate negotiation" only means the request was accepted; the connector may still
 * terminate the negotiation asynchronously. Follow its state briefly and report what happened.
 */
export type NegotiationOutcome =
  | { kind: 'terminated'; state: string }
  | { kind: 'finalized'; state: string }
  | { kind: 'in-progress'; state: string | null };

export interface FollowNegotiationOptions {
  /** How many state reads to attempt before reporting the negotiation as still in progress. */
  attempts?: number;
  /** Delay before each state read, in ms. */
  intervalMs?: number;
  /** Overall time budget, in ms: past it, the outstanding read is aborted and the negotiation is reported as still in progress. */
  timeoutMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

type ReadState = (signal: AbortSignal) => Promise<string | null | undefined>;

const TERMINATED_STATES = new Set(['TERMINATING', 'TERMINATED']);
const FINALIZED_STATES = new Set(['FINALIZED']);
const EXPIRED = Symbol('expired');

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** The outcome a terminal state maps to, or null while the negotiation is still running. */
function toOutcome(state: string | null): NegotiationOutcome | null {
  if (state && TERMINATED_STATES.has(state)) {
    return { kind: 'terminated', state };
  }
  if (state && FINALIZED_STATES.has(state)) {
    return { kind: 'finalized', state };
  }
  return null;
}

/** One state read that never rejects: a failed read yields undefined ("no new state"). */
async function readStateSafely(
  readState: ReadState,
  signal: AbortSignal
): Promise<string | null | undefined> {
  try {
    return await readState(signal);
  } catch (error) {
    // a transient read failure must not turn an accepted negotiation into a reported failure;
    // a read we aborted ourselves once the budget was spent is expected and not worth a warning
    if (!signal.aborted) {
      console.warn('Could not read the negotiation state, will retry', error);
    }
    return undefined;
  }
}

/** A promise resolving to EXPIRED once `ms` has elapsed, and the means to release its timer. */
function deadline(ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<typeof EXPIRED>((resolve) => {
    timer = setTimeout(() => resolve(EXPIRED), ms);
  });
  return { expired, release: () => clearTimeout(timer) };
}

export async function followNegotiation(
  readState: ReadState,
  {
    attempts = 10,
    intervalMs = 500,
    timeoutMs = 10_000,
    sleep = defaultSleep
  }: FollowNegotiationOptions = {}
): Promise<NegotiationOutcome> {
  // a wait or a read can hang: bound the whole follow-up so the caller is never kept pending
  const budget = deadline(timeoutMs);
  const withinBudget = <T>(step: Promise<T>) => Promise.race([step, budget.expired]);
  const controller = new AbortController();
  let state: string | null = null;
  try {
    for (let i = 0; i < attempts; i++) {
      if ((await withinBudget(sleep(intervalMs))) === EXPIRED) {
        break;
      }
      const read = await withinBudget(readStateSafely(readState, controller.signal));
      if (read === EXPIRED) {
        break;
      }
      state = read ?? state;
      const outcome = toOutcome(state);
      if (outcome) {
        return outcome;
      }
    }
  } finally {
    budget.release();
    // cancel any read still outstanding
    controller.abort();
  }
  return { kind: 'in-progress', state };
}
