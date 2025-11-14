// components/curso/StarRating.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface StarRatingProps {
  rating: number;
  onChange: (rating: number) => void;
  size?: number;
  readonly?: boolean;
}

export function StarRating({ 
  rating, 
  onChange, 
  size = 24,
  readonly = false 
}: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.container}>
      {stars.map((star) => {
        const filled = hovered !== null ? star <= hovered : star <= rating;
        
        return (
          <TouchableOpacity
            key={star}
            onPress={() => !readonly && onChange(star)}
            onPressIn={() => !readonly && setHovered(star)}
            onPressOut={() => !readonly && setHovered(null)}
            disabled={readonly}
            style={styles.starButton}
          >
            <Ionicons
              name={filled ? 'star' : 'star-outline'}
              size={size}
              color={filled ? '#FCD34D' : '#D1D5DB'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starButton: {
    padding: 2,
  },
});














