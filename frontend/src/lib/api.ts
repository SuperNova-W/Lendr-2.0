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

// Uploads a local image (file:// URI) as multipart form-data; returns its public URL.
export async function uploadPhoto(token: string, uri: string): Promise<string> {
  const name = uri.split('/').pop() ?? `photo-${Date.now()}.jpg`;
  const ext = name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const type = ext === 'png' ? 'image/png' : 'image/jpeg';

  const form = new FormData();
  // React Native's FormData accepts this { uri, name, type } shape.
  form.append('photo', { uri, name, type } as any);

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
