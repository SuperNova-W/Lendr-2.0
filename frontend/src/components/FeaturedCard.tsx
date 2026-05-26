import React from 'react';
import { StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

interface FeaturedCardProps {
  item: {
    title: string;
    desc: string;
    price: string;
    rating: string;
    photoUrl?: string;
  };
  onPress: () => void;
}

export const FeaturedCard: React.FC<FeaturedCardProps> = ({ item, onPress }) => {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.img}>
        {item.photoUrl ? (
          <Image source={{ uri: item.photoUrl }} style={styles.photo} />
        ) : (
          <Ionicons name="image-outline" size={32} color={COLORS.text3} />
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.desc} numberOfLines={1}>{item.desc}</Text>
        <View style={styles.footer}>
          <View style={styles.pricePill}>
            <Text style={styles.priceText}>{item.price}</Text>
          </View>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={11} color="#F5B324" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 192,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    overflow: 'hidden',
  },
  img: {
    width: '100%',
    height: 112,
    backgroundColor: COLORS.surfaceSub,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: { width: '100%', height: '100%' },
  body: { padding: 14 },
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
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  pricePill: {
    backgroundColor: COLORS.greenLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  priceText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: COLORS.green,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: COLORS.text2,
  },
});
