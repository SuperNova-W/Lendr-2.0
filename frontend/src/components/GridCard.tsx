import React from 'react';
import { StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { Item } from '../lib/api';

interface GridCardProps {
  item: Item;
  onPress: () => void;
}

export const GridCard: React.FC<GridCardProps> = ({ item, onPress }) => {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.photoWrap}>
        {item.photos[0] ? (
          <Image source={{ uri: item.photos[0] }} style={styles.photo} />
        ) : (
          <Ionicons name="image-outline" size={28} color={COLORS.text3} />
        )}
        {!item.is_available && (
          <View style={styles.outBadge}>
            <Text style={styles.outText}>Out</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.price}>${Number(item.price_per_day)}/day</Text>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.category}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    overflow: 'hidden',
  },
  photoWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.surfaceSub,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: { width: '100%', height: '100%' },
  outBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  outText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: '#fff',
  },
  body: {
    padding: 12,
    gap: 8,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: COLORS.text1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
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
    fontSize: 10,
    color: COLORS.text3,
  },
});
