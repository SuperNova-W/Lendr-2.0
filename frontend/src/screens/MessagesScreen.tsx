import React, { useCallback, useMemo, useState } from 'react';
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
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { getConversations, ConversationSummary } from '../lib/api';
import { parseLocationMessage } from '../lib/location';
import { useResponsive } from '../lib/responsive';

type Filter = 'all' | 'unread' | 'active';
type Status = ConversationSummary['request_status'];
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const FILTERS: { id: Filter; label: string; icon: IoniconName }[] = [
  { id: 'all', label: 'All', icon: 'chatbubbles-outline' },
  { id: 'unread', label: 'Unread', icon: 'ellipse' },
  { id: 'active', label: 'Active', icon: 'swap-horizontal-outline' },
];

const STATUS_TONE: Record<Status, { bg: string; text: string; label: string }> = {
  pending:   { bg: '#FFF4E0', text: '#946200', label: 'Pending' },
  approved:  { bg: COLORS.greenLight, text: COLORS.green, label: 'Approved' },
  active:    { bg: COLORS.greenLight, text: COLORS.green, label: 'Active' },
  returned:  { bg: '#ECECF2', text: '#5A5A6E', label: 'Returned' },
  declined:  { bg: COLORS.redLight, text: COLORS.red, label: 'Declined' },
  cancelled: { bg: '#ECECF2', text: '#5A5A6E', label: 'Cancelled' },
};

function isLive(status: Status) {
  return status === 'pending' || status === 'approved' || status === 'active';
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('') || '?';
}

// Compact, chat-list style timestamp: time today, weekday this week, else date.
function fmtWhen(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: 'short' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const MessagesScreen: React.FC<any> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { contentMaxWidth, isWebDesktop } = useResponsive();
  const { session } = useAuth();
  const token = session?.access_token;
  const myId = session?.user?.id;

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      setConversations(await getConversations(token));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // Refresh on focus so unread counts update after viewing a thread.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const unreadTotal = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unread_count, 0),
    [conversations]
  );
  const activeTotal = useMemo(
    () => conversations.filter(c => isLive(c.request_status)).length,
    [conversations]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations.filter(c => {
      if (filter === 'unread' && c.unread_count === 0) return false;
      if (filter === 'active' && !isLive(c.request_status)) return false;

      if (!q) return true;
      const location = c.last_message_body && parseLocationMessage(c.last_message_body)
        ? 'shared location'
        : '';
      const haystack = [
        c.other_user_name,
        c.item_title,
        c.request_status,
        c.last_message_body ?? '',
        location,
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [conversations, filter, query]);

  const filterCount = (id: Filter) => {
    if (id === 'unread') return conversations.filter(c => c.unread_count > 0).length;
    if (id === 'active') return activeTotal;
    return conversations.length;
  };

  const goBack = () => {
    if (navigation.canGoBack?.()) navigation.goBack();
    else navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={goBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={COLORS.text1} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerKicker}>Campus inbox</Text>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <Pressable onPress={onRefresh} style={styles.headerAction} disabled={refreshing}>
          {refreshing ? (
            <ActivityIndicator size="small" color={COLORS.text1} />
          ) : (
            <Ionicons name="refresh" size={18} color={COLORS.text1} />
          )}
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.amber} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 24,
            width: '100%',
            maxWidth: isWebDesktop ? 980 : contentMaxWidth,
            alignSelf: 'center',
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.amber} />
          }
        >
          <View style={styles.summaryPanel}>
            <View style={styles.summaryTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryLabel}>Inbox health</Text>
                <Text style={styles.summaryTitle}>
                  {unreadTotal > 0
                    ? `${unreadTotal} unread message${unreadTotal === 1 ? '' : 's'}`
                    : 'All caught up'}
                </Text>
              </View>
              <View style={styles.summaryIcon}>
                <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
              </View>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{conversations.length}</Text>
                <Text style={styles.statLabel}>Threads</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{unreadTotal}</Text>
                <Text style={styles.statLabel}>Unread</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{activeTotal}</Text>
                <Text style={styles.statLabel}>Open rentals</Text>
              </View>
            </View>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={COLORS.text3} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search people, items, or messages"
              placeholderTextColor={COLORS.text3}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={COLORS.text3} />
              </Pressable>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
            style={styles.filterScroll}
          >
            {FILTERS.map(f => {
              const active = filter === f.id;
              const count = filterCount(f.id);
              return (
                <Pressable
                  key={f.id}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                  onPress={() => setFilter(f.id)}
                >
                  <Ionicons name={f.icon} size={14} color={active ? '#fff' : COLORS.text2} />
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {f.label}
                  </Text>
                  <Text style={[styles.filterCount, active && styles.filterCountActive]}>
                    {count}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {conversations.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="chatbubble-ellipses-outline" size={32} color={COLORS.text3} />
              </View>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyText}>
                When you start a conversation with a lender or borrower, it'll show up here.
              </Text>
              <Pressable style={styles.emptyButton} onPress={() => navigation.navigate('Search')}>
                <Ionicons name="search" size={16} color="#fff" />
                <Text style={styles.emptyButtonText}>Browse items</Text>
              </Pressable>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="file-tray-outline" size={32} color={COLORS.text3} />
              </View>
              <Text style={styles.emptyTitle}>No matching threads</Text>
              <Text style={styles.emptyText}>
                Try a different search or switch filters to see more conversations.
              </Text>
              <Pressable
                style={styles.emptyGhostButton}
                onPress={() => {
                  setQuery('');
                  setFilter('all');
                }}
              >
                <Text style={styles.emptyGhostButtonText}>Clear filters</Text>
              </Pressable>
            </View>
          ) : (
            filtered.map(c => {
              const photo = c.item_photos?.[0] ?? null;
              const avatar = c.other_user_avatar ?? null;
              const fromMe = c.last_message_sender_id === myId;
              const previewBody = c.last_message_body
                ? (parseLocationMessage(c.last_message_body) ? 'Shared a location' : c.last_message_body)
                : null;
              const preview = previewBody
                ? `${fromMe ? 'You: ' : ''}${previewBody}`
                : 'No messages yet';
              const unread = c.unread_count > 0;
              const status = STATUS_TONE[c.request_status];
              const role = c.borrower_id === myId ? 'Borrowing' : 'Lending';

              return (
                <Pressable
                  key={c.id}
                  style={({ pressed }) => [
                    styles.threadCard,
                    unread && styles.threadCardUnread,
                    pressed && styles.threadCardPressed,
                  ]}
                  onPress={() =>
                    navigation.navigate('MessageThread', {
                      conversationId: c.id,
                      otherName: c.other_user_name,
                      itemTitle: c.item_title,
                    })
                  }
                >
                  <View style={styles.mediaStack}>
                    <View style={styles.thumb}>
                      {photo ? (
                        <Image source={{ uri: photo }} style={styles.thumbImg} />
                      ) : (
                        <Ionicons name="image-outline" size={22} color={COLORS.text3} />
                      )}
                    </View>
                    <View style={styles.avatar}>
                      {avatar ? (
                        <Image source={{ uri: avatar }} style={styles.avatarImg} />
                      ) : (
                        <Text style={styles.avatarText}>{initials(c.other_user_name)}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.threadBody}>
                    <View style={styles.titleRow}>
                      <Text style={styles.name} numberOfLines={1}>{c.other_user_name}</Text>
                      <Text style={styles.time}>{fmtWhen(c.last_message_at ?? c.created_at)}</Text>
                    </View>

                    <View style={styles.itemRow}>
                      <Ionicons name="cube-outline" size={13} color={COLORS.text3} />
                      <Text style={styles.itemTitle} numberOfLines={1}>{c.item_title}</Text>
                    </View>

                    <Text
                      style={[styles.preview, unread && styles.previewUnread]}
                      numberOfLines={2}
                    >
                      {preview}
                    </Text>

                    <View style={styles.metaRow}>
                      <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                        <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                      </View>
                      <View style={styles.rolePill}>
                        <Ionicons
                          name={role === 'Borrowing' ? 'download-outline' : 'push-outline'}
                          size={12}
                          color={COLORS.text2}
                        />
                        <Text style={styles.roleText}>{role}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.trailing}>
                    {unread ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{c.unread_count}</Text>
                      </View>
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color={COLORS.text3} />
                    )}
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    paddingHorizontal: 14,
  },
  headerKicker: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: COLORS.green,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: COLORS.text1,
    marginTop: 2,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSub,
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryPanel: {
    backgroundColor: COLORS.amber,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  summaryTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: '#fff',
    marginTop: 4,
  },
  summaryIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  statBlock: {
    flex: 1,
    minHeight: 62,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 9,
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#fff',
  },
  statLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: COLORS.surfaceInput,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.text1,
  },
  filterScroll: {
    marginHorizontal: -20,
    marginBottom: 14,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.amber,
    borderColor: COLORS.amber,
  },
  filterText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: COLORS.text2,
  },
  filterTextActive: { color: '#fff' },
  filterCount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: COLORS.text3,
  },
  filterCountActive: { color: 'rgba(255,255,255,0.82)' },

  threadCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    marginBottom: 12,
  },
  threadCardUnread: {
    borderColor: COLORS.amber,
    backgroundColor: '#FEFEFF',
  },
  threadCardPressed: {
    opacity: 0.72,
  },
  mediaStack: {
    width: 64,
    height: 64,
  },
  thumb: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceSub,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  avatar: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.amberLight,
    borderWidth: 2,
    borderColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: COLORS.amberDark,
  },
  threadBody: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flex: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: COLORS.text1,
  },
  time: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLORS.text3,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  itemTitle: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.text3,
  },
  preview: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.text2,
    lineHeight: 20,
    marginTop: 8,
  },
  previewUnread: {
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.text1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 10,
  },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
  },
  statusText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceSub,
  },
  roleText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: COLORS.text2,
  },
  trailing: {
    width: 24,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#fff',
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surfaceSub,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: COLORS.text1,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.text3,
    textAlign: 'center',
    lineHeight: 21,
  },
  emptyButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: COLORS.amber,
    marginTop: 4,
  },
  emptyButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#fff',
  },
  emptyGhostButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginTop: 4,
  },
  emptyGhostButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: COLORS.text1,
  },
});
