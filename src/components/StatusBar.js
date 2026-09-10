import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

export default function StatusBar({
  language = 'HTML',
  line = 1,
  column = 1,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.item}>⑂ main</Text>
        <Text style={styles.item}>✓</Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.item}>
          Ln {line}, Col {column}
        </Text>

        <Text style={styles.item}>
          Spaces: 2
        </Text>

        <Text style={styles.item}>
          UTF-8
        </Text>

        <Text style={styles.item}>
          {language}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 27,
    backgroundColor: '#17122d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 9,
  },

  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  item: {
    color: '#d2cced',
    fontSize: 9,
    marginHorizontal: 5,
  },
});
