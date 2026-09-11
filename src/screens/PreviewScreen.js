import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function PreviewScreen({
  project,
  onBack,
}) {
  const { colors, radius } = useTheme();

  const [device, setDevice] = useState('mobile');
  const [url, setUrl] = useState('gcode://preview');

  const projectName = project?.name || 'Nouveau projet';

  const previewContent = useMemo(() => {
    return project?.preview || `
Bienvenue sur ton projet

Cette zone représente l'aperçu
de ton application ou de ton site.

Construis. Teste. Améliore.
    `.trim();
  }, [project]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.panel,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.55 : 1 },
          ]}
        >
          <Text
            style={[
              styles.backIcon,
              { color: colors.text },
            ]}
          >
            ‹
          </Text>
        </Pressable>

        <View style={styles.headerTitle}>
          <Text
            style={[
              styles.eyebrow,
              { color: colors.muted },
            ]}
          >
            PREVIEW
          </Text>

          <Text
            numberOfLines={1}
            style={[
              styles.title,
              { color: colors.textStrong },
            ]}
          >
            {projectName}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.refreshButton,
            {
              backgroundColor: colors.panel2,
              borderColor: colors.border,
              opacity: pressed ? 0.6 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.refreshIcon,
              { color: colors.text },
            ]}
          >
            ↻
          </Text>
        </Pressable>
      </View>

      {/* TOOLBAR */}
      <View
        style={[
          styles.toolbar,
          {
            backgroundColor: colors.panel2,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.urlBox,
            {
              backgroundColor: colors.panel,
              borderColor: colors.border,
              borderRadius: radius.sm,
            },
          ]}
        >
          <Text
            style={[
              styles.lock,
              { color: colors.green },
            ]}
          >
            ●
          </Text>

          <TextInput
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.urlInput,
              { color: colors.muted },
            ]}
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.openButton,
            {
              backgroundColor: colors.purple,
              borderRadius: radius.sm,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Text style={styles.openText}>
            Ouvrir
          </Text>
        </Pressable>
      </View>

      {/* DEVICE SELECTOR */}
      <View style={styles.deviceBar}>
        <DeviceButton
          label="Mobile"
          icon="▯"
          active={device === 'mobile'}
          onPress={() => setDevice('mobile')}
          colors={colors}
        />

        <DeviceButton
          label="Tablette"
          icon="▭"
          active={device === 'tablet'}
          onPress={() => setDevice('tablet')}
          colors={colors}
        />

        <DeviceButton
          label="Desktop"
          icon="▣"
          active={device === 'desktop'}
          onPress={() => setDevice('desktop')}
          colors={colors}
        />
      </View>

      {/* PREVIEW AREA */}
      <ScrollView
        contentContainerStyle={styles.previewArea}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.deviceFrame,
            device === 'mobile' && styles.mobileFrame,
            device === 'tablet' && styles.tabletFrame,
            device === 'desktop' && styles.desktopFrame,
            {
              backgroundColor: '#FFFFFF',
              borderColor: colors.borderStrong,
            },
          ]}
        >
          {/* MOCK BROWSER */}
          <View style={styles.browserTop}>
            <View style={styles.browserDots}>
              <View style={styles.browserDot} />
              <View style={styles.browserDot} />
              <View style={styles.browserDot} />
            </View>

            <Text style={styles.browserTitle}>
              {projectName}
            </Text>
          </View>

          {/* APP CONTENT */}
          <ScrollView
            style={styles.page}
            contentContainerStyle={styles.pageContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.previewLogo}>
              <Text style={styles.previewLogoText}>
                G
              </Text>
            </View>

            <Text style={styles.previewTitle}>
              {projectName}
            </Text>

            <Text style={styles.previewSubtitle}>
              Ton aperçu GCODE
            </Text>

            <View style={styles.previewCard}>
              <Text style={styles.previewCardTitle}>
                Aperçu du projet
              </Text>

              <Text style={styles.previewCardText}>
                {previewContent}
              </Text>
            </View>

            <Pressable style={styles.previewButton}>
              <Text style={styles.previewButtonText}>
                Commencer
              </Text>
            </Pressable>

            <View style={styles.previewFooter}>
              <Text style={styles.previewFooterText}>
                Créé avec GCODE
              </Text>
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* STATUS */}
      <View
        style={[
          styles.statusBar,
          {
            backgroundColor: colors.panel,
            borderTopColor: colors.border,
          },
        ]}
      >
        <View style={styles.statusLeft}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: colors.green },
            ]}
          />

          <Text
            style={[
              styles.statusText,
              { color: colors.muted },
            ]}
          >
            Aperçu local
          </Text>
        </View>

        <Text
          style={[
            styles.statusText,
            { color: colors.muted2 },
          ]}
        >
          {device === 'mobile'
            ? '390 × 844'
            : device === 'tablet'
              ? '768 × 1024'
              : '1280 × 800'}
        </Text>
      </View>
    </View>
  );
}

function DeviceButton({
  label,
  icon,
  active,
  onPress,
  colors,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.deviceButton,
        {
          backgroundColor: active
            ? colors.purple
            : colors.panel,
          borderColor: active
            ? colors.purple
            : colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.deviceIcon,
          {
            color: active
              ? '#FFFFFF'
              : colors.muted,
          },
        ]}
      >
        {icon}
      </Text>

      <Text
        style={[
          styles.deviceText,
          {
            color: active
              ? '#FFFFFF'
              : colors.muted,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },

  backButton: {
    width: 40,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backIcon: {
    fontSize: 32,
    fontWeight: '300',
    marginTop: -3,
  },

  headerTitle: {
    flex: 1,
    marginHorizontal: 5,
    minWidth: 0,
  },

  eyebrow: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 3,
  },

  title: {
    fontSize: 14,
    fontWeight: '700',
  },

  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  refreshIcon: {
    fontSize: 21,
  },

  toolbar: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
    borderBottomWidth: 1,
  },

  urlBox: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
  },

  lock: {
    fontSize: 8,
    marginRight: 8,
  },

  urlInput: {
    flex: 1,
    fontSize: 11,
  },

  openButton: {
    height: 38,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  openText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  deviceBar: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 10,
  },

  deviceButton: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    borderRadius: 9,
    borderWidth: 1,
  },

  deviceIcon: {
    fontSize: 12,
    marginRight: 6,
  },

  deviceText: {
    fontSize: 10,
    fontWeight: '600',
  },

  previewArea: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },

  deviceFrame: {
    width: '100%',
    maxWidth: 900,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 14,
    elevation: 8,
  },

  mobileFrame: {
    maxWidth: 390,
    minHeight: 560,
    maxHeight: 650,
  },

  tabletFrame: {
    maxWidth: 620,
    minHeight: 650,
    maxHeight: 760,
  },

  desktopFrame: {
    maxWidth: 900,
    minHeight: 500,
    maxHeight: 650,
  },

  browserTop: {
    height: 35,
    backgroundColor: '#F1F2F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#DDDFE5',
  },

  browserDots: {
    position: 'absolute',
    left: 10,
    flexDirection: 'row',
    gap: 4,
  },

  browserDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#C2C5CE',
  },

  browserTitle: {
    color: '#737783',
    fontSize: 9,
    fontWeight: '600',
  },

  page: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  pageContent: {
    padding: 28,
    alignItems: 'center',
  },

  previewLogo: {
    width: 58,
    height: 58,
    borderRadius: 17,
    backgroundColor: '#713CFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  previewLogoText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },

  previewTitle: {
    color: '#151824',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 7,
  },

  previewSubtitle: {
    color: '#70768A',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 25,
  },

  previewCard: {
    width: '100%',
    maxWidth: 500,
    padding: 18,
    backgroundColor: '#F5F6FA',
    borderRadius: 14,
    marginBottom: 18,
  },

  previewCardTitle: {
    color: '#171A24',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 9,
  },

  previewCardText: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 18,
  },

  previewButton: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#713CFF',
  },

  previewButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  previewFooter: {
    marginTop: 30,
  },

  previewFooterText: {
    color: '#A0A5B3',
    fontSize: 9,
  },

  statusBar: {
    height: 31,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderTopWidth: 1,
  },

  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },

  statusText: {
    fontSize: 9,
    fontWeight: '600',
  },
});
