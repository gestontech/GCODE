import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

export default function ToolButton({
  label,
  onPress,
  active = false,
}) {
  return (
    <Pressable
      style={[
        styles.button,
        active && styles.active,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.text,
          active && styles.activeText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 9,
  },

  active: {
    backgroundColor: '#713cff',
  },

  text: {
    color: '#c5c9dc',
    fontSize: 13,
  },

  activeText: {
    color: '#fff',
  },
});
