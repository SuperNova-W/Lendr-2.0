import React from 'react';
import { StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

interface ListingCardProps {
  item: {
    title: string;
    desc: string;
    price: string;
    tag: string;
    photoUrl?: string;
  };
  onPress: () => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ item, onPress }) => {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.photoWrapper}>
        {item.photoUrl ? (
          <Image source={{ uri: item.photoUrl }} style={styles.photo} />
        ) : (
          <Ionicons name="image-outline" size={22} color={COLORS.text3} />
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.desc} numberOfLines={2}>{item.desc}</Text>
        <View style={styles.meta}>
          <Text style={styles.price}>{item.price}</Text>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.tag}</Text>
          </View>
        </View>
      </View>
      <Pressable style={styles.borrowBtn} onPress={onPress}>
        <Text style={styles.borrowBtnText}>Borrow</Text>
      </Pressable>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  photoWrapper: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSub,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  info: { flex: 1 },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: COLORS.text1,
  },
  desc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLORS.text3,
    marginTop: 3,
    lineHeight: 18,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 9,
  },
  price: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: COLORS.green,
  },
  tag: {
    backgroundColor: COLORS.surfaceSub,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  tagText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: COLORS.text3,
  },
  borrowBtn: {
    backgroundColor: COLORS.amber,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  borrowBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#fff',
  },
});
