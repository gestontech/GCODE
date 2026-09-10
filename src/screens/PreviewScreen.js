import React, {
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  Pressable,
  StyleSheet,
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const files = project?.files || [];

  const getFileContent = (fileName) => {
    const file = files.find(
      (item) =>
        String(item?.name || '').toLowerCase() ===
        fileName.toLowerCase()
    );

    return file?.content || '';
  };

  const html = useMemo(() => {
    const indexHtml = getFileContent('index.html');
    const css = getFileContent('style.css');
    const js = getFileContent('script.js');

    let documentHtml = indexHtml;

    if (!documentHtml.trim()) {
      documentHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>${project?.name || 'GCODE Preview'}</title>
</head>
<body>
</body>
</html>
`;
    }

    const styleTag = `
<style>
${css}
</style>
`;

    const scriptTag = `
<script>
window.onerror = function(message, source, lineno, colno) {
  window.ReactNativeWebView?.postMessage(
    JSON.stringify({
      type: 'error',
      message: String(message),
      line: lineno,
      column: colno
    })
  );
};

window.addEventListener('unhandledrejection', function(event) {
  window.ReactNativeWebView?.postMessage(
    JSON.stringify({
      type: 'error',
      message: String(event.reason)
    })
  );
});

${js}
</script>
`;

    if (/<\/head>/i.test(documentHtml)) {
      documentHtml = documentHtml.replace(
        /<\/head>/i,
        `${styleTag}</head>`
      );
    } else {
      documentHtml =
        styleTag + documentHtml;
    }

    if (/<\/body>/i.test(documentHtml)) {
      documentHtml = documentHtml.replace(
        /<\/body>/i,
        `${scriptTag}</body>`
      );
    } else {
      documentHtml += scriptTag;
    }

    return documentHtml;
  }, [files, project?.name]);

  function reloadPreview() {
    setError(null);
    setLoading(true);
    webViewRef.current?.reload();
  }

  function handleMessage(event) {
    try {
      const data = JSON.parse(
        event.nativeEvent.data
      );

      if (data?.type === 'error') {
        setError(
          data.message ||
            'Une erreur JavaScript est survenue.'
        );
      }
    } catch {
      // Message WebView non JSON.
    }
  }

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
          style={({ pressed }) => [
            styles.backButton,
            {
              opacity: pressed ? 0.6 : 1,
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

        <View style={styles.titleArea}>
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              {
                color: colors.text,
              },
            ]}
          >
            {project?.name ||
              'Aperçu'}
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: colors.muted,
              },
            ]}
          >
            Preview
          </Text>
        </View>

        <Pressable
          onPress={reloadPreview}
          style={({ pressed }) => [
            styles.reloadButton,
            {
              backgroundColor:
                colors.panel2,
              borderColor:
                colors.border,
              borderRadius:
                radius.sm,
              opacity: pressed
                ? 0.6
                : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.reloadIcon,
              {
                color: colors.text,
              },
            ]}
          >
            ↻
          </Text>

          <Text
            style={[
              styles.reloadText,
              {
                color: colors.text,
              },
            ]}
          >
            Actualiser
          </Text>
        </Pressable>
      </View>

      {/* STATUS */}
      {loading && (
        <View
          style={[
            styles.loadingBar,
            {
              backgroundColor:
                colors.panel,
              borderBottomColor:
                colors.border,
            },
          ]}
        >
          <ActivityIndicator
            size="small"
            color={colors.purple}
          />

          <Text
            style={[
              styles.loadingText,
              {
                color: colors.muted,
              },
            ]}
          >
            Chargement de l'aperçu…
          </Text>
        </View>
      )}

      {/* ERREUR */}
      {error && (
        <View
          style={[
            styles.errorBox,
            {
              backgroundColor:
                colors.panel,
              borderColor:
                colors.red,
            },
          ]}
        >
          <Text
            style={[
              styles.errorTitle,
              {
                color: colors.red,
              },
            ]}
          >
            Erreur JavaScript
          </Text>

          <Text
            style={[
              styles.errorText,
              {
                color: colors.text,
              },
            ]}
          >
            {error}
          </Text>
        </View>
      )}

      {/* WEBVIEW */}
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{
            html,
          }}
          originWhitelist={[
            '*',
          ]}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          setSupportMultipleWindows={false}
          mixedContentMode="always"
          allowsInlineMediaPlayback
          onLoadStart={() => {
            setLoading(true);
          }}
          onLoadEnd={() => {
            setLoading(false);
          }}
          onError={(event) => {
            setLoading(false);

            setError(
              event.nativeEvent?.description ||
                'Impossible de charger l’aperçu.'
            );
          }}
          onMessage={handleMessage}
          style={[
            styles.webView,
            {
              backgroundColor:
                '#ffffff',
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    height: 58,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backIcon: {
    fontSize: 34,
    fontWeight: '300',
  },

  titleArea: {
    flex: 1,
    marginLeft: 4,
  },

  title: {
    fontSize: 14,
    fontWeight: '900',
  },

  subtitle: {
    fontSize: 10,
    marginTop: 2,
  },

  reloadButton: {
    minHeight: 38,
    paddingHorizontal: 11,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  reloadIcon: {
    fontSize: 18,
    fontWeight: '700',
  },

  reloadText: {
    fontSize: 10,
    fontWeight: '800',
  },

  loadingBar: {
    minHeight: 34,
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  loadingText: {
    fontSize: 10,
    fontWeight: '600',
  },

  errorBox: {
    margin: 8,
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
  },

  errorTitle: {
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 4,
  },

  errorText: {
    fontSize: 10,
    lineHeight: 15,
  },

  webViewContainer: {
    flex: 1,
    overflow: 'hidden',
  },

  webView: {
    flex: 1,
  },
});
