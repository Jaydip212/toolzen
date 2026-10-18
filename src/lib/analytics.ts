/**
 * Privacy-conscious product analytics.
 *
 * Rules the module enforces by construction:
 *  - OFF by default. Without VITE_ANALYTICS_ENDPOINT nothing is sent anywhere
 *    and every call is a cheap no-op, so the platform works unchanged.
 *  - The only payload is an event name, the page path and a small allow-listed
 *    context. Tool inputs, file names, search text and document contents are
 *    structurally impossible to send — the API has no field for them.
 *  - Fire-and-forget: a failed or blocked request can never surface an error
 *    in a tool, because nothing awaits or observes the result.
 *  - No third-party script is injected. If the owner wants hosted analytics,
 *    they point the endpoint at their own collection URL.
 */

export type AnalyticsEvent =
  | 'tool_open'
  | 'tool_download'
  | 'search_performed'
  | 'category_view'

const ENDPOINT = import.meta.env.VITE_ANALYTICS_ENDPOINT ?? ''

/** Whether analytics will actually send anything. Exposed for honest tests. */
export function analyticsEnabled(): boolean {
  return ENDPOINT !== ''
}

export interface AnalyticsContext {
  /** Registry tool id, when the event concerns a tool. Never free text. */
  toolId?: string
  /** Registry category id, when the event concerns a category. Never free text. */
  categoryId?: string
}

/** Send one event. Never throws, never awaits, never carries user content. */
export function trackEvent(event: AnalyticsEvent, context: AnalyticsContext = {}): void {
  if (!analyticsEnabled()) return
  const payload = {
    event,
    path: window.location.pathname,
    ...(context.toolId !== undefined ? { toolId: context.toolId } : {}),
    ...(context.categoryId !== undefined ? { categoryId: context.categoryId } : {}),
  }
  try {
    void fetch(ENDPOINT, {
      method: 'POST',
      // keepalive lets the request survive an immediate navigation.
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {
      // A failed collection request is deliberately silent.
    })
  } catch {
    // Even building the request must not break a tool.
  }
}
