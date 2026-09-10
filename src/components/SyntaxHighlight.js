import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

function tokenize(code, language) {
  const normalized =
    String(language || '')
      .toLowerCase();

  let regex;

  if (
    normalized === 'html' ||
    normalized === 'htm'
  ) {
    regex =
      /(<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>|"[^"]*"|'[^']*'|`[^`]*`)/g;
  } else if (normalized === 'css') {
    regex =
      /(\/\*[\s\S]*?\*\/|"[^"]*"|'[^']*'|#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|s|ms)?\b)/g;
  } else if (
    normalized === 'javascript' ||
    normalized === 'js' ||
    normalized === 'jsx' ||
    normalized === 'typescript' ||
    normalized === 'ts' ||
    normalized === 'tsx'
  ) {
    regex =
      /(\/\/.*|\/\*[\s\S]*?\*\/|"[^"]*"|'[^']*'|`[^`]*`|\b(?:const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|import|from|export|default|async|await|try|catch|finally|throw|typeof|instanceof|interface|type|public|private|protected|true|false|null|undefined)\b|\b\d+(?:\.\d+)?\b)/g;
  } else {
    return [
      {
        text: code,
        type: 'plain',
      },
    ];
  }

  const tokens = [];

  let lastIndex = 0;
  let match;

  while (
    (match = regex.exec(code)) !== null
  ) {
    if (match.index > lastIndex) {
      tokens.push({
        text: code.slice(
          lastIndex,
          match.index
        ),
        type: 'plain',
      });
    }

    const value = match[0];

    if (
      value.startsWith('//') ||
      value.startsWith('/*') ||
      value.startsWith('<!--')
    ) {
      tokens.push({
        text: value,
        type: 'comment',
      });
    } else if (
      value.startsWith('"') ||
      value.startsWith("'") ||
      value.startsWith('`')
    ) {
      tokens.push({
        text: value,
        type: 'string',
      });
    } else if (
      value.startsWith('<')
    ) {
      tokens.push({
        text: value,
        type: 'tag',
      });
    } else if (
      /^#[0-9a-fA-F]/.test(value)
    ) {
      tokens.push({
        text: value,
        type: 'color',
      });
    } else if (
      /^\d/.test(value)
    ) {
      tokens.push({
        text: value,
        type: 'number',
      });
    } else {
      tokens.push({
        text: value,
        type: 'keyword',
      });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < code.length) {
    tokens.push({
      text: code.slice(lastIndex),
      type: 'plain',
    });
  }

  return tokens;
}

function splitTokensIntoLines(
  tokens
) {
  const lines = [[]];

  tokens.forEach((token) => {
    const parts =
      token.text.split('\n');

    parts.forEach(
      (part, index) => {
        if (part.length > 0) {
          lines[
            lines.length - 1
          ].push({
            text: part,
            type: token.type,
          });
        }

        if (
          index <
          parts.length - 1
        ) {
          lines.push([]);
        }
      }
    );
  });

  return lines;
}

function getColor(
  type,
  colors
) {
  switch (type) {
    case 'comment':
      return colors.muted;

    case 'tag':
      return colors.blue;

    case 'keyword':
      return colors.purple;

    case 'string':
      return colors.green;

    case 'number':
      return colors.red;

    case 'color':
      return colors.red;

    default:
      return colors.editorText;
  }
}

export default function SyntaxHighlight({
  code = '',
  language = 'text',
  colors,
}) {
  const lines = useMemo(() => {
    const tokens = tokenize(
      String(code),
      language
    );

    return splitTokensIntoLines(
      tokens
    );
  }, [code, language]);

  return (
    <View>
      {lines.map(
        (line, lineIndex) => (
          <Text
            key={lineIndex}
            style={{
              fontFamily: 'monospace',
              fontSize: 12,
              lineHeight: 20,
              minHeight: 20,
              color:
                colors.editorText,
              includeFontPadding: false,
            }}
          >
            {line.length === 0
              ? ' '
              : line.map(
                  (token, tokenIndex) => (
                    <Text
                      key={`${lineIndex}-${tokenIndex}`}
                      style={{
                        color:
                          getColor(
                            token.type,
                            colors
                          ),
                      }}
                    >
                      {token.text}
                    </Text>
                  )
                )}
          </Text>
        )
      )}
    </View>
  );
}
