import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, Pressable, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { CATEGORIES, FEATURED, LISTINGS } from '../data/dummyData';
import { ListingCard } from '../components/ListingCard';
import { FeaturedCard } from '../components/FeaturedCard';
import { BottomNav } from '../components/BottomNav';

export const HomeScreen: React.FC<any> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeNav, setActiveNav] = useState('home');
  const [search, setSearch] = useState('');

  const filtered = LISTINGS.filter(item => {
    const matchCat = activeCategory === 'All' || item.tag === activeCategory;
    const matchSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.desc.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const showFeatured = search === '' && activeCategory === 'All';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <ScrollView
        style={styles.screen}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 100 }}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>K</Text>
            </View>
            <View>
              <Text style={styles.headerGreeting}>Hi, Kayla</Text>
              <Text style={styles.headerSub}>Let's go borrowing</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={COLORS.text1} />
            </Pressable>
            <Pressable style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={18} color={COLORS.text1} />
            </Pressable>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>248</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>90</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>$12</Text>
            <Text style={styles.statLabel}>Avg. saved</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Search ── */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={COLORS.text3} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for an item..."
              placeholderTextColor={COLORS.text3}
              value={search}
              onChangeText={setSearch}
            />
          </View>
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
        {showFeatured && (
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
              {FEATURED.map(item => (
                <FeaturedCard
                  key={item.id}
                  item={item}
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

        <View style={styles.listings}>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={32} color={COLORS.text3} />
              <Text style={styles.emptyStateText}>No items found — try a different search.</Text>
            </View>
          ) : (
            filtered.map(item => (
              <ListingCard
                key={item.id}
                item={item}
                onPress={() => navigation.navigate('ItemDetail', { item })}
              />
            ))
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <BottomNav
        activeNav={activeNav}
        setActiveNav={(id) => {
          if (id === 'profile') navigation.navigate('Profile');
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
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.text1,
    height: 26,
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
    gap: 10,
  },
  emptyState: {
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
