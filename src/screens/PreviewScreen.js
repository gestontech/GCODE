import React, {
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';

import { WebView } from 'react-native-webview';

import { useTheme } from '../theme/ThemeContext';

export default function PreviewScreen({
  project,
  onBack,
}) {
  const { theme } = useTheme();

  const {
    colors,
    radius,
    spacing,
  } = theme;

  const webViewRef = useRef(null);

  const [device, setDevice] =
    useState('mobile');

  const [url, setUrl] =
    useState('gcode://preview');

  const [refreshKey, setRefreshKey] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [consoleMessage, setConsoleMessage] =
    useState('');

  const projectName =
    project?.name || 'Nouveau projet';

  const files =
    project?.files || {};

  const htmlFile = useMemo(() => {
    const names =
      Object.keys(files);

    const preferred = [
      'index.html',
      'index.htm',
      'main.html',
    ];

    for (const name of preferred) {
      if (
        Object.prototype.hasOwnProperty.call(
          files,
          name
        )
      ) {
        return name;
      }
    }

    return (
      names.find((name) =>
        name
          .toLowerCase()
          .endsWith('.html')
      ) || null
    );
  }, [files]);

  const cssFiles = useMemo(() => {
    return Object.keys(files).filter(
      (name) =>
        name
          .toLowerCase()
          .endsWith('.css')
    );
  }, [files]);

  const jsFiles = useMemo(() => {
    return Object.keys(files).filter(
      (name) => {
        const lower =
          name.toLowerCase();

        return (
          lower.endsWith('.js') ||
          lower.endsWith('.mjs')
        );
      }
    );
  }, [files]);

  const escapeHtml = (value = '') => {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  const injectGcodeBridge = (html) => {
    const bridge = `
<script>
(function () {
  try {
    const originalLog =
      console.log;

    console.log = function () {
      try {
        if (
          window.ReactNativeWebView
        ) {
          const args =
            Array.from(arguments)
              .map(function (item) {
                try {
                  return typeof item === 'string'
                    ? item
                    : JSON.stringify(item);
                } catch (error) {
                  return String(item);
                }
              });

          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'console',
              level: 'log',
              message: args.join(' ')
            })
          );
        }
      } catch (error) {}

      originalLog.apply(
        console,
        arguments
      );
    };

    window.addEventListener(
      'error',
      function (event) {
        try {
          if (
            window.ReactNativeWebView
          ) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: 'error',
                message:
                  event.message ||
                  'Erreur JavaScript'
              })
            );
          }
        } catch (error) {}
      }
    );
  } catch (error) {}
})();
</script>
`;

    if (/<\/body\s*>/i.test(html)) {
      return html.replace(
        /<\/body\s*>/i,
        `${bridge}
</body>`
      );
    }

    return `${html}
${bridge}`;
  };

  const buildPreviewHtml = () => {
    let baseHtml =
      htmlFile
        ? files[htmlFile] || ''
        : '';

    /*
     * Projet avec fichier HTML.
     */
    if (baseHtml.trim()) {
      let html = baseHtml;

      const css =
        cssFiles
          .map(
            (fileName) =>
              files[fileName] || ''
          )
          .join('\n\n');

      const js =
        jsFiles
          .filter(
            (fileName) =>
              fileName !== htmlFile
          )
          .map(
            (fileName) =>
              files[fileName] || ''
          )
          .join('\n\n');

      if (css.trim()) {
        const styleTag = `
<style data-gcode-file="styles">
${css}
</style>
`;

        if (
          /<\/head\s*>/i.test(html)
        ) {
          html = html.replace(
            /<\/head\s*>/i,
            `${styleTag}
</head>`
          );
        } else {
          html = `
${styleTag}
${html}
`;
        }
      }

      if (js.trim()) {
        const scriptTag = `
<script data-gcode-file="scripts">
${js}
</script>
`;

        if (
          /<\/body\s*>/i.test(html)
        ) {
          html = html.replace(
            /<\/body\s*>/i,
            `${scriptTag}
</body>`
          );
        } else {
          html += scriptTag;
        }
      }

      return injectGcodeBridge(
        html
      );
    }

    /*
     * Aucun HTML :
     * GCODE génère une page
     * de démonstration locale.
     */
    const css =
      cssFiles
        .map(
          (fileName) =>
            files[fileName] || ''
        )
        .join('\n\n');

    const js =
      jsFiles
        .map(
          (fileName) =>
            files[fileName] || ''
        )
        .join('\n\n');

    const escapedProjectName =
      escapeHtml(projectName);

    const hasFiles =
      Object.keys(files).length > 0;

    return injectGcodeBridge(`
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>${escapedProjectName}</title>

  <style>
    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      width: 100%;
      min-height: 100%;
    }

    body {
      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

      background:
        linear-gradient(
          135deg,
          #0b1020,
          #15102c
        );

      color: #ffffff;
      padding: 32px 20px;
    }

    .gcode-page {
      width: 100%;
      max-width: 760px;
      margin: 0 auto;
    }

    .gcode-logo {
      width: 64px;
      height: 64px;
      border-radius: 18px;

      display: flex;
      align-items: center;
      justify-content: center;

      background:
        linear-gradient(
          135deg,
          #713cff,
          #9b6cff
        );

      font-size: 30px;
      font-weight: 900;

      margin-bottom: 22px;
    }

    h1 {
      margin: 0 0 10px;
      font-size: 32px;
      line-height: 1.1;
    }

    .subtitle {
      color: #a7afc4;
      line-height: 1.6;
      margin-bottom: 28px;
    }

    .card {
      background:
        rgba(255,255,255,0.06);

      border:
        1px solid
        rgba(255,255,255,0.1);

      border-radius: 18px;
      padding: 22px;
      margin-bottom: 18px;
    }

    .card-title {
      font-size: 17px;
      font-weight: 700;
      margin-bottom: 10px;
    }

    .files {
      color: #a7afc4;
      font-family: monospace;
      white-space: pre-wrap;
      line-height: 1.7;
    }

    .button {
      display: inline-block;
      padding: 13px 18px;
      border-radius: 11px;
      background: #713cff;
      color: #ffffff;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
    }

    .footer {
      color: #737c91;
      font-size: 12px;
      margin-top: 28px;
    }
  </style>

  <style data-gcode-custom-css>
${css}
  </style>
</head>

<body>

  <main class="gcode-page">

    <div class="gcode-logo">
      G
    </div>

    <h1>
      ${escapedProjectName}
    </h1>

    <div class="subtitle">
      Aperçu local généré par GCODE V3.
      Aucun serveur externe n'est nécessaire.
    </div>

    <section class="card">

      <div class="card-title">
        Projet prêt
      </div>

      <div class="files">
        ${
          hasFiles
            ? Object.keys(files)
                .map(
                  (name) =>
                    '• ' + name
                )
                .join('\n')
            : 'Aucun fichier dans ce projet.'
        }
      </div>

    </section>

    <a
      class="button"
      href="#"
      onclick="gcodeTest(); return false;"
    >
      Tester le projet
    </a>

    <div
      id="gcode-result"
      class="footer"
    >
      Créé avec GCODE V3
    </div>

  </main>

  <script>
    function gcodeTest() {
      const result =
        document.getElementById(
          'gcode-result'
        );

      if (result) {
        result.textContent =
          '✓ JavaScript fonctionne dans le Preview GCODE.';
      }

      if (
        window.ReactNativeWebView
      ) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: 'console',
            level: 'log',
            message:
              'JavaScript exécuté avec succès.'
          })
        );
      }
    }
  </script>

  <script data-gcode-custom-js>
${js}
  </script>

</body>
</html>
`);
  };

  const previewHtml = useMemo(
    () => buildPreviewHtml(),
    [
      project,
      files,
      projectName,
      htmlFile,
      cssFiles,
      jsFiles,
    ]
  );

  const handleRefresh = () => {
    setLoading(true);
    setConsoleMessage('');

    setRefreshKey(
      (value) => value + 1
    );
  };

  const handleOpen = () => {
    setUrl('gcode://preview');
    handleRefresh();
  };

  const handleWebViewMessage = (
    event
  ) => {
    try {
      const data =
        JSON.parse(
          event.nativeEvent.data
        );

      if (
        data?.type === 'console'
      ) {
        setConsoleMessage(
          data.message ||
            'Console'
        );
      }

      if (
        data?.type === 'error'
      ) {
        setConsoleMessage(
          `Erreur : ${
            data.message ||
            'Erreur JavaScript'
          }`
        );
      }
    } catch (error) {
      setConsoleMessage(
        event.nativeEvent.data ||
          ''
      );
    }
  };

  const frameStyle =
    device === 'mobile'
      ? styles.mobileFrame
      : device === 'tablet'
        ? styles.tabletFrame
        : styles.desktopFrame;

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
      {/* HEADER */}

      <View
        style={[
          styles.header,
          {
            backgroundColor:
              colors.glass,

            borderBottomColor:
              colors.border,
          },
        ]}
      >
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={({ pressed }) => [
            styles.backButton,
            {
              backgroundColor:
                colors.glassSoft,

              borderColor:
                colors.border,

              borderRadius:
                radius.pill,

              opacity:
                pressed ? 0.6 : 1,

              transform: [
                {
                  scale:
                    pressed ? 0.92 : 1,
                },
              ],
            },
          ]}
        >
          <Text
            style={[
              styles.backIcon,
              {
                color:
                  colors.text,
              },
            ]}
          >
            ‹
          </Text>
        </Pressable>

        <View
          style={
            styles.headerTitle
          }
        >
          <View
            style={[
              styles.previewBadge,
              {
                backgroundColor:
                  colors.glassStrong,

                borderColor:
                  colors.border,

                borderRadius:
                  radius.pill,
              },
            ]}
          >
            <View
              style={[
                styles.badgeDot,
                {
                  backgroundColor:
                    colors.success,
                },
              ]}
            />

            <Text
              style={[
                styles.eyebrow,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              PREVIEW LOCAL
            </Text>
          </View>

          <Text
            numberOfLines={1}
            style={[
              styles.title,
              {
                color:
                  colors.text,
              },
            ]}
          >
            {projectName}
          </Text>
        </View>

        <Pressable
          onPress={handleRefresh}
          accessibilityRole="button"
          accessibilityLabel="Actualiser le preview"
          style={({ pressed }) => [
            styles.refreshButton,
            {
              backgroundColor:
                colors.glassStrong,

              borderColor:
                colors.border,

              borderRadius:
                radius.pill,

              opacity:
                pressed ? 0.6 : 1,

              transform: [
                {
                  scale:
                    pressed ? 0.92 : 1,
                },
              ],
            },
          ]}
        >
          <Text
            style={[
              styles.refreshIcon,
              {
                color:
                  colors.primary,
              },
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
            backgroundColor:
              colors.glassSoft,

            borderBottomColor:
              colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.urlBox,
            {
              backgroundColor:
                colors.glass,

              borderColor:
                colors.border,

              borderRadius:
                radius.pill,
            },
          ]}
        >
          <View
            style={[
              styles.secureDot,
              {
                backgroundColor:
                  colors.success,
              },
            ]}
          />

          <TextInput
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            editable={false}
            style={[
              styles.urlInput,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          />
        </View>

        <Pressable
          onPress={handleOpen}
          accessibilityRole="button"
          accessibilityLabel="Actualiser le projet"
          style={({ pressed }) => [
            styles.openButton,
            {
              backgroundColor:
                colors.primarySoft,

              borderColor:
                colors.primary,

              borderRadius:
                radius.pill,

              opacity:
                pressed ? 0.7 : 1,

              transform: [
                {
                  scale:
                    pressed ? 0.96 : 1,
                },
              ],
            },
          ]}
        >
          <Text
            style={[
              styles.openText,
              {
                color:
                  colors.primary,
              },
            ]}
          >
            Actualiser
          </Text>
        </Pressable>
      </View>

      {/* DEVICE SELECTOR */}

      <View
        style={[
          styles.deviceBar,
          {
            backgroundColor:
              colors.glassSoft,
          },
        ]}
      >
        <DeviceButton
          label="Mobile"
          icon="▯"
          active={
            device === 'mobile'
          }
          onPress={() =>
            setDevice('mobile')
          }
          colors={colors}
          radius={radius}
        />

        <DeviceButton
          label="Tablette"
          icon="▭"
          active={
            device === 'tablet'
          }
          onPress={() =>
            setDevice('tablet')
          }
          colors={colors}
          radius={radius}
        />

        <DeviceButton
          label="Desktop"
          icon="▣"
          active={
            device === 'desktop'
          }
          onPress={() =>
            setDevice('desktop')
          }
          colors={colors}
          radius={radius}
        />
      </View>

      {/* PREVIEW */}

      <ScrollView
        contentContainerStyle={[
          styles.previewArea,
          {
            paddingBottom:
              spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={[
            styles.deviceFrame,
            frameStyle,
            {
              backgroundColor:
                colors.glass,

              borderColor:
                colors.borderStrong,

              borderRadius:
                radius.xl,

              shadowColor:
                colors.shadow,
            },
          ]}
        >
          {/* BROWSER BAR */}

          <View
            style={[
              styles.browserTop,
              {
                backgroundColor:
                  colors.glassStrong,

                borderBottomColor:
                  colors.border,
              },
            ]}
          >
            <View
              style={
                styles.browserDots
              }
            >
              <View
                style={[
                  styles.browserDot,
                  {
                    backgroundColor:
                      colors.danger,
                  },
                ]}
              />

              <View
                style={[
                  styles.browserDot,
                  {
                    backgroundColor:
                      colors.warning,
                  },
                ]}
              />

              <View
                style={[
                  styles.browserDot,
                  {
                    backgroundColor:
                      colors.success,
                  },
                ]}
              />
            </View>

            <View
              style={[
                styles.browserAddress,
                {
                  backgroundColor:
                    colors.glassSoft,

                  borderColor:
                    colors.border,

                  borderRadius:
                    radius.pill,
                },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.browserTitle,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                {projectName}
              </Text>
            </View>
          </View>

          {/* WEBVIEW */}

          <View
            style={[
              styles.webViewContainer,
              {
                backgroundColor:
                  colors.background,
              },
            ]}
          >
            {loading && (
              <View
                style={[
                  styles.loadingOverlay,
                  {
                    backgroundColor:
                      colors.background,
                  },
                ]}
              >
                <View
                  style={[
                    styles.loadingCard,
                    {
                      backgroundColor:
                        colors.glassStrong,

                      borderColor:
                        colors.border,

                      borderRadius:
                        radius.xl,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.loadingIcon,
                      {
                        backgroundColor:
                          colors.primarySoft,

                        borderColor:
                          colors.border,

                        borderRadius:
                          radius.pill,
                      },
                    ]}
                  >
                    <ActivityIndicator
                      size="small"
                      color={
                        colors.primary
                      }
                    />
                  </View>

                  <Text
                    style={[
                      styles.loadingText,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    Chargement du projet…
                  </Text>

                  <Text
                    style={[
                      styles.loadingSubtext,
                      {
                        color:
                          colors.textMuted,
                      },
                    ]}
                  >
                    GCODE prépare
                    l’aperçu local
                  </Text>
                </View>
              </View>
            )}

            <WebView
              key={refreshKey}
              ref={webViewRef}
              source={{
                html:
                  previewHtml,

                baseUrl:
                  'https://gcode.local/',
              }}
              originWhitelist={[
                '*',
              ]}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              scrollEnabled
              automaticallyAdjustContentInsets={
                false
              }
              onLoadStart={() =>
                setLoading(true)
              }
              onLoadEnd={() =>
                setLoading(false)
              }
              onMessage={
                handleWebViewMessage
              }
              style={
                styles.webView
              }
            />
          </View>
        </View>

        {/* CONSOLE */}

        {consoleMessage ? (
          <View
            style={[
              styles.consoleBox,
              {
                backgroundColor:
                  colors.glassStrong,

                borderColor:
                  colors.border,

                borderRadius:
                  radius.xl,
              },
            ]}
          >
            <View
              style={
                styles.consoleHeader
              }
            >
              <View
                style={[
                  styles.consoleDot,
                  {
                    backgroundColor:
                      colors.warning,
                  },
                ]}
              />

              <Text
                style={[
                  styles.consoleLabel,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                CONSOLE
              </Text>
            </View>

            <Text
              style={[
                styles.consoleText,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              {consoleMessage}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* STATUS */}

      <View
        style={[
          styles.statusBar,
          {
            backgroundColor:
              colors.glass,

            borderTopColor:
              colors.border,
          },
        ]}
      >
        <View
          style={
            styles.statusLeft
          }
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  colors.success,
              },
            ]}
          />

          <Text
            style={[
              styles.statusText,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            Preview local
          </Text>
        </View>

        <View
          style={[
            styles.resolutionPill,
            {
              backgroundColor:
                colors.glassSoft,

              borderColor:
                colors.border,

              borderRadius:
                radius.pill,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  colors.textMuted,
              },
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
    </View>
  );
}

function DeviceButton({
  label,
  icon,
  active,
  onPress,
  colors,
  radius,
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{
        selected: active,
      }}
      style={({ pressed }) => [
        styles.deviceButton,
        {
          backgroundColor:
            active
              ? colors.primarySoft
              : colors.glass,

          borderColor:
            active
              ? colors.primary
              : colors.border,

          borderRadius:
            radius.pill,

          opacity:
            pressed ? 0.7 : 1,

          transform: [
            {
              scale:
                pressed
                  ? 0.96
                  : 1,
            },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.deviceIconContainer,
          {
            backgroundColor:
              active
                ? colors.glassStrong
                : colors.glassSoft,

            borderColor:
              colors.border,

            borderRadius:
              radius.pill,
          },
        ]}
      >
        <Text
          style={[
            styles.deviceIcon,
            {
              color:
                active
                  ? colors.primary
                  : colors.textSecondary,
            },
          ]}
        >
          {icon}
        </Text>
      </View>

      <Text
        style={[
          styles.deviceText,
          {
            color:
              active
                ? colors.primary
                : colors.textSecondary,
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
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth:
      StyleSheet.hairlineWidth,
  },

  backIcon: {
    fontSize: 32,
    fontWeight: '300',
    marginTop: -3,
  },

  headerTitle: {
    flex: 1,
    marginHorizontal: 8,
    minWidth: 0,
  },

  previewBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth:
      StyleSheet.hairlineWidth,
  },

  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    marginRight: 5,
  },

  eyebrow: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  title: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },

  refreshButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth:
      StyleSheet.hairlineWidth,
  },

  refreshIcon: {
    fontSize: 21,
    fontWeight: '700',
  },

  toolbar: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  urlBox: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    borderWidth:
      StyleSheet.hairlineWidth,
  },

  secureDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    marginRight: 8,
  },

  urlInput: {
    flex: 1,
    fontSize: 11,
  },

  openButton: {
    height: 40,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth:
      StyleSheet.hairlineWidth,
  },

  openText: {
    fontSize: 10,
    fontWeight: '800',
  },

  deviceBar: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 10,
  },

  deviceButton: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderWidth:
      StyleSheet.hairlineWidth,
  },

  deviceIconContainer: {
    width: 27,
    height: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth:
      StyleSheet.hairlineWidth,
    marginRight: 6,
  },

  deviceIcon: {
    fontSize: 11,
    fontWeight: '700',
  },

  deviceText: {
    fontSize: 10,
    fontWeight: '700',
  },

  previewArea: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 14,
  },

  deviceFrame: {
    width: '100%',
    maxWidth: 900,
    overflow: 'hidden',
    borderWidth: 1,
    elevation: 10,
  },

  mobileFrame: {
    maxWidth: 390,
    height: 650,
  },

  tabletFrame: {
    maxWidth: 620,
    height: 760,
  },

  desktopFrame: {
    maxWidth: 900,
    height: 650,
  },

  browserTop: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  browserDots: {
    position: 'absolute',
    left: 10,
    flexDirection: 'row',
    gap: 5,
  },

  browserDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
  },

  browserAddress: {
    minWidth: 110,
    maxWidth: '60%',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth:
      StyleSheet.hairlineWidth,
  },

  browserTitle: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },

  webViewContainer: {
    flex: 1,
    position: 'relative',
  },

  webView: {
    flex: 1,
    backgroundColor:
      '#FFFFFF',
  },

  loadingOverlay: {
    position: 'absolute',
    zIndex: 10,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingCard: {
    minWidth: 180,
    paddingHorizontal: 22,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth:
      StyleSheet.hairlineWidth,
  },

  loadingIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth:
      StyleSheet.hairlineWidth,
    marginBottom: 10,
  },

  loadingText: {
    fontSize: 11,
    fontWeight: '800',
  },

  loadingSubtext: {
    fontSize: 9,
    marginTop: 4,
  },

  consoleBox: {
    width: '100%',
    maxWidth: 900,
    marginTop: 12,
    padding: 13,
    borderWidth:
      StyleSheet.hairlineWidth,
  },

  consoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },

  consoleDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    marginRight: 6,
  },

  consoleLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  consoleText: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 17,
  },

  statusBar: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderTopWidth:
      StyleSheet.hairlineWidth,
  },

  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    marginRight: 6,
  },

  statusText: {
    fontSize: 9,
    fontWeight: '600',
  },

  resolutionPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth:
      StyleSheet.hairlineWidth,
  },
});
