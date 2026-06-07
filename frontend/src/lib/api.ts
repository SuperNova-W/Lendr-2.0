import { Platform } from 'react-native';

const BASE_URL = 'https://bkd2h4r7bc.execute-api.us-east-1.amazonaws.com';

// Error that preserves the backend's status + machine-readable `code`
// (e.g. NOT_COLLEGE_EMAIL) so callers can branch on it.
export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({} as any));
    throw new ApiError(res.status, body.error ?? `Request failed: ${res.status}`, body.code);
  }

  // 204 No Content (e.g. DELETE) has no body to parse.
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Items ─────────────────────────────────────────────────────────────────────

export interface Item {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  category: string;
  // Postgres returns NUMERIC columns as strings (e.g. "12.00") — kept as string
  // to match the wire format. Use Number(...) before doing math.
  price_per_day: string;
  photos: string[];
  campus: string;
  is_available: boolean;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  owner_name: string;
  owner_avatar: string | null;
  owner_rating: string;
  // Present only when the request supplied a lat/lng — meters from that point.
  distance_m?: number | null;
}

export interface GetItemsParams {
  campus?: string;
  category?: string;
  available?: boolean;
  owner?: string;
  // Location filtering: provide lat+lng to sort nearest-first; add radius (meters)
  // to also restrict to items within that distance.
  lat?: number;
  lng?: number;
  radius?: number;
}

export function getItems(params?: GetItemsParams) {
  const query = new URLSearchParams();
  if (params?.campus)   query.set('campus', params.campus);
  if (params?.category) query.set('category', params.category);
  if (params?.available !== undefined) query.set('available', String(params.available));
  if (params?.owner)    query.set('owner', params.owner);
  if (params?.lat !== undefined)    query.set('lat', String(params.lat));
  if (params?.lng !== undefined)    query.set('lng', String(params.lng));
  if (params?.radius !== undefined) query.set('radius', String(params.radius));
  const qs = query.toString();
  return request<Item[]>(`/items${qs ? `?${qs}` : ''}`);
}

export function getItem(id: string) {
  return request<Item>(`/items/${id}`);
}

export interface NewItem {
  title: string;
  description?: string;
  category: string;
  price_per_day: number;
  photos?: string[];
  campus: string;
  latitude?: number;
  longitude?: number;
}

export function createItem(token: string, body: NewItem) {
  return request<Item>('/items', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

// Owner-only edit. Note: the PATCH response omits the joined owner_* display
// fields, so callers showing those should merge the result over their existing
// item rather than replacing it wholesale.
export function updateItem(token: string, id: string, body: Partial<NewItem>) {
  return request<Item>(`/items/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

// Owner-only delete. Returns 204 (no body).
export function deleteItem(token: string, id: string) {
  return request<void>(`/items/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Uploads a local image (file:// URI) as multipart form-data; returns its public URL.
export async function uploadPhoto(token: string, uri: string): Promise<string> {
  const name = uri.split('/').pop() ?? `photo-${Date.now()}.jpg`;
  const ext = name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const type = ext === 'png' ? 'image/png' : 'image/jpeg';

  const form = new FormData();
  if (Platform.OS === 'web') {
    // Browsers need a real Blob/File, not RN's { uri, name, type } shape. The
    // picker returns a blob:/data: URL we can fetch back into a Blob.
    const blob = await (await fetch(uri)).blob();
    form.append('photo', blob, name);
  } else {
    // React Native's FormData accepts this { uri, name, type } shape.
    form.append('photo', { uri, name, type } as any);
  }

  const res = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }, // no Content-Type — let RN set the multipart boundary
    body: form,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error ?? `Upload failed: ${res.status}`);
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export interface Stats {
  students: number;
  listings: number;
  avgSaved: number;
}

export function getStats(campus?: string) {
  const qs = campus ? `?campus=${encodeURIComponent(campus)}` : '';
  return request<Stats>(`/stats${qs}`);
}

// ── Requests ────────────────────────────────────────────────────────────────────

export interface BorrowRequest {
  id: string;
  item_id: string;
  borrower_id: string;
  owner_id: string;
  status: 'pending' | 'approved' | 'active' | 'returned' | 'declined' | 'cancelled';
  start_date: string;
  end_date: string;
  total_price: string;
  message: string | null;
  created_at: string;
}

// total_price is computed server-side from the item price × days — don't send it.
export function createRequest(
  token: string,
  body: { item_id: string; start_date: string; end_date: string; message?: string }
) {
  return request<BorrowRequest>('/requests', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

// Requests I've sent as a borrower (the other party is the item's owner/lender).
export interface MyRequest extends BorrowRequest {
  item_title: string;
  item_photos: string[];
  owner_name: string;
  owner_avatar: string | null;
}

// Requests on items I own (the other party is the borrower).
export interface IncomingRequest extends BorrowRequest {
  item_title: string;
  item_photos: string[];
  borrower_name: string;
  borrower_avatar: string | null;
}

export function getMyRequests(token: string) {
  return request<MyRequest[]>('/requests/mine', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getIncomingRequests(token: string) {
  return request<IncomingRequest[]>('/requests/incoming', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type RequestAction = 'approved' | 'declined' | 'returned' | 'cancelled';

export function updateRequestStatus(token: string, id: string, status: RequestAction) {
  return request<BorrowRequest>(`/requests/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
}

// ── Messaging ───────────────────────────────────────────────────────────────────

type RequestStatus = BorrowRequest['status'];

// A single message in a thread. `read_at` is null until the other participant
// opens the conversation.
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

// The bare conversation row, as returned by createConversation. The list/detail
// endpoints return richer shapes (below) joined with item/participant context.
export interface Conversation {
  id: string;
  request_id: string;
  item_id: string;
  borrower_id: string;
  owner_id: string;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

// Row shape for the conversation list. `other_user_*` is always the participant
// who isn't the current user; `unread_count` counts their unread messages.
export interface ConversationSummary {
  id: string;
  request_id: string;
  item_id: string;
  borrower_id: string;
  owner_id: string;
  last_message_at: string | null;
  created_at: string;
  item_title: string;
  item_photos: string[];
  request_status: RequestStatus;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  last_message_body: string | null;
  last_message_created_at: string | null;
  last_message_sender_id: string | null;
  unread_count: number;
}

// A single conversation plus its messages (ascending) and request context.
export interface ConversationDetail {
  id: string;
  request_id: string;
  item_id: string;
  borrower_id: string;
  owner_id: string;
  last_message_at: string | null;
  created_at: string;
  item_title: string;
  item_photos: string[];
  request_status: RequestStatus;
  start_date: string;
  end_date: string;
  total_price: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  messages: Message[];
}

export function getConversations(token: string) {
  return request<ConversationSummary[]>('/messages/conversations', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getConversation(token: string, id: string) {
  return request<ConversationDetail>(`/messages/conversations/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Create or return the conversation backing a request (idempotent server-side).
export function createConversation(token: string, requestId: string) {
  return request<Conversation>('/messages/conversations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ request_id: requestId }),
  });
}

export function sendMessage(token: string, conversationId: string, body: string) {
  return request<Message>(`/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ body }),
  });
}

// Marks the other participant's messages as read; returns how many were updated.
export function markConversationRead(token: string, conversationId: string) {
  return request<{ updated: number }>(`/messages/conversations/${conversationId}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── My stats ────────────────────────────────────────────────────────────────────
// Single source of truth for the personal stat row shown on both Home and Profile,
// so the two screens can never drift apart.

export interface MyStats {
  listed: number;   // items I own
  earned: number;   // $ from approved/active/returned requests on my items
  borrowed: number; // requests I've sent as a borrower
}

export async function getMyStats(token: string, userId: string): Promise<MyStats> {
  const [items, mine, incoming] = await Promise.all([
    getItems({ owner: userId }),
    getMyRequests(token),
    getIncomingRequests(token),
  ]);

  const earned = incoming
    .filter(r => ['approved', 'active', 'returned'].includes(r.status))
    .reduce((sum, r) => sum + Number(r.total_price), 0);

  return { listed: items.length, earned, borrowed: mine.length };
}

// ── Users ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  campus: string | null;
  grad_year: number | null;
  major: string | null;
  bio: string | null;
  interests: string[] | null;
  dorm: string | null;
  phone: string | null;
  rating_avg: string;   // NUMERIC → string on the wire
  rating_count: number;
  created_at: string;
}

export function getMe(token: string) {
  return request<User>('/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function updateMe(
  token: string,
  body: {
    name?: string;
    campus?: string;
    grad_year?: number;
    major?: string;
    bio?: string;
    interests?: string[];
    dorm?: string;
    phone?: string;
    avatar_url?: string;
  }
) {
  return request<User>('/users/me', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

// Permanently deletes the account and all associated data.
export function deleteMe(token: string) {
  return request<void>('/users/me', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Auth ──────────────────────────────────────────────────────────────────────

// The /auth/sync response includes `onboarded` (campus set) and may 403 with
// code NOT_COLLEGE_EMAIL if the signed-in email isn't an academic address.
export interface SyncResult extends User {
  onboarded: boolean;
}

export function syncUser(token: string) {
  return request<SyncResult>('/auth/sync', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}
