import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const StarRating = ({ rating, onRate, disabled = false }) => {
  return (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star, index) => (
        <TouchableOpacity
          key={star}
          onPress={() => !disabled && onRate(star)}
          disabled={disabled}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          style={index > 0 ? { marginLeft: 6 } : null}
        >
          <Ionicons
            name={star <= (rating || 0) ? 'star' : 'star-outline'}
            size={20}
            color={star <= (rating || 0) ? '#F6921D' : '#D1D5DB'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  starContainer: {
    flexDirection: 'row',
  },
});

