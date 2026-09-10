import React, { useState } from 'react';

import {
  View,
  Text,
  ScrollView,
  Switch,
  Pressable,
  StyleSheet,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

export default function SettingsScreen() {
  const {
    mode,
    colors,
    changeTheme,
  } = useTheme();

  const [autoSave, setAutoSave] =
    useState(true);

  const [lineNumbers, setLineNumbers] =
    useState(true);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            colors.background,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
      >
        <Text
          style={[
            styles.title,
            { color: colors.text },
          ]}
        >
          Paramètres
        </Text>

        <Text
          style={[
            styles.section,
            { color: colors.purple },
          ]}
        >
          ÉDITEUR
        </Text>

        <Setting
          title="Auto-save"
          value={autoSave}
          onChange={setAutoSave}
          colors={colors}
        />

        <Setting
          title="Numéros de lignes"
          value={lineNumbers}
          onChange={setLineNumbers}
          colors={colors}
        />

        <Text
          style={[
            styles.section,
            { color: colors.purple },
          ]}
        >
          APPARENCE
        </Text>

        <View
          style={[
            styles.themeBox,
            {
              backgroundColor:
                colors.panel,
              borderColor:
                colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.themeTitle,
              { color: colors.text },
            ]}
          >
            Thème
          </Text>

          <View style={styles.themeButtons}>
            <Pressable
              style={[
                styles.themeButton,
                {
                  backgroundColor:
                    mode === 'dark'
                      ? colors.purple
                      : colors.panel2,
                  borderColor:
                    colors.border,
                },
              ]}
              onPress={() =>
                changeTheme('dark')
              }
            >
              <Text
                style={[
                  styles.themeButtonText,
                  {
                    color:
                      mode === 'dark'
                        ? '#ffffff'
                        : colors.text,
                  },
                ]}
              >
                🌙 Sombre
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.themeButton,
                {
                  backgroundColor:
                    mode === 'light'
                      ? colors.purple
                      : colors.panel2,
                  borderColor:
                    colors.border,
                },
              ]}
              onPress={() =>
                changeTheme('light')
              }
            >
              <Text
                style={[
                  styles.themeButtonText,
                  {
                    color:
                      mode === 'light'
                        ? '#ffffff'
                        : colors.text,
                  },
                ]}
              >
                ☀️ Soleil
              </Text>
            </Pressable>
          </View>
        </View>

        <Row
          title="Police"
          value="Monospace"
          colors={colors}
        />

        <Row
          title="Taille du texte"
          value="14"
          colors={colors}
        />

        <Text
          style={[
            styles.section,
            { color: colors.purple },
          ]}
        >
          IA
        </Text>

        <Row
          title="Modèle IA"
          value="Non connecté"
          colors={colors}
        />

        <Row
          title="API"
          value="À configurer"
          colors={colors}
        />

        <Text
          style={[
            styles.version,
            { color: colors.muted },
          ]}
        >
          GCODE Mobile V3.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

function Setting({
  title,
  value,
  onChange,
  colors,
}) {
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor:
            colors.panel,
          borderBottomColor:
            colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.rowTitle,
          { color: colors.text },
        ]}
      >
        {title}
      </Text>

      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{
          false: colors.border,
          true: colors.purple,
        }}
      />
    </View>
  );
}

function Row({
  title,
  value,
  colors,
}) {
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor:
            colors.panel,
          borderBottomColor:
            colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.rowTitle,
          { color: colors.text },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.value,
          { color: colors.muted },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 25,
  },

  section: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 8,
  },

  row: {
    minHeight: 58,
    borderBottomWidth: 1,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  rowTitle: {
    fontSize: 14,
  },

  value: {
    fontSize: 13,
  },

  themeBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },

  themeTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },

  themeButtons: {
    flexDirection: 'row',
    gap: 10,
  },

  themeButton: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  themeButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },

  version: {
    textAlign: 'center',
    marginTop: 35,
  },
});
