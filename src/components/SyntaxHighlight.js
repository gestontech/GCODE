import React from 'react';
import { Text, View } from 'react-native';

function escapeText(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function tokenizeHTML(code) {
  const tokens = [];
  const regex =
    /(<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>|"[^"]*"|'[^']*'|`[^`]*`)/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(code)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        text: code.slice(lastIndex, match.index),
        type: 'plain',
      });
    }

    const value = match[0];

    if (value.startsWith('<!--')) {
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
    } else {
      tokens.push({
        text: value,
        type: 'tag',
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

function tokenizeCSS(code) {
  const tokens = [];
  const regex =
    /(\/\*[\s\S]*?\*\/|"[^"]*"|'[^']*'|#[0-9a-fA-F]{3,8}|\b\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|s|ms)?\b)/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(code)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        text: code.slice(lastIndex, match.index),
        type: 'plain',
      });
    }

    const value = match[0];

    if (value.startsWith('/*')) {
      tokens.push({
        text: value,
        type: 'comment',
      });
    } else if (
      value.startsWith('"') ||
      value.startsWith("'")
    ) {
      tokens.push({
        text: value,
        type: 'string',
      });
    } else if (value.startsWith('#')) {
      tokens.push({
        text: value,
        type: 'color',
      });
    } else {
      tokens.push({
        text: value,
        type: 'number',
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

function tokenizeJavaScript(code) {
  const tokens = [];
  const regex =
    /(\/\/.*|\/\*[\s\S]*?\*\/|"[^"]*"|'[^']*'|`[^`]*`|\b(?:const|let|var|function|return|if|else|for|while|new|class|extends|import|from|export|default|async|await|try|catch|throw|true|false|null|undefined)\b|\b\d+(?:\.\d+)?\b)/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(code)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        text: code.slice(lastIndex, match.index),
        type: 'plain',
      });
    }

    const value = match[0];

    if (
      value.startsWith('//') ||
      value.startsWith('/*')
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
    } else if (/^\d/.test(value)) {
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

function getTokens(code, language) {
  const normalized =
    String(language || '').toLowerCase();

  if (
    normalized === 'html' ||
    normalized === 'htm'
  ) {
    return tokenizeHTML(code);
  }

  if (
    normalized === 'css'
  ) {
    return tokenizeCSS(code);
  }

  if (
    normalized === 'javascript' ||
    normalized === 'js' ||
    normalized === 'jsx'
  ) {
    return tokenizeJavaScript(code);
  }

  return [
    {
      text: code,
      type: 'plain',
    },
  ];
}

export default function SyntaxHighlight({
  code = '',
  language = 'text',
  colors,
}) {
  const tokens = getTokens(
    code,
    language
  );

  function getColor(type) {
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

  return (
    <View>
      {tokens.map((token, index) => (
        <Text
          key={index}
          style={{
            color: getColor(token.type),
            fontFamily: 'monospace',
            fontSize: 12,
            lineHeight: 20,
          }}
        >
          {escapeText(token.text)}
        </Text>
      ))}
    </View>
  );
}
