// Push-notification boundary.
//
// This is the single seam where outbound message notifications get delivered.
// It is intentionally a no-op for the MVP so the messaging feature ships without
// taking on Expo Push / FCM as a hard dependency. Device tokens are already
// collected in `device_push_tokens` (see POST /push/register), so turning this
// on later is a contained change with no callers to touch.
//
// The payload deliberately carries `conversationId` / `requestId` / `itemId` so
// that, once wired, the notification's `data` can deep-link the app straight
// into the relevant thread on tap.

export interface NewMessageNotification {
  recipientId: string;
  conversationId: string;
  requestId: string;
  itemId: string;
  senderName: string;
  preview: string;
}

// Fire-and-forget. Callers should `void notifyNewMessage(...)` so notification
// delivery never blocks or fails the request that produced the message.
//
// TODO(push): look up active rows in `device_push_tokens` for `recipientId`,
// then POST to the Expo Push API (https://exp.host/--/api/v2/push/send) or FCM:
//   {
//     to: <token>,
//     title: senderName,
//     body: preview,
//     data: { conversationId, requestId, itemId },
//   }
// Prune tokens the provider reports as DeviceNotRegistered.
export async function notifyNewMessage(_n: NewMessageNotification): Promise<void> {
  // No-op until push delivery is wired up. Kept async + total so the call site
  // is already in its final shape.
  return;
}
