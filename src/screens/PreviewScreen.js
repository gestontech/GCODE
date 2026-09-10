import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

import { WebView } from 'react-native-webview';

export default function PreviewScreen({
  project,
  onBack,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>‹</Text>
        </Pressable>

        <Text style={styles.title}>
          Aperçu
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabs}>
        <Text style={styles.active}>
          📱 Mobile
        </Text>

        <Text style={styles.tab}>
          Tablet
        </Text>

        <Text style={styles.tab}>
          Desktop
        </Text>
      </View>

      <WebView
        source={{
          html: project.code || '<h1>GCODE</h1>',
        }}
        originWhitelist={['*']}
        javaScriptEnabled
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070914',
  },

  header: {
    height: 65,
    backgroundColor: '#0d1020',
    borderBottomWidth: 1,
    borderBottomColor: '#242943',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },

  back: {
    color: '#fff',
    fontSize: 35,
    width: 40,
  },

  title: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
    flex: 1,
    textAlign: 'center',
  },

  tabs: {
    height: 48,
    backgroundColor: '#11152a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  active: {
    color: '#a88bff',
    fontWeight: '800',
  },

  tab: {
    color: '#8189a6',
  },

  webview: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
