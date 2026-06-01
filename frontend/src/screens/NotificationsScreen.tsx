import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { getMyRequests, getIncomingRequests, MyRequest, IncomingRequest } from '../lib/api';

type Notification = {
  id: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tint: string;
  title: string;
  body: string;
  at: string;
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

// Derive a notification feed from the user's request activity.
function buildFeed(mine: MyRequest[], incoming: IncomingRequest[]): Notification[] {
  const notes: Notification[] = [];

  for (const r of incoming) {
    if (r.status === 'pending') {
      notes.push({
        id: `in-${r.id}`,
        icon: 'arrow-down-circle-outline',
        tint: COLORS.amber,
        title: 'New borrow request',
        body: `${r.borrower_name} wants to borrow "${r.item_title}".`,
        at: r.created_at,
      });
    }
  }

  for (const r of mine) {
    if (r.status === 'approved' || r.status === 'active') {
      notes.push({
        id: `mine-${r.id}`,
        icon: 'checkmark-circle-outline',
        tint: COLORS.green,
        title: 'Request approved',
        body: `${r.owner_name} approved your request for "${r.item_title}".`,
        at: r.created_at,
      });
    } else if (r.status === 'declined') {
      notes.push({
        id: `mine-${r.id}`,
        icon: 'close-circle-outline',
        tint: '#C0392B',
        title: 'Request declined',
        body: `${r.owner_name} declined your request for "${r.item_title}".`,
        at: r.created_at,
      });
    }
  }

  return notes.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export const NotificationsScreen: React.FC<any> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const token = session?.access_token;

  const [notes, setNotes] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [mine, incoming] = await Promise.all([
        getMyRequests(token),
        getIncomingRequests(token),
      ]);
      setNotes(buildFeed(mine, incoming));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={COLORS.text1} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.amber} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.amber} />}
        >
          {notes.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="notifications-outline" size={32} color={COLORS.text3} />
              </View>
              <Text style={styles.emptyTitle}>You're all caught up</Text>
              <Text style={styles.emptyText}>
                Request approvals and new borrow requests will appear here.
              </Text>
            </View>
          ) : (
            notes.map(n => (
              <Pressable
                key={n.id}
                style={styles.row}
                onPress={() => navigation.navigate('Requests')}
              >
                <View style={[styles.rowIcon, { backgroundColor: COLORS.surfaceSub }]}>
                  <Ionicons name={n.icon} size={20} color={n.tint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{n.title}</Text>
                  <Text style={styles.rowBody}>{n.body}</Text>
                </View>
                <Text style={styles.rowTime}>{timeAgo(n.at)}</Text>
              </Pressable>
            ))
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
    paddingHorizontal: 24,
    paddingBottom: 16,
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
  headerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: COLORS.text1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: COLORS.text1,
  },
  rowBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.text2,
    marginTop: 2,
  },
  rowTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: COLORS.text3,
    alignSelf: 'flex-start',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    paddingTop: 100,
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
});
