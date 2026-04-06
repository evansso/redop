// ─────────────────────────────────────────────
//  redop — Internal SSE mechanics
// ─────────────────────────────────────────────

const enc = new TextEncoder();

export function encodeSse(
  data: unknown,
  init: {
    id?: string;
    event?: string;
    retry?: number;
  } = {}
): Uint8Array {
  const lines: string[] = [];
  if (init.id) {
    lines.push(`id: ${init.id}`);
  }
  if (init.event) {
    lines.push(`event: ${init.event}`);
  }
  if (init.retry != null) {
    lines.push(`retry: ${init.retry}`);
  }

  const payload = typeof data === "string" ? data : JSON.stringify(data ?? "");
  for (const line of payload.split("\n")) {
    lines.push(`data: ${line}`);
  }

  return enc.encode(`${lines.join("\n")}\n\n`);
}

export class SseHub {
  // sessionId -> Set of active stream controllers (concurrent streams per spec)
  private streams = new Map<
    string,
    Set<ReadableStreamDefaultController<Uint8Array>>
  >();
  private heartbeats = new Map<string, ReturnType<typeof setInterval>>();

  public open(
    sessionId: string,
    _lastEventId: string | null
  ): { stream: ReadableStream<Uint8Array> } {
    // Capture ctrl outside the ReadableStream constructor so cancel() can reference it.
    // start() fires synchronously before open() returns, so this is always assigned.
    let ctrl!: ReadableStreamDefaultController<Uint8Array>;

    const stream = new ReadableStream<Uint8Array>({
      start: (c) => {
        ctrl = c;

        let sessionStreams = this.streams.get(sessionId);
        if (!sessionStreams) {
          sessionStreams = new Set();
          this.streams.set(sessionId, sessionStreams);

          // One shared heartbeat per session, shared across concurrent streams.
          const timer = setInterval(() => {
            const streams = this.streams.get(sessionId);
            if (!streams) {
              return;
            }
            for (const sc of streams) {
              try {
                sc.enqueue(enc.encode(": keep-alive\n\n"));
              } catch {
                // Dead controller — will be pruned on next send() or cancel()
              }
            }
          }, 15_000);
          this.heartbeats.set(sessionId, timer);
        }

        sessionStreams.add(ctrl);

        // 2025-11-25 spec: priming comment + retry hint.
        // A SSE comment (: …) keeps proxies alive without firing a client
        // `message` event. We also advertise a retry backoff here.
        ctrl.enqueue(encodeSse("", { id: crypto.randomUUID(), retry: 5000 }));
      },

      cancel: () => {
        const sessionStreams = this.streams.get(sessionId);
        if (!sessionStreams) {
          return;
        }

        sessionStreams.delete(ctrl);

        if (sessionStreams.size === 0) {
          this.streams.delete(sessionId);
          const timer = this.heartbeats.get(sessionId);
          if (timer !== undefined) {
            clearInterval(timer);
            this.heartbeats.delete(sessionId);
          }
        }
      },
    });

    return { stream };
  }

  /**
   * Send a payload to a session.
   *
   * The spec says the server MUST choose one stream per message, not broadcast.
   * We walk the Set in insertion order and use the first live controller,
   * pruning dead ones as we go. Returns false only when no live stream exists.
   */
  public send(
    sessionId: string,
    payload: unknown,
    options?: { event?: string; id?: string }
  ): boolean {
    const sessionStreams = this.streams.get(sessionId);
    if (!sessionStreams || sessionStreams.size === 0) {
      return false;
    }

    const chunk = encodeSse(payload, {
      id: options?.id ?? crypto.randomUUID(),
      event: options?.event,
    });

    for (const sc of sessionStreams) {
      try {
        sc.enqueue(chunk);
        return true;
      } catch {
        // Controller is closed/errored — prune and try the next one.
        sessionStreams.delete(sc);
      }
    }

    return false;
  }

  public hasSession(sessionId: string): boolean {
    const s = this.streams.get(sessionId);
    return s !== undefined && s.size > 0;
  }

  public closeSession(sessionId: string): void {
    const sessionStreams = this.streams.get(sessionId);
    if (!sessionStreams) {
      return;
    }

    for (const sc of sessionStreams) {
      try {
        sc.close();
      } catch {}
    }

    this.streams.delete(sessionId);

    const timer = this.heartbeats.get(sessionId);
    if (timer !== undefined) {
      clearInterval(timer);
      this.heartbeats.delete(sessionId);
    }
  }

  public closeAll(): void {
    // Snapshot keys so we're not mutating while iterating.
    for (const sid of [...this.streams.keys()]) {
      this.closeSession(sid);
    }
  }
}
