import React, { useMemo, useState } from 'react';
import { showAlert } from "../lib/alert";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  StatusBar,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { Item, createRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const DURATIONS = [1, 2, 3, 7]; // rental lengths in days
const toISODate = (d: Date) => d.toISOString().slice(0, 10); // YYYY-MM-DD
const addDays = (d: Date, n: number) => {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
};

export const ItemDetailScreen: React.FC<any> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { session } = useAuth();
  const item: Item = route.params.item;

  const [activePhoto, setActivePhoto] = useState(0);

  // ── Borrow request form ──
  const [sheetOpen, setSheetOpen] = useState(false);
  const [startOffset, setStartOffset] = useState(0); // days from today
  const [duration, setDuration] = useState(1);       // rental length in days
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isOwnItem = session?.user?.id === item.owner_id;

  // Next 14 days as selectable start-date chips
  const dayOptions = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = addDays(today, i);
      return {
        offset: i,
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
      };
    });
  }, []);

  const startDate = addDays(new Date(), startOffset);
  const endDate = addDays(startDate, duration);
  const totalCost = Number(item.price_per_day) * duration;

  async function submitRequest() {
    const token = session?.access_token;
    if (!token) {
      showAlert('Sign in required', 'Please sign in again to request this item.');
      return;
    }
    setSubmitting(true);
    try {
      await createRequest(token, {
        item_id: item.id,
        start_date: toISODate(startDate),
        end_date: toISODate(endDate),
        message: message.trim() || undefined,
      });
      setSheetOpen(false);
      setMessage('');
      showAlert('Request sent', `Your request to borrow "${item.title}" was sent to ${item.owner_name}.`);
    } catch (err: any) {
      showAlert('Could not send request', err.message ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const photos = item.photos ?? [];
  const price = `$${Number(item.price_per_day)}/day`;
  const rating = Number(item.owner_rating);
  const ownerInitial = (item.owner_name ?? '?').charAt(0).toUpperCase();
  const galleryWidth = width - 48; // matches imageContainer horizontal margins

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={COLORS.text1} />
        </Pressable>
        <Text style={styles.headerTitle}>Item Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.screen} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Hero photo gallery ── */}
        <View style={styles.imageContainer}>
          {photos.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={e =>
                  setActivePhoto(Math.round(e.nativeEvent.contentOffset.x / galleryWidth))
                }
              >
                {photos.map((uri, i) => (
                  <Image key={i} source={{ uri }} style={[styles.heroImg, { width: galleryWidth }]} />
                ))}
              </ScrollView>
              {photos.length > 1 && (
                <View style={styles.dots}>
                  {photos.map((_, i) => (
                    <View key={i} style={[styles.dot, i === activePhoto && styles.dotActive]} />
                  ))}
                </View>
              )}
            </>
          ) : (
            <Ionicons name="image-outline" size={64} color={COLORS.text3} />
          )}
        </View>

        {/* ── Info ── */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{item.title}</Text>
            <View style={styles.pricePill}>
              <Text style={styles.priceText}>{price}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="pricetag-outline" size={14} color={COLORS.text3} />
            <Text style={styles.tagText}>{item.category || 'Item'}</Text>
            {item.campus ? (
              <>
                <Text style={styles.metaDivider}>·</Text>
                <Ionicons name="location-outline" size={14} color={COLORS.text3} />
                <Text style={styles.tagText}>{item.campus}</Text>
              </>
            ) : null}
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.desc}>
            {item.description || 'No description provided for this item.'}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Lender Information</Text>
          <View style={styles.lenderCard}>
            {item.owner_avatar ? (
              <Image source={{ uri: item.owner_avatar }} style={styles.lenderAvatar} />
            ) : (
              <View style={styles.lenderAvatar}>
                <Text style={styles.lenderAvatarText}>{ownerInitial}</Text>
              </View>
            )}
            <View style={styles.lenderInfo}>
              <Text style={styles.lenderName}>{item.owner_name}</Text>
              <View style={styles.lenderMeta}>
                <Ionicons name="star" size={12} color="#F5B324" />
                <Text style={styles.lenderStats}>
                  {rating > 0 ? `${rating.toFixed(1)} rating` : 'New lender'}
                </Text>
              </View>
            </View>
            <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.green} />
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom Action ── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable
          style={[styles.borrowBtn, (!item.is_available || isOwnItem) && styles.borrowBtnDisabled]}
          disabled={!item.is_available || isOwnItem}
          onPress={() => setSheetOpen(true)}
        >
          <Text style={styles.borrowBtnText}>
            {isOwnItem
              ? 'This is your item'
              : item.is_available
              ? 'Request to Borrow'
              : 'Currently Unavailable'}
          </Text>
        </Pressable>
      </View>

      {/* ── Request sheet ── */}
      <Modal
        visible={sheetOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setSheetOpen(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Request to Borrow</Text>
            <Pressable onPress={() => setSheetOpen(false)} hitSlop={10}>
              <Ionicons name="close" size={22} color={COLORS.text2} />
            </Pressable>
          </View>

          {/* Start date */}
          <Text style={styles.sheetLabel}>Start date</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {dayOptions.map(opt => {
              const active = opt.offset === startOffset;
              return (
                <Pressable
                  key={opt.offset}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setStartOffset(opt.offset)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Duration */}
          <Text style={styles.sheetLabel}>How long?</Text>
          <View style={styles.chipRow}>
            {DURATIONS.map(d => {
              const active = d === duration;
              return (
                <Pressable
                  key={d}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setDuration(d)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {d} day{d > 1 ? 's' : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Message */}
          <Text style={styles.sheetLabel}>Message (optional)</Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Add a note for the lender…"
            placeholderTextColor={COLORS.text3}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
          />

          {/* Summary */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryDates}>
              {toISODate(startDate)} → {toISODate(endDate)}
            </Text>
            <Text style={styles.summaryCost}>${totalCost} total</Text>
          </View>

          <Pressable
            style={[styles.submitBtn, submitting && styles.borrowBtnDisabled]}
            onPress={submitRequest}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.borrowBtnText}>Send Request</Text>
            )}
          </Pressable>
        </View>
      </Modal>
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
  imageContainer: {
    margin: 24,
    height: 250,
    backgroundColor: COLORS.surfaceSub,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroImg: {
    height: '100%',
  },
  dots: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 18,
  },
  infoSection: {
    paddingHorizontal: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  title: {
    flex: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: COLORS.text1,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  pricePill: {
    backgroundColor: COLORS.greenLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  priceText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: COLORS.green,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  tagText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: COLORS.text3,
  },
  metaDivider: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.text3,
    marginHorizontal: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: COLORS.text1,
    marginBottom: 12,
  },
  desc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: COLORS.text2,
    lineHeight: 24,
  },
  lenderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  lenderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.amberLight,
    borderWidth: 2,
    borderColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lenderAvatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: COLORS.amberDark,
  },
  lenderInfo: {
    flex: 1,
  },
  lenderName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: COLORS.text1,
  },
  lenderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  lenderStats: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.text3,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  borrowBtn: {
    backgroundColor: COLORS.amber,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  borrowBtnDisabled: {
    backgroundColor: COLORS.text3,
  },
  borrowBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#fff',
    letterSpacing: 0.1,
  },

  // ── Request sheet ──
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
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
    marginBottom: 20,
  },
  sheetTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: COLORS.text1,
    letterSpacing: -0.3,
  },
  sheetLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: COLORS.text1,
    marginBottom: 10,
    marginTop: 8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
  },
  chip: {
    paddingVertical: 9,
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
  chipTextActive: {
    color: '#fff',
  },
  messageInput: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.text1,
    backgroundColor: COLORS.surface,
    textAlignVertical: 'top',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 16,
  },
  summaryDates: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: COLORS.text3,
  },
  summaryCost: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: COLORS.text1,
  },
  submitBtn: {
    backgroundColor: COLORS.amber,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
