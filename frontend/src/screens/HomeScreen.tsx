import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, StatusBar, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { CATEGORIES } from '../data/dummyData';
import { ListingCard } from '../components/ListingCard';
import { FeaturedCard } from '../components/FeaturedCard';
import { BottomNav } from '../components/BottomNav';
import { getItems, getMyStats, Item, MyStats } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../lib/responsive';

export const HomeScreen: React.FC<any> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width, columns, contentMaxWidth } = useResponsive();
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeNav, setActiveNav] = useState('home');
  const [items, setItems] = useState<Item[]>([]);
  const [stats, setStats] = useState<MyStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Display name / avatar come straight from the Supabase session
  const meta = session?.user?.user_metadata ?? {};
  const fullName: string = meta.full_name ?? meta.name ?? session?.user?.email ?? 'there';
  const firstName = fullName.split(' ')[0];
  const avatarUrl: string | null = meta.avatar_url ?? null;

  useEffect(() => {
    if (!token || !userId) return;
    Promise.all([getItems({ available: true }), getMyStats(token, userId)])
      .then(([itemsRes, statsRes]) => {
        setItems(itemsRes);
        setStats(statsRes);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, userId]);

  // Featured carousel = the 3 newest listings (API returns newest first)
  const featured = items.slice(0, 3);

  // Home filters by category only; free-text search lives on the Search screen.
  const filtered = items.filter(
    item => activeCategory === 'All' || item.category === activeCategory
  );

  const showFeatured = activeCategory === 'All';

  // Grid sizing: the content column is capped + centered on wide screens, and
  // cards tile `columns` per row within it.
  const GUTTER = 12;
  const HPAD = 24;
  const colWidth = Math.min(width, contentMaxWidth);
  const cardWidth: number | string =
    columns === 1 ? '100%' : (colWidth - HPAD * 2 - GUTTER * (columns - 1)) / columns;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <ScrollView
        style={styles.screen}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: 100,
          width: '100%',
          maxWidth: contentMaxWidth,
          alignSelf: 'center',
        }}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable style={styles.headerLeft} onPress={() => navigation.navigate('Profile')}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View>
              <Text style={styles.headerGreeting}>Hi, {firstName}</Text>
              <Text style={styles.headerSub}>Let's go borrowing</Text>
            </View>
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn} onPress={() => navigation.navigate('Messages')}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={COLORS.text1} />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={18} color={COLORS.text1} />
            </Pressable>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.listed ?? '—'}</Text>
            <Text style={styles.statLabel}>Listed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats ? `$${stats.earned}` : '—'}</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.borrowed ?? '—'}</Text>
            <Text style={styles.statLabel}>Borrowed</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Search ── */}
        <View style={styles.searchWrap}>
          <Pressable style={styles.searchBar} onPress={() => navigation.navigate('Search')}>
            <Ionicons name="search" size={16} color={COLORS.text3} style={styles.searchIcon} />
            <Text style={styles.searchPlaceholder}>Search for an item...</Text>
          </Pressable>
        </View>

        {/* ── Categories ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
          style={styles.categories}
        >
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat;
            return (
              <Pressable
                key={cat}
                style={[styles.pill, isActive && styles.pillActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Featured ── */}
        {showFeatured && featured.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trending on campus</Text>
              <Text style={styles.sectionLink}>See all</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScrollContent}
              style={styles.featuredScroll}
            >
              {featured.map(item => (
                <FeaturedCard
                  key={item.id}
                  item={{
                    title: item.title,
                    desc: item.description ?? '',
                    price: `$${Number(item.price_per_day)}/day`,
                    rating: Number(item.owner_rating) > 0 ? Number(item.owner_rating).toFixed(1) : 'New',
                    photoUrl: item.photos[0] ?? null,
                  }}
                  onPress={() => navigation.navigate('ItemDetail', { item })}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Listings ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {activeCategory === 'All' ? 'Near your dorm' : activeCategory}
          </Text>
          <Text style={styles.sectionLink}>
            {filtered.length} item{filtered.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={[styles.listings, { gap: GUTTER }]}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.amber} style={{ paddingVertical: 48, width: '100%' }} />
          ) : filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={32} color={COLORS.text3} />
              <Text style={styles.emptyStateText}>No items found — try a different search.</Text>
            </View>
          ) : (
            filtered.map(item => (
              <View key={item.id} style={{ width: cardWidth as any }}>
                <ListingCard
                  item={{
                    title: item.title,
                    desc: item.description ?? '',
                    price: `$${Number(item.price_per_day)}/day`,
                    tag: item.category,
                    photoUrl: item.photos[0] ?? undefined,
                  }}
                  onPress={() => navigation.navigate('ItemDetail', { item })}
                />
              </View>
            ))
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <BottomNav
        activeNav={activeNav}
        setActiveNav={(id) => {
          if (id === 'profile') navigation.navigate('Profile');
          else if (id === 'requests') navigation.navigate('Requests');
          else if (id === 'browse') navigation.navigate('Search');
          else setActiveNav(id);
        }}
        paddingBottom={insets.bottom}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerGreeting: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: COLORS.text1,
    letterSpacing: -0.2,
  },
  headerSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLORS.text3,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surfaceSub,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.amberLight,
    borderWidth: 2,
    borderColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: COLORS.amberDark,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 24,
    marginBottom: 28,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 28,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: COLORS.text1,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: COLORS.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 2,
  },
  searchWrap: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSub,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.text3,
    lineHeight: 26,
  },
  categories: {
    marginBottom: 28,
  },
  categoriesContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  pillActive: {
    backgroundColor: COLORS.amber,
    borderColor: COLORS.amber,
  },
  pillText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: COLORS.text2,
  },
  pillTextActive: { color: '#fff' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 14,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: COLORS.text1,
  },
  sectionLink: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: COLORS.amberDark,
  },
  featuredScroll: {
    marginBottom: 32,
  },
  featuredScrollContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  listings: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyState: {
    width: '100%',
    paddingVertical: 48,
    alignItems: 'center',
    gap: 10,
  },
  emptyStateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.text3,
  },
});
