import React, { useCallback, useState } from 'react';
import { showAlert } from "../lib/alert";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  StatusBar,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { BottomNav } from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import {
  getMyRequests,
  getIncomingRequests,
  updateRequestStatus,
  MyRequest,
  IncomingRequest,
  RequestAction,
} from '../lib/api';

type Tab = 'sent' | 'incoming';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:   { bg: '#FFF4E0', text: '#B8860B' },
  approved:  { bg: '#E6F4EA', text: '#1E7E34' },
  active:    { bg: '#E6F4EA', text: '#1E7E34' },
  returned:  { bg: '#ECECF2', text: '#5A5A6E' },
  declined:  { bg: '#FBE9E9', text: '#C0392B' },
  cancelled: { bg: '#ECECF2', text: '#5A5A6E' },
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export const RequestsScreen: React.FC<any> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const token = session?.access_token;

  const [tab, setTab] = useState<Tab>('sent');
  const [sent, setSent] = useState<MyRequest[]>([]);
  const [incoming, setIncoming] = useState<IncomingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [mine, inc] = await Promise.all([
        getMyRequests(token),
        getIncomingRequests(token),
      ]);
      setSent(mine);
      setIncoming(inc);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // Refetch whenever the screen comes into focus (e.g. after sending a request)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  async function act(id: string, status: RequestAction) {
    if (!token) return;
    setActingId(id);
    try {
      await updateRequestStatus(token, id, status);
      await load();
    } catch (err: any) {
      showAlert('Action failed', err.message ?? 'Something went wrong');
    } finally {
      setActingId(null);
    }
  }

  function confirmDecline(id: string) {
    showAlert('Decline request?', 'The borrower will be notified.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: () => act(id, 'declined') },
    ]);
  }

  const data = tab === 'sent' ? sent : incoming;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>Requests</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <Pressable style={[styles.tab, tab === 'sent' && styles.tabActive]} onPress={() => setTab('sent')}>
          <Text style={[styles.tabText, tab === 'sent' && styles.tabTextActive]}>
            My Requests{sent.length ? ` (${sent.length})` : ''}
          </Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === 'incoming' && styles.tabActive]} onPress={() => setTab('incoming')}>
          <Text style={[styles.tabText, tab === 'incoming' && styles.tabTextActive]}>
            Incoming{incoming.length ? ` (${incoming.length})` : ''}
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.amber} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100, width: "100%", maxWidth: 640, alignSelf: "center" }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.amber} />}
        >
          {data.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="swap-horizontal-outline" size={36} color={COLORS.text3} />
              <Text style={styles.emptyText}>
                {tab === 'sent'
                  ? "You haven't requested any items yet."
                  : 'No incoming requests on your items.'}
              </Text>
            </View>
          ) : (
            data.map(req => {
              const isSent = tab === 'sent';
              const personName = isSent
                ? (req as MyRequest).owner_name
                : (req as IncomingRequest).borrower_name;
              const personAvatar = isSent
                ? (req as MyRequest).owner_avatar
                : (req as IncomingRequest).borrower_avatar;
              const photo = req.item_photos?.[0] ?? null;
              const status = STATUS_COLORS[req.status] ?? STATUS_COLORS.pending;
              const busy = actingId === req.id;

              return (
                <View key={req.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.thumb}>
                      {photo ? (
                        <Image source={{ uri: photo }} style={styles.thumbImg} />
                      ) : (
                        <Ionicons name="image-outline" size={22} color={COLORS.text3} />
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.titleRow}>
                        <Text style={styles.itemTitle} numberOfLines={1}>{req.item_title}</Text>
                        <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                          <Text style={[styles.statusText, { color: status.text }]}>{req.status}</Text>
                        </View>
                      </View>

                      <Text style={styles.person}>
                        {isSent ? 'Lender: ' : 'Borrower: '}{personName}
                      </Text>
                      <Text style={styles.dates}>
                        {fmtDate(req.start_date)} – {fmtDate(req.end_date)} · ${Number(req.total_price)}
                      </Text>
                    </View>
                  </View>

                  {req.message ? <Text style={styles.message}>“{req.message}”</Text> : null}

                  {/* Actions */}
                  {isSent && req.status === 'pending' && (
                    <View style={styles.actionRow}>
                      <Pressable
                        style={[styles.btn, styles.btnGhost]}
                        disabled={busy}
                        onPress={() => act(req.id, 'cancelled')}
                      >
                        {busy ? <ActivityIndicator size="small" color={COLORS.text2} /> : <Text style={styles.btnGhostText}>Cancel Request</Text>}
                      </Pressable>
                    </View>
                  )}

                  {!isSent && req.status === 'pending' && (
                    <View style={styles.actionRow}>
                      <Pressable
                        style={[styles.btn, styles.btnGhost]}
                        disabled={busy}
                        onPress={() => confirmDecline(req.id)}
                      >
                        <Text style={styles.btnGhostText}>Decline</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.btn, styles.btnPrimary]}
                        disabled={busy}
                        onPress={() => act(req.id, 'approved')}
                      >
                        {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnPrimaryText}>Approve</Text>}
                      </Pressable>
                    </View>
                  )}

                  {!isSent && (req.status === 'approved' || req.status === 'active') && (
                    <View style={styles.actionRow}>
                      <Pressable
                        style={[styles.btn, styles.btnPrimary]}
                        disabled={busy}
                        onPress={() => act(req.id, 'returned')}
                      >
                        {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnPrimaryText}>Mark as Returned</Text>}
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <BottomNav
        activeNav="requests"
        setActiveNav={(id) => {
          if (id === 'home') navigation.navigate('Home');
          else if (id === 'profile') navigation.navigate('Profile');
          else if (id === 'browse') navigation.navigate('Search');
        }}
        paddingBottom={insets.bottom}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    color: COLORS.text1,
    letterSpacing: -0.4,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.amber,
    borderColor: COLORS.amber,
  },
  tabText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: COLORS.text2,
  },
  tabTextActive: { color: '#fff' },

  empty: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 80,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.text3,
    textAlign: 'center',
  },

  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSub,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemTitle: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: COLORS.text1,
  },
  statusPill: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
  },
  statusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    textTransform: 'capitalize',
  },
  person: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.text2,
    marginTop: 4,
  },
  dates: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.text3,
    marginTop: 2,
  },
  message: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    fontStyle: 'italic',
    color: COLORS.text2,
    marginTop: 10,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  btn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: COLORS.amber },
  btnPrimaryText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  btnGhost: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnGhostText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: COLORS.text2,
  },
});
