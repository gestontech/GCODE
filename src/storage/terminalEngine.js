function normalizePath(path) {
  if (!path) {
    return '';
  }

  return path
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^\.\/+/, '')
    .replace(/^\/+/, '')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '');
}

function stripQuotes(value) {
  return value
    .trim()
    .replace(/^["']|["']$/g, '');
}

function splitCommand(input) {
  const result = [];
  let current = '';
  let quote = null;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (
      (char === '"' || char === "'") &&
      (!quote || quote === char)
    ) {
      quote = quote ? null : char;
      continue;
    }

    if (/\s/.test(char) && !quote) {
      if (current) {
        result.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) {
    result.push(current);
  }

  return result;
}

function formatFileList(files, cwd = '') {
  const names = Object.keys(files || {});
  const normalizedCwd = normalizePath(cwd);

  const visible = names
    .filter((name) => {
      if (!normalizedCwd) {
        return true;
      }

      return (
        normalizePath(name) === normalizedCwd ||
        normalizePath(name).startsWith(
          `${normalizedCwd}/`
        )
      );
    })
    .map((name) => {
      const normalized = normalizePath(name);

      if (!normalizedCwd) {
        return normalized;
      }

      return normalized
        .slice(normalizedCwd.length)
        .replace(/^\/+/, '');
    })
    .filter(Boolean);

  if (!visible.length) {
    return '(dossier vide)';
  }

  return visible
    .sort((a, b) => a.localeCompare(b))
    .join('\n');
}

export function createTerminalEngine({
  project,
  files,
  cwd = '',
  onCreateFile,
  onDeleteFile,
  onWriteFile,
}) {
  const projectName =
    project?.name || 'GCODE Project';

  const normalizedFiles = files || {};

  async function execute(commandLine) {
    const input = commandLine.trim();

    if (!input) {
      return {
        output: '',
        nextCwd: cwd,
      };
    }

    const args = splitCommand(input);
    const command = (args.shift() || '').toLowerCase();

    if (command === 'help') {
      return {
        output:
          [
            'GCODE Terminal',
            '',
            'Commandes disponibles :',
            '  help              Afficher cette aide',
            '  clear             Effacer le terminal',
            '  pwd               Afficher le dossier actuel',
            '  ls                Lister les fichiers',
            '  dir               Lister les fichiers',
            '  cat <fichier>     Afficher un fichier',
            '  type <fichier>    Afficher un fichier',
            '  touch <fichier>   Créer un fichier',
            '  rm <fichier>      Supprimer un fichier',
            '  del <fichier>     Supprimer un fichier',
            '  echo <texte>      Afficher du texte',
            '  echo <texte> > f  Écrire dans un fichier',
            '  head <fichier>    Afficher le début',
            '  tail <fichier>    Afficher la fin',
            '  wc <fichier>      Compter les lignes',
            '  find <texte>      Rechercher dans les fichiers',
            '',
            'Terminal GCODE : les commandes agissent sur',
            'les fichiers du projet courant.',
          ].join('\n'),
        nextCwd: cwd,
      };
    }

    if (
      command === 'clear' ||
      command === 'cls'
    ) {
      return {
        output: '__CLEAR__',
        nextCwd: cwd,
      };
    }

    if (
      command === 'pwd'
    ) {
      const path = cwd
        ? `/projects/${projectName}/${cwd}`
        : `/projects/${projectName}`;

      return {
        output: path,
        nextCwd: cwd,
      };
    }

    if (
      command === 'ls' ||
      command === 'dir'
    ) {
      return {
        output: formatFileList(
          normalizedFiles,
          cwd
        ),
        nextCwd: cwd,
      };
    }

    if (
      command === 'cat' ||
      command === 'type'
    ) {
      const fileName = normalizePath(
        args.join(' ')
      );

      if (!fileName) {
        return {
          output:
            'Usage: cat <fichier>',
          nextCwd: cwd,
        };
      }

      const content =
        normalizedFiles[fileName];

      if (
        typeof content !== 'string'
      ) {
        return {
          output:
            `cat: fichier introuvable: ${fileName}`,
          nextCwd: cwd,
        };
      }

      return {
        output:
          content || '(fichier vide)',
        nextCwd: cwd,
      };
    }

    if (
      command === 'touch'
    ) {
      const fileName = normalizePath(
        args.join(' ')
      );

      if (!fileName) {
        return {
          output:
            'Usage: touch <fichier>',
          nextCwd: cwd,
        };
      }

      if (
        Object.prototype.hasOwnProperty.call(
          normalizedFiles,
          fileName
        )
      ) {
        return {
          output:
            `touch: le fichier existe déjà: ${fileName}`,
          nextCwd: cwd,
        };
      }

      if (
        typeof onCreateFile !==
        'function'
      ) {
        return {
          output:
            'Erreur: création de fichier indisponible.',
          nextCwd: cwd,
        };
      }

      await onCreateFile(
        fileName,
        ''
      );

      return {
        output:
          `Fichier créé: ${fileName}`,
        nextCwd: cwd,
      };
    }

    if (
      command === 'rm' ||
      command === 'del'
    ) {
      const fileName = normalizePath(
        args.join(' ')
      );

      if (!fileName) {
        return {
          output:
            'Usage: rm <fichier>',
          nextCwd: cwd,
        };
      }

      if (
        !Object.prototype.hasOwnProperty.call(
          normalizedFiles,
          fileName
        )
      ) {
        return {
          output:
            `rm: fichier introuvable: ${fileName}`,
          nextCwd: cwd,
        };
      }

      if (
        typeof onDeleteFile !==
        'function'
      ) {
        return {
          output:
            'Erreur: suppression de fichier indisponible.',
          nextCwd: cwd,
        };
      }

      await onDeleteFile(fileName);

      return {
        output:
          `Fichier supprimé: ${fileName}`,
        nextCwd: cwd,
      };
    }

    if (
      command === 'echo'
    ) {
      const raw = args.join(' ');

      const redirectMatch =
        raw.match(
          /^(.*)\s+>\s+(.+)$/
        );

      if (redirectMatch) {
        const text =
          stripQuotes(
            redirectMatch[1]
          );

        const fileName =
          normalizePath(
            redirectMatch[2]
          );

        if (!fileName) {
          return {
            output:
              'Usage: echo texte > fichier',
            nextCwd: cwd,
          };
        }

        if (
          typeof onWriteFile !==
          'function'
        ) {
          return {
            output:
              'Erreur: écriture de fichier indisponible.',
            nextCwd: cwd,
          };
        }

        await onWriteFile(
          fileName,
          text
        );

        return {
          output:
            `Fichier écrit: ${fileName}`,
          nextCwd: cwd,
        };
      }

      return {
        output:
          stripQuotes(raw),
        nextCwd: cwd,
      };
    }

    if (
      command === 'head' ||
      command === 'tail'
    ) {
      const fileName = normalizePath(
        args[0] || ''
      );

      const amount =
        Number(args[1]) || 10;

      if (!fileName) {
        return {
          output:
            `Usage: ${command} <fichier> [nombre]`,
          nextCwd: cwd,
        };
      }

      const content =
        normalizedFiles[fileName];

      if (
        typeof content !== 'string'
      ) {
        return {
          output:
            `${command}: fichier introuvable: ${fileName}`,
          nextCwd: cwd,
        };
      }

      const lines =
        content.split('\n');

      const selected =
        command === 'head'
          ? lines.slice(0, amount)
          : lines.slice(-amount);

      return {
        output:
          selected.join('\n') ||
          '(vide)',
        nextCwd: cwd,
      };
    }

    if (
      command === 'wc'
    ) {
      const fileName = normalizePath(
        args[0] || ''
      );

      if (!fileName) {
        return {
          output:
            'Usage: wc <fichier>',
          nextCwd: cwd,
        };
      }

      const content =
        normalizedFiles[fileName];

      if (
        typeof content !== 'string'
      ) {
        return {
          output:
            `wc: fichier introuvable: ${fileName}`,
          nextCwd: cwd,
        };
      }

      const lines =
        content.length
          ? content.split('\n').length
          : 0;

      const words =
        content.trim()
          ? content.trim().split(/\s+/).length
          : 0;

      const characters =
        content.length;

      return {
        output:
          `${lines} lignes, ${words} mots, ${characters} caractères`,
        nextCwd: cwd,
      };
    }

    if (
      command === 'find' ||
      command === 'grep'
    ) {
      const query = stripQuotes(
        args.join(' ')
      );

      if (!query) {
        return {
          output:
            `Usage: ${command} <texte>`,
          nextCwd: cwd,
        };
      }

      const results = [];

      Object.entries(
        normalizedFiles
      ).forEach(
        ([fileName, content]) => {
          if (
            String(content)
              .toLowerCase()
              .includes(
                query.toLowerCase()
              )
          ) {
            const lineIndex =
              String(content)
                .toLowerCase()
                .split('\n')
                .findIndex((line) =>
                  line.includes(
                    query.toLowerCase()
                  )
                );

            results.push(
              `${fileName}:${lineIndex + 1}`
            );
          }
        }
      );

      return {
        output:
          results.length
            ? results.join('\n')
            : 'Aucun résultat.',
        nextCwd: cwd,
      };
    }

    if (
      command === 'mkdir'
    ) {
      const folderName =
        normalizePath(
          args.join(' ')
        );

      if (!folderName) {
        return {
          output:
            'Usage: mkdir <dossier>',
          nextCwd: cwd,
        };
      }

      return {
        output:
          `Dossier virtuel prêt: ${folderName}`,
        nextCwd: cwd,
      };
    }

    if (
      command === 'cd'
    ) {
      const destination =
        normalizePath(
          args.join(' ')
        );

      if (
        !destination ||
        destination === '.'
      ) {
        return {
          output: '',
          nextCwd: cwd,
        };
      }

      if (
        destination === '..'
      ) {
        const parts =
          normalizePath(cwd)
            .split('/')
            .filter(Boolean);

        parts.pop();

        return {
          output: '',
          nextCwd: parts.join('/'),
        };
      }

      const newPath =
        normalizePath(
          cwd
            ? `${cwd}/${destination}`
            : destination
        );

      const exists =
        Object.keys(
          normalizedFiles
        ).some((fileName) =>
          normalizePath(fileName)
            .startsWith(
              `${newPath}/`
            )
        );

      if (!exists) {
        return {
          output:
            `cd: dossier introuvable: ${destination}`,
          nextCwd: cwd,
        };
      }

      return {
        output: '',
        nextCwd: newPath,
      };
    }

    return {
      output:
        `${command}: commande inconnue. Tape "help" pour voir les commandes.`,
      nextCwd: cwd,
    };
  }

  return {
    execute,
  };
}
