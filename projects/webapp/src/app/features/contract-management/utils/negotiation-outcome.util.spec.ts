import { followNegotiation } from './negotiation-outcome.util';

const noSleep = () => Promise.resolve();

function states(...values: (string | Error)[]) {
  let i = 0;
  const getState = jest.fn(async () => {
    const value = values[Math.min(i++, values.length - 1)];
    if (value instanceof Error) {
      throw value;
    }
    return value;
  });
  return getState;
}

describe('negotiation-outcome.util', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => warn.mockRestore());

  describe('followNegotiation', () => {
    it('should report a negotiation the connector terminated', async () => {
      const getState = states('REQUESTING', 'TERMINATED');
      await expect(followNegotiation(getState, { sleep: noSleep })).resolves.toEqual({
        kind: 'terminated',
        state: 'TERMINATED'
      });
      expect(getState).toHaveBeenCalledTimes(2);
    });

    it('should treat TERMINATING as terminated', async () => {
      await expect(
        followNegotiation(states('TERMINATING'), { sleep: noSleep })
      ).resolves.toMatchObject({ kind: 'terminated' });
    });

    it('should report a finalized negotiation', async () => {
      await expect(
        followNegotiation(states('REQUESTED', 'AGREED', 'VERIFIED', 'FINALIZED'), {
          sleep: noSleep
        })
      ).resolves.toEqual({ kind: 'finalized', state: 'FINALIZED' });
    });

    it('should report a still-running negotiation with its last state after the attempts', async () => {
      const getState = states('REQUESTED');
      await expect(followNegotiation(getState, { attempts: 3, sleep: noSleep })).resolves.toEqual({
        kind: 'in-progress',
        state: 'REQUESTED'
      });
      expect(getState).toHaveBeenCalledTimes(3);
    });

    it('should not report a failure because a state read failed', async () => {
      const error = new Error('network');
      await expect(
        followNegotiation(states('REQUESTED', error), {
          attempts: 3,
          sleep: noSleep
        })
      ).resolves.toEqual({ kind: 'in-progress', state: 'REQUESTED' });
      expect(warn).toHaveBeenCalledTimes(2);
      expect(warn).toHaveBeenCalledWith('Could not read the negotiation state, will retry', error);
    });

    it('should not warn about a read it aborted itself at the time budget', async () => {
      const getState = jest.fn(
        (signal: AbortSignal) =>
          new Promise<string>((_, reject) =>
            signal.addEventListener('abort', () => reject(new Error('aborted')))
          )
      );
      await expect(followNegotiation(getState, { sleep: noSleep, timeoutMs: 20 })).resolves.toEqual(
        { kind: 'in-progress', state: null }
      );
      // let the aborted read settle
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(warn).not.toHaveBeenCalled();
    });

    it('should wait between reads', async () => {
      const sleep = jest.fn(noSleep);
      await followNegotiation(states('FINALIZED'), { intervalMs: 250, sleep });
      expect(sleep).toHaveBeenCalledWith(250);
    });

    it('should use a timer and 10 attempts by default', async () => {
      const getState = states('REQUESTED');
      await expect(followNegotiation(getState, { intervalMs: 0 })).resolves.toEqual({
        kind: 'in-progress',
        state: 'REQUESTED'
      });
      expect(getState).toHaveBeenCalledTimes(10);
    });

    it('should stop a hanging state read at the time budget and abort it', async () => {
      let signal: AbortSignal | undefined;
      let calls = 0;
      const getState = jest.fn((s: AbortSignal) => {
        signal = s;
        // the first read answers, the second never does
        return calls++ === 0 ? Promise.resolve('REQUESTED') : new Promise<string>(() => undefined);
      });
      await expect(followNegotiation(getState, { sleep: noSleep, timeoutMs: 50 })).resolves.toEqual(
        { kind: 'in-progress', state: 'REQUESTED' }
      );
      expect(getState).toHaveBeenCalledTimes(2);
      expect(signal?.aborted).toBe(true);
    });

    it('should stop waiting between reads at the time budget', async () => {
      const getState = states('REQUESTED');
      await expect(
        followNegotiation(getState, { sleep: () => new Promise(() => undefined), timeoutMs: 20 })
      ).resolves.toEqual({ kind: 'in-progress', state: null });
      expect(getState).not.toHaveBeenCalled();
    });
  });
});
