import React, { useEffect, useState } from 'react';
import { showAlert } from "../lib/alert";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  StatusBar,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { COLORS } from '../theme/colors';
import { SHELL_MAX } from '../lib/responsive';
import { useAuth } from '../context/AuthContext';
import { createItem, uploadPhoto, getMe } from '../lib/api';

const CATEGORIES = ['Textbooks', 'Tech', 'Dorm', 'Formal', 'Sports', 'Outdoors', 'Other'];
const MAX_PHOTOS = 4;

export const AddItemScreen: React.FC<any> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const token = session?.access_token;

  const [photos, setPhotos] = useState<string[]>([]); // local file:// URIs
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Tech');
  const [price, setPrice] = useState('');
  const [campus, setCampus] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Tag the item's pickup location with the device GPS (opt-in).
  async function captureLocation() {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert(
          'Location off',
          'Lendr only uses your location to tag where this item is available, so borrowers can filter by distance. You can still list without it.'
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch {
      showAlert('Could not get location', 'Please try again.');
    } finally {
      setLocLoading(false);
    }
  }

  // Prefill campus from the user's profile
  useEffect(() => {
    if (!token) return;
    getMe(token)
      .then(me => { if (me.campus) setCampus(me.campus); })
      .catch(() => {});
  }, [token]);

  async function pickImage() {
    if (photos.length >= MAX_PHOTOS) {
      showAlert('Limit reached', `You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showAlert('Permission needed', 'Please allow photo library access to add photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
    });
    if (!result.canceled) {
      setPhotos(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, MAX_PHOTOS));
    }
  }

  function removePhoto(uri: string) {
    setPhotos(prev => prev.filter(p => p !== uri));
  }

  function validate(): string | null {
    if (title.trim().length < 3) return 'Title must be at least 3 characters.';
    if (!campus.trim()) return 'Please enter your campus.';
    const p = Number(price);
    if (!price || isNaN(p) || p <= 0) return 'Enter a valid price per day.';
    if (p > 9999) return 'Price per day must be $9,999 or less.';
    return null;
  }

  async function submit() {
    if (!token) { showAlert('Sign in required', 'Please sign in again.'); return; }
    const err = validate();
    if (err) { showAlert('Check your listing', err); return; }

    setSubmitting(true);
    try {
      // Upload photos first, then create the item with their public URLs
      const urls: string[] = [];
      for (const uri of photos) {
        urls.push(await uploadPhoto(token, uri));
      }

      await createItem(token, {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        price_per_day: Number(price),
        photos: urls,
        campus: campus.trim(),
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });

      showAlert('Listed!', `"${title.trim()}" is now available to borrow.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      showAlert('Could not list item', e.message ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={COLORS.text1} />
        </Pressable>
        <Text style={styles.headerTitle}>New Listing</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 60}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 120, width: "100%", maxWidth: 640, alignSelf: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photos */}
          <Text style={styles.label}>Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
            {photos.map(uri => (
              <View key={uri} style={styles.photoThumb}>
                <Image source={{ uri }} style={styles.photoImg} />
                <Pressable style={styles.photoRemove} onPress={() => removePhoto(uri)} hitSlop={8}>
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
              </View>
            ))}
            {photos.length < MAX_PHOTOS && (
              <Pressable style={styles.photoAdd} onPress={pickImage}>
                <Ionicons name="camera-outline" size={24} color={COLORS.text3} />
                <Text style={styles.photoAddText}>Add</Text>
              </Pressable>
            )}
          </ScrollView>

          {/* Title */}
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. TI-84 Plus CE Calculator"
            placeholderTextColor={COLORS.text3}
            maxLength={160}
          />

          {/* Category */}
          <Text style={styles.label}>Category</Text>
          <View style={styles.chipWrap}>
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
          </View>

          {/* Price */}
          <Text style={styles.label}>Price per day</Text>
          <View style={styles.priceWrap}>
            <Text style={styles.priceDollar}>$</Text>
            <TextInput
              style={styles.priceInput}
              value={price}
              onChangeText={t => setPrice(t.replace(/[^0-9.]/g, ''))}
              placeholder="0"
              placeholderTextColor={COLORS.text3}
              keyboardType="decimal-pad"
            />
            <Text style={styles.priceUnit}>/ day</Text>
          </View>

          {/* Campus */}
          <Text style={styles.label}>Campus</Text>
          <TextInput
            style={styles.input}
            value={campus}
            onChangeText={setCampus}
            placeholder="e.g. UCLA"
            placeholderTextColor={COLORS.text3}
          />

          {/* Location tag */}
          <Text style={styles.label}>Pickup location <Text style={styles.optional}>(optional)</Text></Text>
          <Pressable style={styles.locRow} onPress={captureLocation} disabled={locLoading}>
            <Ionicons
              name={coords ? 'checkmark-circle' : 'location-outline'}
              size={20}
              color={coords ? COLORS.green : COLORS.text2}
            />
            <Text style={[styles.locText, coords && { color: COLORS.text1 }]}>
              {locLoading ? 'Getting location…' : coords ? 'Location tagged' : 'Use my current location'}
            </Text>
            {locLoading && <ActivityIndicator size="small" color={COLORS.text3} />}
            {coords && !locLoading && (
              <Pressable onPress={() => setCoords(null)} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={COLORS.text3} />
              </Pressable>
            )}
          </Pressable>
          <Text style={styles.locHelp}>
            Helps nearby students find your item. Only used for distance filtering — never shared.
          </Text>

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Condition, what's included, pickup details…"
            placeholderTextColor={COLORS.text3}
            multiline
            maxLength={1000}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom action */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={submit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>List Item</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, width: '100%', maxWidth: SHELL_MAX, alignSelf: 'center' },
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

  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: COLORS.text1,
    marginBottom: 10,
    marginTop: 22,
  },

  // Photos
  photoRow: {
    gap: 10,
    paddingBottom: 4,
  },
  photoThumb: {
    width: 84,
    height: 84,
    borderRadius: 14,
    overflow: 'hidden',
  },
  photoImg: { width: '100%', height: '100%' },
  photoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAdd: {
    width: 84,
    height: 84,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    backgroundColor: COLORS.surfaceSub,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  photoAddText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: COLORS.text3,
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.text1,
    backgroundColor: COLORS.surface,
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },

  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  chipTextActive: { color: '#fff' },

  priceWrap: {
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
    fontSize: 16,
    color: COLORS.text1,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 6,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.text1,
  },
  priceUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.text3,
  },

  optional: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.text3,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: COLORS.surface,
  },
  locText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: COLORS.text2,
  },
  locHelp: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLORS.text3,
    marginTop: 8,
    lineHeight: 17,
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
  submitBtn: {
    backgroundColor: COLORS.amber,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#fff',
    letterSpacing: 0.1,
  },
});
