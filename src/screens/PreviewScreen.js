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
  const { colors, radius } = useTheme();

  const webViewRef = useRef(null);

  const [device, setDevice] = useState('mobile');
  const [url, setUrl] = useState('gcode://preview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [consoleMessage, setConsoleMessage] =
    useState('');

  const projectName =
    project?.name || 'Nouveau projet';

  const files = project?.files || {};

  const htmlFile = useMemo(() => {
    const names = Object.keys(files);

    const preferred = [
      'index.html',
      'index.htm',
      'main.html',
    ];

    for (const name of preferred) {
      if (Object.prototype.hasOwnProperty.call(files, name)) {
        return name;
      }
    }

    return (
      names.find((name) =>
        name.toLowerCase().endsWith('.html')
      ) || null
    );
  }, [files]);

  const cssFiles = useMemo(() => {
    return Object.keys(files).filter((name) =>
      name.toLowerCase().endsWith('.css')
    );
  }, [files]);

  const jsFiles = useMemo(() => {
    return Object.keys(files).filter((name) => {
      const lower = name.toLowerCase();

      return (
        lower.endsWith('.js') ||
        lower.endsWith('.mjs')
      );
    });
  }, [files]);

  const escapeHtml = (value = '') => {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  const buildPreviewHtml = () => {
    let baseHtml = htmlFile
      ? files[htmlFile] || ''
      : '';

    /*
     * Si le projet possède déjà un index.html,
     * on l'utilise directement comme base.
     */
    if (baseHtml.trim()) {
      let html = baseHtml;

      const css = cssFiles
        .map((fileName) => {
          return files[fileName] || '';
        })
        .join('\n\n');

      const js = jsFiles
        .filter((fileName) => fileName !== htmlFile)
        .map((fileName) => {
          return files[fileName] || '';
        })
        .join('\n\n');

      if (css.trim()) {
        const styleTag = `
<style data-gcode-file="styles">
${css}
</style>
`;

        if (/<\/head\s*>/i.test(html)) {
          html = html.replace(
            /<\/head\s*>/i,
            `${styleTag}\n</head>`
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

        if (/<\/body\s*>/i.test(html)) {
          html = html.replace(
            /<\/body\s*>/i,
            `${scriptTag}\n</body>`
          );
        } else {
          html += scriptTag;
        }
      }

      return injectGcodeBridge(html);
    }

    /*
     * Aucun index.html :
     * GCODE fabrique automatiquement une page HTML
     * à partir des fichiers CSS / JS disponibles.
     */
    const css = cssFiles
      .map((fileName) => {
        return files[fileName] || '';
      })
      .join('\n\n');

    const js = jsFiles
      .map((fileName) => {
        return files[fileName] || '';
      })
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
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
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
                .map((name) => `• ${name}`)
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
        `${bridge}\n</body>`
      );
    }

    return `${html}\n${bridge}`;
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
    setRefreshKey((value) => value + 1);
  };

  const handleOpen = () => {
    setUrl('gcode://preview');
    handleRefresh();
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(
        event.nativeEvent.data
      );

      if (data?.type === 'console') {
        setConsoleMessage(
          data.message || 'Console'
        );
      }

      if (data?.type === 'error') {
        setConsoleMessage(
          `Erreur : ${
            data.message ||
            'Erreur JavaScript'
          }`
        );
      }
    } catch (error) {
      setConsoleMessage(
        event.nativeEvent.data || ''
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
              colors.panel,
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
              opacity:
                pressed ? 0.55 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.backIcon,
              {
                color: colors.text,
              },
            ]}
          >
            ‹
          </Text>
        </Pressable>

        <View
          style={styles.headerTitle}
        >
          <Text
            style={[
              styles.eyebrow,
              {
                color: colors.muted,
              },
            ]}
          >
            PREVIEW LOCAL
          </Text>

          <Text
            numberOfLines={1}
            style={[
              styles.title,
              {
                color:
                  colors.textStrong,
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
                colors.panel2,
              borderColor:
                colors.border,
              opacity:
                pressed ? 0.6 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.refreshIcon,
              {
                color: colors.text,
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
              colors.panel2,
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
                colors.panel,
              borderColor:
                colors.border,
              borderRadius:
                radius.sm,
            },
          ]}
        >
          <Text
            style={[
              styles.lock,
              {
                color: colors.green,
              },
            ]}
          >
            ●
          </Text>

          <TextInput
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            editable={false}
            style={[
              styles.urlInput,
              {
                color: colors.muted,
              },
            ]}
          />
        </View>

        <Pressable
          onPress={handleOpen}
          style={({ pressed }) => [
            styles.openButton,
            {
              backgroundColor:
                colors.purple,
              borderRadius:
                radius.sm,
              opacity:
                pressed ? 0.75 : 1,
            },
          ]}
        >
          <Text style={styles.openText}>
            Actualiser
          </Text>
        </Pressable>
      </View>

      {/* DEVICE SELECTOR */}
      <View style={styles.deviceBar}>
        <DeviceButton
          label="Mobile"
          icon="▯"
          active={device === 'mobile'}
          onPress={() =>
            setDevice('mobile')
          }
          colors={colors}
        />

        <DeviceButton
          label="Tablette"
          icon="▭"
          active={device === 'tablet'}
          onPress={() =>
            setDevice('tablet')
          }
          colors={colors}
        />

        <DeviceButton
          label="Desktop"
          icon="▣"
          active={device === 'desktop'}
          onPress={() =>
            setDevice('desktop')
          }
          colors={colors}
        />
      </View>

      {/* PREVIEW */}
      <ScrollView
        contentContainerStyle={
          styles.previewArea
        }
        showsVerticalScrollIndicator={
          false
      }
      >
        <View
          style={[
            styles.deviceFrame,
            frameStyle,
            {
              borderColor:
                colors.borderStrong,
            },
          ]}
        >
          {/* BROWSER BAR */}
          <View
            style={styles.browserTop}
          >
            <View
              style={styles.browserDots}
            >
              <View
                style={styles.browserDot}
              />
              <View
                style={styles.browserDot}
              />
              <View
                style={styles.browserDot}
              />
            </View>

            <Text
              numberOfLines={1}
              style={styles.browserTitle}
            >
              {projectName}
            </Text>
          </View>

          {/* WEBVIEW */}
          <View
            style={styles.webViewContainer}
          >
            {loading && (
              <View
                style={styles.loadingOverlay}
              >
                <ActivityIndicator
                  size="small"
                  color="#713CFF"
                />

                <Text
                  style={
                    styles.loadingText
                  }
                >
                  Chargement du projet…
                </Text>
              </View>
            )}

            <WebView
              key={refreshKey}
              ref={webViewRef}
              source={{
                html: previewHtml,
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
              style={styles.webView}
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
                  colors.panel,
                borderColor:
                  colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.consoleLabel,
                {
                  color:
                    colors.muted,
                },
              ]}
            >
              CONSOLE
            </Text>

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
              colors.panel,
            borderTopColor:
              colors.border,
          },
        ]}
      >
        <View
          style={styles.statusLeft}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  colors.green,
              },
            ]}
          />

          <Text
            style={[
              styles.statusText,
              {
                color:
                  colors.muted,
              },
            ]}
          >
            Preview local
          </Text>
        </View>

        <Text
          style={[
            styles.statusText,
            {
              color:
                colors.muted2,
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
              ? colors.purple
              : colors.panel,

          borderColor:
            active
              ? colors.purple
              : colors.border,

          opacity:
            pressed ? 0.7 : 1,
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
    padding: 18,
  },

  deviceFrame: {
    width: '100%',
    maxWidth: 900,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    elevation: 8,
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
    maxWidth: '60%',
  },

  webViewContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },

  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
  },

  loadingText: {
    marginTop: 10,
    color: '#737783',
    fontSize: 11,
  },

  consoleBox: {
    width: '100%',
    maxWidth: 900,
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
  },

  consoleLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 5,
  },

  consoleText: {
    fontSize: 11,
    fontFamily: 'monospace',
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
