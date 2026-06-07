import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { searchNearbyPlaces, PlaceResult } from '../lib/api';
import {
  getCurrentLocation,
  haversineMiles,
  LocationPermissionError,
  SharedLocation,
} from '../lib/location';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPick: (loc: SharedLocation) => void;
}

type Mode = 'menu' | 'places';

const PERMISSION_MSG =
  'Location permission denied. Enable it in settings to share your location.';

export const ShareLocationModal: React.FC<Props> = ({ visible, onClose, onPick }) => {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const token = session?.access_token;

  const [mode, setMode] = useState<Mode>('menu');
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [unconfigured, setUnconfigured] = useState(false);

  // Reset to the menu each time the sheet opens (keep cached `origin` to avoid
  // re-prompting for permission).
  useEffect(() => {
    if (visible) {
      setMode('menu');
      setQuery('');
      setError(null);
      setUnconfigured(false);
    }
  }, [visible]);

  // Load nearby places whenever we're in the picker with a known origin. Debounced
  // on the search text so typing doesn't fire a request per keystroke.
  useEffect(() => {
    if (mode !== 'places' || !origin || !token) return;
    let cancelled = false;
    setPlacesLoading(true);
    setError(null);
    const t = setTimeout(async () => {
      try {
        const results = await searchNearbyPlaces(token, {
          lat: origin.lat,
          lng: origin.lng,
          q: query.trim() || undefined,
        });
        if (!cancelled) setPlaces(results);
      } catch (e: any) {
        if (cancelled) return;
        if (e?.code === 'PLACES_UNCONFIGURED' || e?.status === 503) setUnconfigured(true);
        else setError('Couldn’t load nearby places. Try again.');
      } finally {
        if (!cancelled) setPlacesLoading(false);
      }
    }, query ? 350 : 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [mode, origin, token, query]);

  async function shareCurrent() {
    setLoadingCurrent(true);
    setError(null);
    try {
      const o = await getCurrentLocation();
      setOrigin(o);
      onPick({ lat: o.lat, lng: o.lng });
    } catch (e) {
      setError(e instanceof LocationPermissionError ? PERMISSION_MSG : 'Couldn’t get your location.');
    } finally {
      setLoadingCurrent(false);
    }
  }

  async function openPicker() {
    setError(null);
    setUnconfigured(false);
    setMode('places');
    if (!origin) {
      try {
        setOrigin(await getCurrentLocation());
      } catch (e) {
        setError(
          e instanceof LocationPermissionError
            ? 'Allow location access to find nearby places.'
            : 'Couldn’t get your location.'
        );
      }
    }
  }

  function pickPlace(p: PlaceResult) {
    onPick({ lat: p.lat, lng: p.lng, name: p.name, address: p.address });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.handle} />

        <View style={styles.header}>
          {mode === 'places' ? (
            <Pressable onPress={() => setMode('menu')} hitSlop={8} style={styles.headerBtn}>
              <Ionicons name="chevron-back" size={20} color={COLORS.text1} />
            </Pressable>
          ) : (
            <View style={styles.headerBtn} />
          )}
          <Text style={styles.title}>{mode === 'places' ? 'Pick a place' : 'Share location'}</Text>
          <Pressable onPress={onClose} hitSlop={8} style={styles.headerBtn}>
            <Ionicons name="close" size={20} color={COLORS.text2} />
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {mode === 'menu' ? (
          <View style={{ gap: 10, marginTop: 4 }}>
            <Pressable style={styles.option} onPress={shareCurrent} disabled={loadingCurrent}>
              <View style={styles.optionIcon}>
                {loadingCurrent ? (
                  <ActivityIndicator size="small" color={COLORS.amber} />
                ) : (
                  <Ionicons name="navigate" size={20} color={COLORS.amber} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>Share current location</Text>
                <Text style={styles.optionSub}>Send where you are right now</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.text3} />
            </Pressable>

            <Pressable style={styles.option} onPress={openPicker}>
              <View style={styles.optionIcon}>
                <Ionicons name="business" size={20} color={COLORS.amber} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>Pick a nearby place</Text>
                <Text style={styles.optionSub}>Choose a hall, building, or spot to meet</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.text3} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.pickerBody}>
            <View style={styles.searchRow}>
              <Ionicons name="search" size={16} color={COLORS.text3} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Search places…"
                placeholderTextColor={COLORS.text3}
                autoCorrect={false}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={COLORS.text3} />
                </Pressable>
              )}
            </View>

            {unconfigured ? (
              <Text style={styles.note}>
                Place search isn’t set up yet. You can still share your current location.
              </Text>
            ) : placesLoading ? (
              <ActivityIndicator size="small" color={COLORS.amber} style={{ marginTop: 24 }} />
            ) : (
              <ScrollView
                style={styles.list}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {places.length === 0 && !error ? (
                  <Text style={styles.note}>No places found nearby.</Text>
                ) : (
                  places.map((p) => {
                    const miles = origin ? haversineMiles(origin, p) : null;
                    return (
                      <Pressable key={p.id || p.name} style={styles.placeRow} onPress={() => pickPlace(p)}>
                        <Ionicons name="location-outline" size={18} color={COLORS.text2} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.placeName} numberOfLines={1}>{p.name}</Text>
                          {p.address ? (
                            <Text style={styles.placeAddr} numberOfLines={1}>{p.address}</Text>
                          ) : null}
                        </View>
                        {miles != null ? (
                          <Text style={styles.placeDist}>{miles < 0.1 ? '<0.1' : miles.toFixed(1)} mi</Text>
                        ) : null}
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '80%',
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerBtn: {
    width: 28,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: COLORS.text1,
  },
  error: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.red,
    marginBottom: 8,
  },
  note: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.text3,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
    lineHeight: 20,
  },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSub,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: COLORS.text1,
  },
  optionSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.text3,
    marginTop: 2,
  },

  pickerBody: {
    marginTop: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    backgroundColor: COLORS.surfaceInput,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: COLORS.text1,
    paddingVertical: 0,
  },
  list: {
    marginTop: 8,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  placeName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: COLORS.text1,
  },
  placeAddr: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLORS.text3,
    marginTop: 1,
  },
  placeDist: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: COLORS.text2,
  },
});
