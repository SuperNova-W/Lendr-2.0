import React, { useEffect, useMemo, useRef, useState } from 'react';
import { showAlert } from "../lib/alert";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  Pressable,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Modal,
  Keyboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { CATEGORIES } from '../data/dummyData';
import { GridCard } from '../components/GridCard';
import { BottomNav } from '../components/BottomNav';
import { getItems, Item } from '../lib/api';

type Sort = 'newest' | 'price_asc' | 'price_desc';

const SORTS: { id: Sort; label: string }[] = [
  { id: 'newest',     label: 'Newest' },
  { id: 'price_asc',  label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
];

const MI_TO_M = 1609.34;
const RADII = [1, 3, 5, 10, 25]; // miles

export const SearchScreen: React.FC<any> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<Sort>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Location-radius filter
  const [radiusMi, setRadiusMi] = useState<number | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    getItems()
      .then(setAllItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Re-query the backend (PostGIS ST_DWithin) whenever the radius/location changes.
  useEffect(() => {
    if (radiusMi === null || !coords) return;
    setGeoLoading(true);
    getItems({ lat: coords.lat, lng: coords.lng, radius: radiusMi * MI_TO_M })
      .then(setAllItems)
      .catch(console.error)
      .finally(() => setGeoLoading(false));
  }, [radiusMi, coords]);

  // Selecting a radius requests location (with a "filtering only" message) first.
  async function selectRadius(mi: number) {
    if (radiusMi === mi) {
      // Toggle off → restore the full list
      setRadiusMi(null);
      setGeoLoading(true);
      getItems().then(setAllItems).catch(console.error).finally(() => setGeoLoading(false));
      return;
    }
    if (!coords) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert(
          'Location needed for distance',
          'Lendr uses your location only to filter listings by how far away they are. It is never shared with other students. You can enable it in Settings anytime.'
        );
        return;
      }
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        showAlert('Could not get location', 'Please try again.');
        return;
      }
    }
    setRadiusMi(mi);
  }

  // Autocomplete: unique titles + categories matching the current query
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const pool = new Set<string>();
    for (const it of allItems) {
      if (it.title.toLowerCase().includes(q)) pool.add(it.title);
      if (it.category.toLowerCase().includes(q)) pool.add(it.category);
    }
    return Array.from(pool).slice(0, 6);
  }, [query, allItems]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;

    let out = allItems.filter(it => {
      const matchQ =
        !q ||
        it.title.toLowerCase().includes(q) ||
        (it.description ?? '').toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q);
      const matchCat = category === 'All' || it.category === category;
      const price = Number(it.price_per_day);
      const matchMin = min === null || price >= min;
      const matchMax = max === null || price <= max;
      return matchQ && matchCat && matchMin && matchMax;
    });

    // When a radius is active the backend already returns items nearest-first;
    // keep that order unless the user explicitly chose a price sort.
    const geoActive = radiusMi !== null && !!coords;
    out = [...out].sort((a, b) => {
      if (sort === 'price_asc')  return Number(a.price_per_day) - Number(b.price_per_day);
      if (sort === 'price_desc') return Number(b.price_per_day) - Number(a.price_per_day);
      if (geoActive) return (a.distance_m ?? Infinity) - (b.distance_m ?? Infinity);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return out;
  }, [allItems, query, category, sort, minPrice, maxPrice, radiusMi, coords]);

  const activeFilterCount =
    (category !== 'All' ? 1 : 0) + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (radiusMi !== null ? 1 : 0);

  function pickSuggestion(s: string) {
    setQuery(s);
    setShowSuggestions(false);
    Keyboard.dismiss();
  }

  function clearAll() {
    setCategory('All');
    setMinPrice('');
    setMaxPrice('');
    if (radiusMi !== null) {
      setRadiusMi(null);
      getItems().then(setAllItems).catch(console.error);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={[styles.headerWrap, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>Browse</Text>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={COLORS.text3} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search items…"
              placeholderTextColor={COLORS.text3}
              value={query}
              onChangeText={t => { setQuery(t); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              returnKeyType="search"
              onSubmitEditing={() => setShowSuggestions(false)}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <Pressable onPress={() => { setQuery(''); inputRef.current?.focus(); }} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={COLORS.text3} />
              </Pressable>
            )}
          </View>
          <Pressable style={styles.filterBtn} onPress={() => setFilterOpen(true)}>
            <Ionicons name="options-outline" size={20} color={COLORS.text1} />
            {activeFilterCount > 0 && (
              <View style={styles.filterDot}>
                <Text style={styles.filterDotText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Autocomplete suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestBox}>
            {suggestions.map(s => (
              <Pressable key={s} style={styles.suggestRow} onPress={() => pickSuggestion(s)}>
                <Ionicons name="search-outline" size={15} color={COLORS.text3} />
                <Text style={styles.suggestText} numberOfLines={1}>{s}</Text>
                <Ionicons name="arrow-up-outline" size={14} color={COLORS.text3} style={{ transform: [{ rotate: '45deg' }] }} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          keyboardShouldPersistTaps="handled"
        >
          {CATEGORIES.map(cat => {
            const active = cat === category;
            return (
              <Pressable
                key={cat}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Result count + sort */}
        <View style={styles.resultBar}>
          <Text style={styles.resultCount}>
            {loading ? 'Loading…' : `${results.length} item${results.length !== 1 ? 's' : ''}`}
          </Text>
          <Pressable style={styles.sortBtn} onPress={() => setSortOpen(true)}>
            <Ionicons name="swap-vertical" size={15} color={COLORS.text2} />
            <Text style={styles.sortText}>{SORTS.find(s => s.id === sort)!.label}</Text>
          </Pressable>
        </View>
      </View>

      {/* Results grid */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.amber} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100, paddingTop: 4 }}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => setShowSuggestions(false)}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <GridCard item={item} onPress={() => navigation.navigate('ItemDetail', { item })} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={36} color={COLORS.text3} />
              <Text style={styles.emptyText}>No items match your search.</Text>
              {activeFilterCount > 0 && (
                <Pressable onPress={clearAll}>
                  <Text style={styles.clearLink}>Clear filters</Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}

      {/* Sort modal */}
      <Modal visible={sortOpen} transparent animationType="fade" onRequestClose={() => setSortOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSortOpen(false)}>
          <View style={[styles.sortSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <Text style={styles.sheetTitle}>Sort by</Text>
            {SORTS.map(s => (
              <Pressable key={s.id} style={styles.sortRow} onPress={() => { setSort(s.id); setSortOpen(false); }}>
                <Text style={[styles.sortRowText, sort === s.id && styles.sortRowActive]}>{s.label}</Text>
                {sort === s.id && <Ionicons name="checkmark" size={18} color={COLORS.amber} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Filter modal */}
      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setFilterOpen(false)} />
        <View style={[styles.filterSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filters</Text>
            <Pressable onPress={clearAll} hitSlop={8}>
              <Text style={styles.clearLink}>Clear all</Text>
            </Pressable>
          </View>

          <Text style={styles.filterLabel}>Category</Text>
          <View style={styles.chipWrap}>
            {CATEGORIES.map(cat => {
              const active = cat === category;
              return (
                <Pressable key={cat} style={[styles.chip, active && styles.chipActive]} onPress={() => setCategory(cat)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.filterLabelRow}>
            <Text style={styles.filterLabel}>Distance</Text>
            {geoLoading && <ActivityIndicator size="small" color={COLORS.text3} />}
          </View>
          <View style={styles.chipWrap}>
            {RADII.map(mi => {
              const active = mi === radiusMi;
              return (
                <Pressable key={mi} style={[styles.chip, active && styles.chipActive]} onPress={() => selectRadius(mi)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{mi} mi</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.distanceHelp}>
            Location is used only to filter by distance — never shared with other students.
          </Text>

          <Text style={styles.filterLabel}>Price per day</Text>
          <View style={styles.priceRow}>
            <View style={styles.priceField}>
              <Text style={styles.priceDollar}>$</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Min"
                placeholderTextColor={COLORS.text3}
                value={minPrice}
                onChangeText={t => setMinPrice(t.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
              />
            </View>
            <Text style={styles.priceDash}>–</Text>
            <View style={styles.priceField}>
              <Text style={styles.priceDollar}>$</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Max"
                placeholderTextColor={COLORS.text3}
                value={maxPrice}
                onChangeText={t => setMaxPrice(t.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <Pressable style={styles.applyBtn} onPress={() => setFilterOpen(false)}>
            <Text style={styles.applyBtnText}>Show {results.length} results</Text>
          </Pressable>
        </View>
      </Modal>

      <BottomNav
        activeNav="browse"
        setActiveNav={(id) => {
          if (id === 'home') navigation.navigate('Home');
          else if (id === 'requests') navigation.navigate('Requests');
          else if (id === 'profile') navigation.navigate('Profile');
        }}
        paddingBottom={insets.bottom}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  headerWrap: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: COLORS.bg,
    zIndex: 10,
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    color: COLORS.text1,
    letterSpacing: -0.4,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surfaceSub,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: COLORS.text1,
    padding: 0,
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDotText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#fff',
  },

  suggestBox: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    marginTop: 8,
    overflow: 'hidden',
  },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  suggestText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.text1,
  },

  chipRow: {
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipActive: {
    backgroundColor: COLORS.amber,
    borderColor: COLORS.amber,
  },
  chipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: COLORS.text2,
  },
  chipTextActive: { color: '#fff' },

  resultBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  resultCount: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: COLORS.text3,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sortText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: COLORS.text2,
  },

  gridRow: {
    gap: 12,
    marginBottom: 12,
  },

  empty: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 80,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.text3,
  },
  clearLink: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: COLORS.amberDark,
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sortSheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  sortRowText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: COLORS.text2,
  },
  sortRowActive: {
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.text1,
  },

  filterSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: COLORS.text1,
    marginBottom: 8,
  },
  filterLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: COLORS.text1,
    marginTop: 16,
    marginBottom: 10,
  },
  filterLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distanceHelp: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLORS.text3,
    marginTop: 8,
    lineHeight: 17,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.surface,
  },
  priceDollar: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: COLORS.text2,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 6,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.text1,
  },
  priceDash: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: COLORS.text3,
  },
  applyBtn: {
    backgroundColor: COLORS.amber,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  applyBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
});
