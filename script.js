/* =========================================================
   GCODE V4
   ORIGINAL UI + REAL INTERACTIONS
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       CONFIG
    ===================================================== */

    const STORAGE_KEY = "gcode-workspace-v4";
    const TABS_KEY = "gcode-tabs-v4";
    const HISTORY_KEY = "gcode-terminal-history-v4";

    const DEFAULT_FILES = {
        "index.html": `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GCODE</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <h1>Hello GCODE</h1>

    <script src="script.js"></script>
</body>
</html>`,

        "style.css": `* {
    box-sizing: border-box;
}

body {
    margin: 0;
    font-family: Arial, sans-serif;
}`,

        "script.js": `const app = {
    name: "GCODE",
    version: "4.0.0"
};

function startApp() {
    console.log("GCODE started");
}

startApp();`,

        "package.json": `{
    "name": "gcode-project",
    "version": "1.0.0",
    "description": "GCODE project",
    "main": "script.js",
    "scripts": {
        "start": "node script.js",
        "dev": "node script.js",
        "build": "echo Building project...",
        "test": "echo Running tests..."
    },
    "dependencies": {},
    "devDependencies": {}
}`,

        "README.md": `# GCODE

VS Code style editor.

## Commands

npm install
npm run dev
npm run build
npm test
`,

        ".env": `APP_NAME=GCODE
NODE_ENV=development`,

        ".gitignore": `node_modules/
dist/
.env`
    };


    /* =====================================================
       STATE
    ===================================================== */

    let files = loadFiles();

    let openTabs = loadTabs();

    let activeFile =
        openTabs.includes("style.css")
            ? "style.css"
            : openTabs[0] || "index.html";

    let terminalHistory = loadHistory();

    let historyIndex = terminalHistory.length;

    let currentDirectory = "/";

    let commandHistoryIndex = -1;

    let undoStack = [];

    let redoStack = [];

    let lastSavedContent = "";

    let menuOpen = false;


    /* =====================================================
       DOM HELPERS
    ===================================================== */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];


    /* =====================================================
       DOM REFERENCES
    ===================================================== */

    const sidebar =
        $("#sidebar");

    const editorTabs =
        $("#editorTabs");

    const codeEditor =
        $("#codeEditor");

    const codeDisplay =
        $("#codeDisplay");

    const lineNumbers =
        $("#lineNumbers");

    const breadcrumbFile =
        $("#breadcrumbFile");

    const bottomPanel =
        $("#bottomPanel");

    const terminal =
        $("#terminal");

    const terminalInput =
        $(".terminal-input", terminal);

    const terminalPath =
        $(".terminal-path", terminal);

    const cursorPosition =
        $("#cursorPosition");

    const languageLabel =
        $("#language");


    /* =====================================================
       STORAGE
    ===================================================== */

    function safeParse(value, fallback) {
        try {
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }


    function loadFiles() {
        const raw =
            localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return { ...DEFAULT_FILES };
        }

        const parsed =
            safeParse(raw, null);

        if (!parsed || typeof parsed !== "object") {
            return { ...DEFAULT_FILES };
        }

        return {
            ...DEFAULT_FILES,
            ...parsed
        };
    }


    function saveFiles() {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(files)
        );
    }


    function loadTabs() {
        const raw =
            localStorage.getItem(TABS_KEY);

        if (!raw) {
            return ["style.css", "index.html"];
        }

        const parsed =
            safeParse(raw, null);

        if (
            !Array.isArray(parsed) ||
            !parsed.length
        ) {
            return ["style.css", "index.html"];
        }

        return parsed.filter(
            file => files[file] !== undefined
        );
    }


    function saveTabs() {
        localStorage.setItem(
            TABS_KEY,
            JSON.stringify(openTabs)
        );
    }


    function loadHistory() {
        const raw =
            localStorage.getItem(HISTORY_KEY);

        if (!raw) return [];

        const parsed =
            safeParse(raw, []);

        return Array.isArray(parsed)
            ? parsed
            : [];
    }


    function saveHistory() {
        localStorage.setItem(
            HISTORY_KEY,
            JSON.stringify(
                terminalHistory.slice(-200)
            )
        );
    }


    /* =====================================================
       FILE HELPERS
    ===================================================== */

    function getExtension(name) {
        const index =
            name.lastIndexOf(".");

        if (index === -1) {
            return "";
        }

        return name
            .slice(index + 1)
            .toLowerCase();
    }


    function detectLanguage(name) {
        const lower =
            name.toLowerCase();

        if (lower === "package.json") {
            return "json";
        }

        if (lower === ".env") {
            return "dotenv";
        }

        if (lower === ".gitignore") {
            return "plaintext";
        }

        if (lower.endsWith(".html")) {
            return "html";
        }

        if (lower.endsWith(".css")) {
            return "css";
        }

        if (
            lower.endsWith(".js") ||
            lower.endsWith(".mjs") ||
            lower.endsWith(".cjs")
        ) {
            return "javascript";
        }

        if (
            lower.endsWith(".ts") ||
            lower.endsWith(".tsx")
        ) {
            return "typescript";
        }

        if (
            lower.endsWith(".json")
        ) {
            return "json";
        }

        if (
            lower.endsWith(".md")
        ) {
            return "markdown";
        }

        return "plaintext";
    }


    function languageName(name) {
        const language =
            detectLanguage(name);

        const names = {
            javascript: "JavaScript",
            typescript: "TypeScript",
            html: "HTML",
            css: "CSS",
            json: "JSON",
            markdown: "Markdown",
            plaintext: "Plain Text",
            dotenv: "Dotenv"
        };

        return names[language] ||
            language;
    }


    function escapeHTML(text) {
        return String(text ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;");
    }


    function highlightJavaScript(text) {
        let result =
            escapeHTML(text);

        result =
            result.replace(
                /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g,
                '<span class="comment">$1</span>'
            );

        result =
            result.replace(
                /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/g,
                '<span class="value">$1</span>'
            );

        result =
            result.replace(
                /\b(import|export|from|default|const|let|var|function|return|if|else|for|while|class|extends|new|this|async|await|try|catch|throw|finally|switch|case|break|continue|typeof|instanceof|in|of)\b/g,
                '<span class="property">$1</span>'
            );

        result =
            result.replace(
                /\b(true|false|null|undefined)\b/g,
                '<span class="value">$1</span>'
            );

        result =
            result.replace(
                /\b(\d+(?:\.\d+)?)\b/g,
                '<span class="value">$1</span>'
            );

        return result;
    }


    function highlightJSON(text) {
        let result =
            escapeHTML(text);

        result =
            result.replace(
                /("(?:\\.|[^"\\])*")(\s*:)/g,
                '<span class="property">$1</span>$2'
            );

        result =
            result.replace(
                /("(?:\\.|[^"\\])*")/g,
                '<span class="value">$1</span>'
            );

        result =
            result.replace(
                /\b(true|false|null)\b/g,
                '<span class="property">$1</span>'
            );

        result =
            result.replace(
                /\b(-?\d+(?:\.\d+)?)\b/g,
                '<span class="value">$1</span>'
            );

        return result;
    }


    function highlightCSS(text) {
        let result =
            escapeHTML(text);

        result =
            result.replace(
                /(\/\*[\s\S]*?\*\/)/g,
                '<span class="comment">$1</span>'
            );

        result =
            result.replace(
                /([a-zA-Z-]+)(\s*:)/g,
                '<span class="property">$1</span>$2'
            );

        result =
            result.replace(
                /([.#]?[a-zA-Z_-][\w-]*)(\s*\{)/g,
                '<span class="selector">$1</span>$2'
            );

        result =
            result.replace(
                /("[^"]*"|'[^']*')/g,
                '<span class="value">$1</span>'
            );

        return result;
    }


    function highlightHTML(text) {
        let result =
            escapeHTML(text);

        result =
            result.replace(
                /(&lt;!--[\s\S]*?--&gt;)/g,
                '<span class="comment">$1</span>'
            );

        result =
            result.replace(
                /(&lt;\/?)([a-zA-Z][\w-]*)/g,
                '$1<span class="selector">$2</span>'
            );

        result =
            result.replace(
                /\s([a-zA-Z_:][\w:.-]*)(=)/g,
                ' <span class="property">$1</span>$2'
            );

        result =
            result.replace(
                /(&quot;[^&]*?&quot;)/g,
                '<span class="value">$1</span>'
            );

        return result;
    }


    function highlightMarkdown(text) {
        let result =
            escapeHTML(text);

        result =
            result.replace(
                /^(#{1,6}\s.*)$/gm,
                '<span class="selector">$1</span>'
            );

        result =
            result.replace(
                /(`[^`]+`)/g,
                '<span class="value">$1</span>'
            );

        result =
            result.replace(
                /(\*\*[^*]+\*\*)/g,
                '<span class="property">$1</span>'
            );

        return result;
    }


    function highlight(text, language) {

        switch (language) {

            case "javascript":
            case "typescript":
                return highlightJavaScript(text);

            case "json":
                return highlightJSON(text);

            case "css":
                return highlightCSS(text);

            case "html":
                return highlightHTML(text);

            case "markdown":
                return highlightMarkdown(text);

            default:
                return escapeHTML(text);
        }
    }


    /* =====================================================
       EDITOR RENDER
    ===================================================== */

    function renderLineNumbers(text) {

        if (!lineNumbers) return;

        const count =
            Math.max(
                1,
                String(text ?? "")
                    .split("\n")
                    .length
            );

        lineNumbers.innerHTML =
            Array.from(
                { length: count },
                (_, index) =>
                    `<span>${index + 1}</span>`
            ).join("");
    }


    function renderEditor() {

        if (!codeDisplay) return;

        const content =
            files[activeFile] ?? "";

        const language =
            detectLanguage(activeFile);

        breadcrumbFile.textContent =
            activeFile;

        if (languageLabel) {
            languageLabel.textContent =
                languageName(activeFile);
        }

        codeDisplay.innerHTML =
            highlight(
                content,
                language
            );

        renderLineNumbers(content);

        lastSavedContent =
            content;

        renderTabs();

        updateExplorerSelection();

        updateCursorPosition();
    }


    /* =====================================================
       EDITOR CONTENT
    ===================================================== */

    function getEditorText() {

        if (!codeDisplay) {
            return "";
        }

        return codeDisplay.textContent
            .replace(/\u00a0/g, " ");
    }


    function saveEditorContent() {

        if (!codeDisplay) return;

        const content =
            getEditorText();

        files[activeFile] =
            content;

        saveFiles();

        lastSavedContent =
            content;

        updateLineNumbers(content);

        updateCursorPosition();
    }


    function pushUndoState() {

        if (!activeFile) return;

        const current =
            files[activeFile] ?? "";

        if (
            undoStack.length === 0 ||
            undoStack[undoStack.length - 1] !== current
        ) {
            undoStack.push(current);
        }

        if (undoStack.length > 100) {
            undoStack.shift();
        }

        redoStack = [];
    }


    function undo() {

        if (!activeFile) return;

        if (!undoStack.length) {
            terminalWrite(
                "Aucune modification à annuler."
            );

            return;
        }

        const current =
            files[activeFile];

        redoStack.push(current);

        const previous =
            undoStack.pop();

        files[activeFile] =
            previous;

        saveFiles();

        renderEditor();
    }


    function redo() {

        if (!activeFile) return;

        if (!redoStack.length) {
            terminalWrite(
                "Aucune modification à rétablir."
            );

            return;
        }

        const current =
            files[activeFile];

        undoStack.push(current);

        const next =
            redoStack.pop();

        files[activeFile] =
            next;

        saveFiles();

        renderEditor();
    }


    /* =====================================================
       CURSOR
    ===================================================== */

    function updateCursorPosition() {

        if (
            !cursorPosition ||
            !codeDisplay
        ) {
            return;
        }

        const selection =
            window.getSelection();

        if (
            !selection ||
            !selection.rangeCount
        ) {
            cursorPosition.textContent =
                "Ln 1, Col 1";

            return;
        }

        const range =
            selection.getRangeAt(0);

        const preRange =
            range.cloneRange();

        preRange.selectNodeContents(
            codeDisplay
        );

        preRange.setEnd(
            range.endContainer,
            range.endOffset
        );

        const text =
            preRange.toString();

        const lines =
            text.split("\n");

        const line =
            lines.length;

        const column =
            lines[lines.length - 1].length + 1;

        cursorPosition.textContent =
            `Ln ${line}, Col ${column}`;
    }


    /* =====================================================
       TABS
    ===================================================== */

    function renderTabs() {

        if (!editorTabs) return;

        $$(".editor-tab", editorTabs)
            .forEach(tab => {

                const file =
                    tab.dataset.file;

                tab.classList.toggle(
                    "active",
                    file === activeFile
                );
            });
    }


    function openFile(name) {

        if (
            !Object.prototype.hasOwnProperty.call(
                files,
                name
            )
        ) {
            return;
        }

        if (!openTabs.includes(name)) {
            openTabs.push(name);
        }

        activeFile =
            name;

        saveTabs();

        renderEditor();
    }


    function closeTab(name) {

        const index =
            openTabs.indexOf(name);

        if (index === -1) return;

        openTabs.splice(index, 1);

        if (activeFile === name) {

            activeFile =
                openTabs[index] ||
                openTabs[index - 1] ||
                "index.html";

            if (!openTabs.length) {
                openTabs.push(activeFile);
            }
        }

        saveTabs();

        renderEditor();
    }


    /* =====================================================
       EXPLORER
    ===================================================== */

    function updateExplorerSelection() {

        $$(".tree-item.file")
            .forEach(item => {

                item.classList.toggle(
                    "active",
                    item.dataset.file === activeFile
                );
            });
    }


    function renderExplorer() {
        updateExplorerSelection();
    }


    function toggleFolder(folder) {

        const arrow =
            $(".arrow", folder);

        if (!arrow) return;

        const opened =
            folder.classList.toggle(
                "opened"
            );

        arrow.textContent =
            opened ? "⌄" : "›";
    }


    /* =====================================================
       TERMINAL
    ===================================================== */

    function ensureTerminal() {

        if (!terminal) return;

        if (!terminalInput) return;

        terminalInput.setAttribute(
            "contenteditable",
            "true"
        );

        terminalInput.setAttribute(
            "spellcheck",
            "false"
        );

        terminalInput.setAttribute(
            "autocorrect",
            "off"
        );

        terminalInput.setAttribute(
            "autocomplete",
            "off"
        );
    }


    function terminalWrite(text = "") {

        if (!terminal) return;

        let output =
            $(".gcode-terminal-output", terminal);

        if (!output) {

            output =
                document.createElement("div");

            output.className =
                "gcode-terminal-output";

            terminal.insertBefore(
                output,
                terminal.firstChild
            );
        }

        const line =
            document.createElement("div");

        line.textContent =
            String(text);

        output.appendChild(line);

        terminal.scrollTop =
            terminal.scrollHeight;
    }


    function terminalClear() {

        if (!terminal) return;

        $$(".gcode-terminal-output", terminal)
            .forEach(element =>
                element.remove()
            );
    }


    function setTerminalPath() {

        if (!terminalPath) return;

        const shown =
            currentDirectory === "/"
                ? "D:\\GCODE"
                : `D:\\GCODE${currentDirectory.replaceAll("/", "\\")}`;

        terminalPath.textContent =
            shown + ">";
    }


    function tokenizeCommand(command) {

        const result = [];

        const regex =
            /"([^"]*)"|'([^']*)'|`([^`]*)`|(\S+)/g;

        let match;

        while ((match = regex.exec(command))) {

            result.push(
                match[1] ??
                match[2] ??
                match[3] ??
                match[4]
            );
        }

        return result;
    }


    function terminalPrompt() {

        if (!terminalInput) return;

        terminalInput.focus();

        try {

            const range =
                document.createRange();

            range.selectNodeContents(
                terminalInput
            );

            range.collapse(false);

            const selection =
                window.getSelection();

            selection.removeAllRanges();

            selection.addRange(range);

        } catch {
            // Ignore cursor errors.
        }
    }


    async function executeCommand(rawCommand) {

        const command =
            String(rawCommand ?? "")
                .trim();

        if (!command) return;

        terminalHistory.push(command);

        historyIndex =
            terminalHistory.length;

        saveHistory();

        terminalWrite(
            `PS ${terminalPath?.textContent || "D:\\GCODE>"} ${command}`
        );

        const args =
            tokenizeCommand(command);

        const cmd =
            (args.shift() || "")
                .toLowerCase();


        switch (cmd) {

            case "help":
            case "?":
                commandHelp();
                break;

            case "clear":
            case "cls":
                terminalClear();
                break;

            case "pwd":
                terminalWrite(
                    currentDirectory
                );
                break;

            case "ls":
            case "dir":
                commandLs();
                break;

            case "cd":
                commandCd(args);
                break;

            case "mkdir":
                commandMkdir(args);
                break;

            case "touch":
                commandTouch(args);
                break;

            case "cat":
            case "type":
                commandCat(args);
                break;

            case "head":
                commandHead(args);
                break;

            case "tail":
                commandTail(args);
                break;

            case "rm":
            case "del":
                commandRemove(args);
                break;

            case "mv":
            case "ren":
                commandMove(args);
                break;

            case "cp":
            case "copy":
                commandCopy(args);
                break;

            case "open":
            case "code":
                commandOpen(args);
                break;

            case "save":
                saveEditorContent();

                terminalWrite(
                    `Saved ${activeFile}`
                );

                break;

            case "export":
                commandExport(args);
                break;

            case "import":
                commandImport();
                break;

            case "run":
                commandRun(args);
                break;

            case "history":
                commandHistory();
                break;

            case "env":
                commandEnv();
                break;

            case "set":
                commandSet(args);
                break;

            case "echo":
                terminalWrite(
                    args.join(" ")
                );
                break;

            case "whoami":
                terminalWrite(
                    "gcode-user"
                );
                break;

            case "which":
                terminalWrite(
                    args[0]
                        ? `${args[0]}: GCODE command`
                        : "Usage: which <command>"
                );
                break;

            case "version":
            case "--version":
                terminalWrite(
                    "GCODE V4.0.0"
                );
                break;

            case "npm":
                await commandNpm(args);
                break;

            case "npx":
                await commandNpx(args);
                break;

            case "node":
                await commandNode(args);
                break;

            case "git":
                commandGit(args);
                break;

            default:

                terminalWrite(
                    `'${cmd}' n'est pas reconnu comme commande GCODE.`
                );

                terminalWrite(
                    "Tapez 'help' pour voir les commandes."
                );
        }

        setTerminalPath();

        terminalPrompt();
    }


    /* =====================================================
       TERMINAL COMMANDS
    ===================================================== */

    function commandHelp() {

        const lines = [

            "GCODE Terminal V4",
            "",
            "Fichiers :",
            "  ls / dir          Liste les fichiers",
            "  pwd               Affiche le dossier",
            "  cd <dossier>      Change de dossier",
            "  mkdir <nom>       Crée un dossier",
            "  touch <nom>       Crée un fichier",
            "  cat <fichier>     Affiche un fichier",
            "  head <fichier>    Affiche le début",
            "  tail <fichier>    Affiche la fin",
            "  rm <fichier>      Supprime un fichier",
            "  mv <a> <b>        Renomme/déplace",
            "  cp <a> <b>        Copie un fichier",
            "  open <fichier>    Ouvre dans l'éditeur",
            "  code <fichier>    Ouvre dans l'éditeur",
            "  save              Sauvegarde",
            "  export <fichier>  Exporte un fichier",
            "  import             Importe un fichier",
            "",
            "Node / npm :",
            "  node <code>",
            "  npm install",
            "  npm install <pkg>",
            "  npm uninstall <pkg>",
            "  npm update",
            "  npm list",
            "  npm run <script>",
            "  npm start",
            "  npm test",
            "  npx <commande>",
            "",
            "Git :",
            "  git status",
            "  git add <fichier>",
            "  git commit -m \"message\"",
            "  git log",
            "  git branch",
            "",
            "Autres :",
            "  clear / cls",
            "  history",
            "  env",
            "  set NAME=value",
            "  echo <texte>",
            "  whoami",
            "  version",
            "  help"

        ];

        lines.forEach(
            terminalWrite
        );
    }


    function commandLs() {

        const names =
            Object.keys(files);

        if (!names.length) {

            terminalWrite(
                "Dossier vide."
            );

            return;
        }

        names.forEach(
            name =>
                terminalWrite(name)
        );
    }


    function commandCd(args) {

        const target =
            args.join(" ").trim();

        if (!target) {

            terminalWrite(
                currentDirectory
            );

            return;
        }

        if (
            target === ".." ||
            target === "../"
        ) {

            if (
                currentDirectory !== "/"
            ) {

                const parts =
                    currentDirectory
                        .split("/")
                        .filter(Boolean);

                parts.pop();

                currentDirectory =
                    "/" + parts.join("/");

                if (
                    currentDirectory !== "/"
                ) {
                    currentDirectory += "/";
                }
            }

            setTerminalPath();

            return;
        }

        if (
            target === "/" ||
            target.toLowerCase() === "gcode"
        ) {

            currentDirectory =
                "/";

            setTerminalPath();

            return;
        }

        currentDirectory =
            "/" +
            target
                .replaceAll("\\", "/")
                .replace(/^\/+/, "")
                .replace(/\/+$/, "") +
            "/";

        terminalWrite(
            `Dossier courant : ${currentDirectory}`
        );

        setTerminalPath();
    }


    function commandMkdir(args) {

        const name =
            args.join(" ").trim();

        if (!name) {

            terminalWrite(
                "Usage: mkdir <nom>"
            );

            return;
        }

        terminalWrite(
            `Dossier '${name}' créé.`
        );

        terminalWrite(
            "Note : le dossier est actuellement virtuel."
        );
    }


    function commandTouch(args) {

        const name =
            args.join(" ").trim();

        if (!name) {

            terminalWrite(
                "Usage: touch <fichier>"
            );

            return;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                files,
                name
            )
        ) {

            terminalWrite(
                `Le fichier '${name}' existe déjà.`
            );

            return;
        }

        files[name] = "";

        saveFiles();

        terminalWrite(
            `Fichier '${name}' créé.`
        );

        renderExplorer();
    }


    function commandCat(args) {

        const name =
            args.join(" ").trim();

        if (!name) {

            terminalWrite(
                "Usage: cat <fichier>"
            );

            return;
        }

        if (
            !Object.prototype.hasOwnProperty.call(
                files,
                name
            )
        ) {

            terminalWrite(
                `Fichier introuvable : ${name}`
            );

            return;
        }

        terminalWrite(
            files[name] || "(fichier vide)"
        );
    }


    function commandHead(args) {

        const name =
            args.join(" ").trim();

        if (!name) {

            terminalWrite(
                "Usage: head <fichier>"
            );

            return;
        }

        if (!files[name]) {

            terminalWrite(
                `Fichier introuvable : ${name}`
            );

            return;
        }

        terminalWrite(
            files[name]
                .split("\n")
                .slice(0, 10)
                .join("\n")
        );
    }


    function commandTail(args) {

        const name =
            args.join(" ").trim();

        if (!name) {

            terminalWrite(
                "Usage: tail <fichier>"
            );

            return;
        }

        if (!files[name]) {

            terminalWrite(
                `Fichier introuvable : ${name}`
            );

            return;
        }

        terminalWrite(
            files[name]
                .split("\n")
                .slice(-10)
                .join("\n")
        );
    }


    function commandRemove(args) {

        const name =
            args.join(" ").trim();

        if (!name) {

            terminalWrite(
                "Usage: rm <fichier>"
            );

            return;
        }

        if (!files[name]) {

            terminalWrite(
                `Fichier introuvable : ${name}`
            );

            return;
        }

        delete files[name];

        if (openTabs.includes(name)) {
            closeTab(name);
        }

        saveFiles();

        terminalWrite(
            `Supprimé : ${name}`
        );

        renderExplorer();
    }


    function commandMove(args) {

        if (args.length < 2) {

            terminalWrite(
                "Usage: mv <source> <destination>"
            );

            return;
        }

        const source =
            args[0];

        const destination =
            args[1];

        if (!files[source]) {

            terminalWrite(
                `Fichier introuvable : ${source}`
            );

            return;
        }

        files[destination] =
            files[source];

        delete files[source];

        if (activeFile === source) {
            activeFile =
                destination;
        }

        openTabs =
            openTabs.map(
                file =>
                    file === source
                        ? destination
                        : file
            );

        saveFiles();
        saveTabs();

        renderEditor();

        terminalWrite(
            `${source} → ${destination}`
        );
    }


    function commandCopy(args) {

        if (args.length < 2) {

            terminalWrite(
                "Usage: cp <source> <destination>"
            );

            return;
        }

        const source =
            args[0];

        const destination =
            args[1];

        if (!files[source]) {

            terminalWrite(
                `Fichier introuvable : ${source}`
            );

            return;
        }

        files[destination] =
            files[source];

        saveFiles();

        terminalWrite(
            `Copié : ${source} → ${destination}`
        );
    }


    function commandOpen(args) {

        const name =
            args.join(" ").trim();

        if (!name) {

            terminalWrite(
                "Usage: open <fichier>"
            );

            return;
        }

        if (!files[name]) {

            terminalWrite(
                `Fichier introuvable : ${name}`
            );

            return;
        }

        openFile(name);

        terminalWrite(
            `Ouverture de ${name}`
        );
    }


    async function commandExport(args) {

        const name =
            args.join(" ").trim() ||
            activeFile;

        if (!files[name]) {

            terminalWrite(
                `Fichier introuvable : ${name}`
            );

            return;
        }

        if (
            window.GCODEFileSystem &&
            typeof window.GCODEFileSystem.exportFile ===
                "function"
        ) {

            try {

                await window.GCODEFileSystem
                    .exportFile(
                        name,
                        files[name]
                    );

                terminalWrite(
                    `Export terminé : ${name}`
                );

                return;

            } catch (error) {

                terminalWrite(
                    `Export impossible : ${error.message}`
                );

                return;
            }
        }

        const blob =
            new Blob(
                [files[name]],
                {
                    type: "text/plain;charset=utf-8"
                }
            );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href =
            url;

        link.download =
            name;

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);

        terminalWrite(
            `Export terminé : ${name}`
        );
    }


    function commandImport() {

        const input =
            document.createElement("input");

        input.type =
            "file";

        input.multiple =
            true;

        input.onchange =
            async () => {

                const selected =
                    [...input.files];

                for (
                    const file
                    of selected
                ) {

                    const content =
                        await file.text();

                    files[file.name] =
                        content;

                    if (
                        !openTabs.includes(
                            file.name
                        )
                    ) {
                        openTabs.push(
                            file.name
                        );
                    }
                }

                saveFiles();
                saveTabs();

                renderExplorer();
                renderTabs();

                terminalWrite(
                    `${selected.length} fichier(s) importé(s).`
                );
            };

        input.click();
    }


    function commandRun(args) {

        if (
            args[0] === "html" ||
            activeFile.endsWith(".html")
        ) {

            runHTMLPreview();

            return;
        }

        terminalWrite(
            `Exécution de ${activeFile} demandée.`
        );

        if (
            window.GCODERuntime &&
            typeof window.GCODERuntime.run ===
                "function"
        ) {

            window.GCODERuntime.run(
                "node",
                [activeFile]
            ).then(result => {

                if (result?.output) {
                    terminalWrite(
                        result.output
                    );
                }

            });

            return;
        }

        terminalWrite(
            "Runtime Node.js réel non connecté."
        );
    }


    /* =====================================================
       NPM
    ===================================================== */

    async function commandNpm(args) {

        const sub =
            (args.shift() || "")
                .toLowerCase();

        if (!sub) {

            terminalWrite(
                "npm <install|uninstall|update|list|run|start|test>"
            );

            return;
        }


        if (
            window.GCODERuntime &&
            typeof window.GCODERuntime.npm ===
                "function" &&
            window.GCODERuntime.canRun &&
            window.GCODERuntime.canRun()
        ) {

            const result =
                await window.GCODERuntime.npm(
                    [sub, ...args]
                );

            terminalWrite(
                result.output ||
                result.stderr ||
                ""
            );

            return;
        }


        switch (sub) {

            case "install":
                npmInstall(args);
                break;

            case "uninstall":
                npmUninstall(args);
                break;

            case "update":
                terminalWrite(
                    "npm update"
                );

                terminalWrite(
                    "Runtime Node.js réel requis pour télécharger les paquets."
                );

                break;

            case "list":
                npmList();
                break;

            case "run":
                npmRun(args);
                break;

            case "start":
                npmRun(["start"]);
                break;

            case "test":
                npmRun(["test"]);
                break;

            case "init":
                npmInit();
                break;

            default:
                terminalWrite(
                    `npm : commande '${sub}' non disponible.`
                );
        }
    }


    function getPackageJSON() {

        try {

            return JSON.parse(
                files["package.json"]
            );

        } catch {

            return null;
        }
    }


    function savePackageJSON(packageData) {

        files["package.json"] =
            JSON.stringify(
                packageData,
                null,
                4
            );

        saveFiles();

        if (
            activeFile === "package.json"
        ) {
            renderEditor();
        }
    }


    function npmInit() {

        const packageData = {
            name: "gcode-project",
            version: "1.0.0",
            description: "",
            main: "script.js",
            scripts: {
                start: "node script.js",
                test: "echo Running tests..."
            },
            dependencies: {},
            devDependencies: {}
        };

        savePackageJSON(
            packageData
        );

        terminalWrite(
            "package.json créé."
        );
    }


    function npmInstall(args) {

        const packageData =
            getPackageJSON();

        if (!packageData) {

            terminalWrite(
                "package.json invalide."
            );

            return;
        }

        if (!args.length) {

            terminalWrite(
                "npm install"
            );

            terminalWrite(
                "Analyse du package.json..."
            );

            terminalWrite(
                "Installation réelle des paquets nécessite un runtime Node/npm."
            );

            return;
        }

        const packages =
            args.filter(
                arg =>
                    !arg.startsWith("-")
            );

        packageData.dependencies =
            packageData.dependencies ||
            {};

        packages.forEach(
            packageName => {

                packageData.dependencies[
                    packageName
                ] = "latest";
            }
        );

        savePackageJSON(
            packageData
        );

        terminalWrite(
            `Ajouté(s) dans package.json : ${packages.join(", ")}`
        );

        terminalWrite(
            "Téléchargement réel : runtime Node/npm requis."
        );
    }


    function npmUninstall(args) {

        const packageData =
            getPackageJSON();

        if (!packageData) {
            terminalWrite(
                "package.json invalide."
            );
            return;
        }

        const packages =
            args.filter(
                arg =>
                    !arg.startsWith("-")
            );

        packageData.dependencies =
            packageData.dependencies ||
            {};

        packageData.devDependencies =
            packageData.devDependencies ||
            {};

        packages.forEach(
            packageName => {

                delete packageData.dependencies[
                    packageName
                ];

                delete packageData.devDependencies[
                    packageName
                ];
            }
        );

        savePackageJSON(
            packageData
        );

        terminalWrite(
            `Supprimé(s) : ${packages.join(", ")}`
        );
    }


    function npmList() {

        const packageData =
            getPackageJSON();

        if (!packageData) {

            terminalWrite(
                "package.json invalide."
            );

            return;
        }

        terminalWrite(
            `${packageData.name || "gcode-project"}@${packageData.version || "1.0.0"}`
        );

        Object.entries(
            packageData.dependencies || {}
        ).forEach(
            ([name, version]) =>
                terminalWrite(
                    `├── ${name}@${version}`
                )
        );
    }


    function npmRun(args) {

        const scriptName =
            args[0];

        if (!scriptName) {

            terminalWrite(
                "Scripts disponibles :"
            );

            const packageData =
                getPackageJSON();

            Object.keys(
                packageData?.scripts || {}
            ).forEach(
                script =>
                    terminalWrite(
                        `  ${script}`
                    )
            );

            return;
        }

        const packageData =
            getPackageJSON();

        const script =
            packageData?.scripts?.[
                scriptName
            ];

        if (!script) {

            terminalWrite(
                `npm ERR! Missing script: "${scriptName}"`
            );

            return;
        }

        terminalWrite(
            `> ${packageData.name || "gcode-project"}@${packageData.version || "1.0.0"} ${scriptName}`
        );

        terminalWrite(
            `> ${script}`
        );

        terminalWrite(
            "Exécution simulée dans le navigateur."
        );

        if (
            window.GCODERuntime &&
            typeof window.GCODERuntime.run ===
                "function"
        ) {

            const parts =
                tokenizeCommand(script);

            if (parts.length) {

                window.GCODERuntime
                    .run(
                        parts[0],
                        parts.slice(1)
                    )
                    .then(result => {

                        if (result?.output) {
                            terminalWrite(
                                result.output
                            );
                        }

                    });
            }
        }
    }


    /* =====================================================
       NODE / NPX
    ===================================================== */

    async function commandNode(args) {

        if (!args.length) {

            terminalWrite(
                "Node.js runtime requis."
            );

            return;
        }

        if (
            window.GCODERuntime &&
            typeof window.GCODERuntime.node ===
                "function"
        ) {

            const result =
                await window.GCODERuntime.node(
                    args.join(" ")
                );

            terminalWrite(
                result.output ||
                result.stderr ||
                ""
            );

            return;
        }

        terminalWrite(
            "Node.js réel n'est pas disponible dans le navigateur."
        );
    }


    async function commandNpx(args) {

        if (!args.length) {

            terminalWrite(
                "Usage: npx <commande>"
            );

            return;
        }

        if (
            window.GCODERuntime &&
            typeof window.GCODERuntime.npx ===
                "function"
        ) {

            const result =
                await window.GCODERuntime.npx(
                    args
                );

            terminalWrite(
                result.output ||
                result.stderr ||
                ""
            );

            return;
        }

        terminalWrite(
            "npx nécessite un runtime Node.js réel."
        );
    }


    /* =====================================================
       ENV
    ===================================================== */

    function commandEnv() {

        const env =
            files[".env"] || "";

        if (!env.trim()) {

            terminalWrite(
                "Aucune variable .env."
            );

            return;
        }

        env.split("\n")
            .forEach(
                line =>
                    terminalWrite(line)
            );
    }


    function commandSet(args) {

        const expression =
            args.join(" ");

        if (!expression.includes("=")) {

            terminalWrite(
                "Usage: set NAME=value"
            );

            return;
        }

        const index =
            expression.indexOf("=");

        const name =
            expression
                .slice(0, index)
                .trim();

        const value =
            expression
                .slice(index + 1)
                .trim();

        let env =
            files[".env"] || "";

        const lines =
            env.split("\n")
                .filter(
                    line =>
                        !line.startsWith(
                            `${name}=`
                        )
                );

        lines.push(
            `${name}=${value}`
        );

        files[".env"] =
            lines.join("\n");

        saveFiles();

        terminalWrite(
            `${name}=${value}`
        );
    }


    /* =====================================================
       HISTORY
    ===================================================== */

    function commandHistory() {

        terminalHistory.forEach(
            (command, index) =>
                terminalWrite(
                    `${index + 1}  ${command}`
                )
        );
    }


    /* =====================================================
       GIT
    ===================================================== */

    function commandGit(args) {

        const sub =
            (args.shift() || "")
                .toLowerCase();

        switch (sub) {

            case "status":

                terminalWrite(
                    "On branch main"
                );

                terminalWrite(
                    "Changes are managed locally by GCODE."
                );

                break;


            case "add":

                terminalWrite(
                    `git add ${args.join(" ")}`
                );

                terminalWrite(
                    "Fichiers ajoutés à l'index GCODE."
                );

                break;


            case "commit": {

                const messageIndex =
                    args.indexOf("-m");

                const message =
                    messageIndex !== -1
                        ? args
                            .slice(messageIndex + 1)
                            .join(" ")
                            .replace(/^["']|["']$/g, "")
                        : "GCODE commit";

                terminalWrite(
                    `[main] ${message}`
                );

                terminalWrite(
                    "Commit local créé."
                );

                break;
            }


            case "log":

                terminalWrite(
                    "commit gcode-local-main"
                );

                terminalWrite(
                    "Author: GCODE"
                );

                terminalWrite(
                    "Message: Initial local workspace"
                );

                break;


            case "branch":

                terminalWrite(
                    "* main"
                );

                break;


            case "init":

                terminalWrite(
                    "Initialized empty GCODE repository."
                );

                break;


            default:

                terminalWrite(
                    "git status"
                );

                terminalWrite(
                    "git add <fichier>"
                );

                terminalWrite(
                    "git commit -m \"message\""
                );

                terminalWrite(
                    "git log"
                );

                terminalWrite(
                    "git branch"
                );
        }
    }


    /* =====================================================
       HTML PREVIEW
    ===================================================== */

    function runHTMLPreview() {

        let html =
            files[activeFile];

        if (!html) {

            terminalWrite(
                "Aucun contenu HTML."
            );

            return;
        }

        const existing =
            document.querySelector(
                ".gcode-preview"
            );

        if (existing) {
            existing.remove();
        }

        const preview =
            document.createElement("div");

        preview.className =
            "gcode-preview";

        preview.style.position =
            "fixed";

        preview.style.inset =
            "20px";

        preview.style.zIndex =
            "99999";

        preview.style.background =
            "#ffffff";

        preview.style.border =
            "1px solid #444";

        preview.style.display =
            "flex";

        preview.style.flexDirection =
            "column";


        const header =
            document.createElement("div");

        header.style.height =
            "40px";

        header.style.background =
            "#181818";

        header.style.color =
            "#ffffff";

        header.style.display =
            "flex";

        header.style.alignItems =
            "center";

        header.style.justifyContent =
            "space-between";

        header.style.padding =
            "0 12px";

        header.textContent =
            "GCODE Preview";


        const close =
            document.createElement("button");

        close.textContent =
            "×";

        close.style.background =
            "transparent";

        close.style.border =
            "0";

        close.style.color =
            "#fff";

        close.style.fontSize =
            "22px";

        close.style.cursor =
            "pointer";

        close.onclick =
            () => preview.remove();

        header.appendChild(close);


        const iframe =
            document.createElement("iframe");

        iframe.style.flex =
            "1";

        iframe.style.border =
            "0";

        iframe.sandbox =
            "allow-scripts allow-forms allow-modals";

        iframe.srcdoc =
            html;

        preview.appendChild(header);

        preview.appendChild(iframe);

        document.body.appendChild(
            preview
        );

        terminalWrite(
            "Preview HTML lancé."
        );
    }


    /* =====================================================
       SEARCH
    ===================================================== */

    function openSearch() {

        const query =
            window.prompt(
                "Rechercher dans GCODE :"
            );

        if (query === null) return;

        if (!query) return;

        let found = 0;

        Object.entries(files)
            .forEach(
                ([name, content]) => {

                    const index =
                        content
                            .toLowerCase()
                            .indexOf(
                                query.toLowerCase()
                            );

                    if (index !== -1) {

                        found++;

                        terminalWrite(
                            `${name}: trouvé`
                        );
                    }
                }
            );

        if (!found) {

            terminalWrite(
                `"${query}" introuvable.`
            );

            return;
        }

        terminalWrite(
            `${found} fichier(s) trouvé(s).`
        );
    }


    /* =====================================================
       COMMAND PALETTE
    ===================================================== */

    function openCommandPalette() {

        const command =
            window.prompt(
                "GCODE Command Palette\n\nTape une commande :"
            );

        if (
            command === null ||
            !command.trim()
        ) {
            return;
        }

        executeCommand(command);
    }


    /* =====================================================
       MENUS
    ===================================================== */

    function closeMenus() {

        $$(".gcode-menu")
            .forEach(
                menu =>
                    menu.remove()
            );

        menuOpen =
            false;
    }


    function createMenu(button, items) {

        closeMenus();

        const menu =
            document.createElement("div");

        menu.className =
            "gcode-menu";

        menu.style.position =
            "fixed";

        menu.style.zIndex =
            "100000";

        menu.style.background =
            "#252526";

        menu.style.border =
            "1px solid #454545";

        menu.style.boxShadow =
            "0 8px 24px rgba(0,0,0,.35)";

        menu.style.minWidth =
            "190px";

        menu.style.padding =
            "4px 0";


        const rect =
            button.getBoundingClientRect();

        menu.style.left =
            `${rect.left}px`;

        menu.style.top =
            `${rect.bottom}px`;


        items.forEach(item => {

            const element =
                document.createElement("button");

            element.textContent =
                item.label;

            element.style.display =
                "block";

            element.style.width =
                "100%";

            element.style.border =
                "0";

            element.style.background =
                "transparent";

            element.style.color =
                "#cccccc";

            element.style.textAlign =
                "left";

            element.style.padding =
                "8px 14px";

            element.style.cursor =
                "pointer";

            element.addEventListener(
                "mouseenter",
                () => {
                    element.style.background =
                        "#094771";
                }
            );

            element.addEventListener(
                "mouseleave",
                () => {
                    element.style.background =
                        "transparent";
                }
            );

            element.onclick =
                () => {

                    closeMenus();

                    item.action();
                };

            menu.appendChild(
                element
            );
        });


        document.body.appendChild(
            menu
        );

        menuOpen =
            true;
    }


    /* =====================================================
       TOP MENUS
    ===================================================== */

    function setupTopMenus() {

        const buttons =
            $$(".menu-button");

        buttons.forEach(button => {

            const name =
                button.textContent
                    .trim()
                    .toLowerCase();

            if (name === "file") {

                button.onclick =
                    () =>
                        createMenu(
                            button,
                            [
                                {
                                    label: "New File",
                                    action: () =>
                                        commandTouch(
                                            ["untitled.txt"]
                                        )
                                },
                                {
                                    label: "Open File",
                                    action: () =>
                                        commandImport()
                                },
                                {
                                    label: "Save",
                                    action: () =>
                                        saveEditorContent()
                                },
                                {
                                    label: "Export",
                                    action: () =>
                                        commandExport([])
                                }
                            ]
                        );

            } else if (name === "edit") {

                button.onclick =
                    () =>
                        createMenu(
                            button,
                            [
                                {
                                    label: "Undo",
                                    action: undo
                                },
                                {
                                    label: "Redo",
                                    action: redo
                                },
                                {
                                    label: "Cut",
                                    action: () =>
                                        document.execCommand("cut")
                                },
                                {
                                    label: "Copy",
                                    action: () =>
                                        document.execCommand("copy")
                                },
                                {
                                    label: "Paste",
                                    action: async () => {

                                        try {

                                            const text =
                                                await navigator.clipboard.readText();

                                            document.execCommand(
                                                "insertText",
                                                false,
                                                text
                                            );

                                        } catch {
                                            terminalWrite(
                                                "Accès au presse-papiers refusé."
                                            );
                                        }
                                    }
                                }
                            ]
                        );

            } else if (name === "selection") {

                button.onclick =
                    () =>
                        createMenu(
                            button,
                            [
                                {
                                    label: "Select All",
                                    action: () =>
                                        document.execCommand(
                                            "selectAll"
                                        )
                                },
                                {
                                    label: "Expand Selection",
                                    action: () => {}
                                }
                            ]
                        );

            } else if (name === "view") {

                button.onclick =
                    () =>
                        createMenu(
                            button,
                            [
                                {
                                    label: "Explorer",
                                    action: () =>
                                        showActivityPanel(
                                            "explorer"
                                        )
                                },
                                {
                                    label: "Terminal",
                                    action: () =>
                                        toggleBottomPanel(
                                            true
                                        )
                                },
                                {
                                    label: "Search",
                                    action: openSearch
                                }
                            ]
                        );

            } else if (name === "go") {

                button.onclick =
                    () =>
                        createMenu(
                            button,
                            [
                                {
                                    label: "Back",
                                    action: goBack
                                },
                                {
                                    label: "Forward",
                                    action: goForward
                                }
                            ]
                        );

            } else if (
                name === "•••" ||
                name === "..."
            ) {

                button.onclick =
                    () =>
                        createMenu(
                            button,
                            [
                                {
                                    label: "Command Palette",
                                    action:
                                        openCommandPalette
                                },
                                {
                                    label: "Search",
                                    action:
                                        openSearch
                                },
                                {
                                    label: "Run HTML",
                                    action:
                                        runHTMLPreview
                                }
                            ]
                        );
            }
        });
    }


    /* =====================================================
       NAVIGATION
    ===================================================== */

    function goBack() {

        try {
            window.history.back();
        } catch {
            terminalWrite(
                "Back"
            );
        }
    }


    function goForward() {

        try {
            window.history.forward();
        } catch {
            terminalWrite(
                "Forward"
            );
        }
    }


    /* =====================================================
       ACTIVITY BAR
    ===================================================== */

    function showActivityPanel(panelName) {

        $$(".activity-item")
            .forEach(item => {

                item.classList.toggle(
                    "active",
                    item.dataset.panel ===
                        panelName
                );
            });


        if (panelName === "explorer") {

            if (sidebar) {
                sidebar.style.display =
                    "";
            }

            return;
        }


        if (panelName === "search") {

            openSearch();

            return;
        }


        if (panelName === "source") {

            terminalWrite(
                "Source Control"
            );

            terminalWrite(
                "Branche actuelle : main"
            );

            return;
        }


        if (panelName === "run") {

            runHTMLPreview();

            return;
        }


        if (panelName === "extensions") {

            terminalWrite(
                "Extensions"
            );

            terminalWrite(
                "Le gestionnaire d'extensions GCODE sera ajouté prochainement."
            );

            return;
        }
    }


    function setupActivityBar() {

        $$(".activity-item")
            .forEach(item => {

                item.addEventListener(
                    "click",
                    () => {

                        const panel =
                            item.dataset.panel;

                        if (panel) {
                            showActivityPanel(
                                panel
                            );
                        } else {

                            const label =
                                $(".activity-label", item)
                                    ?.textContent
                                    ?.trim();

                            if (
                                label ===
                                "Settings"
                            ) {

                                terminalWrite(
                                    "Settings"
                                );

                                terminalWrite(
                                    "Les paramètres GCODE seront ajoutés prochainement."
                                );

                            } else if (
                                label ===
                                "Account"
                            ) {

                                terminalWrite(
                                    "Account"
                                );
                            }
                        }
                    }
                );
            });
    }


    /* =====================================================
       SEARCH BUTTON
    ===================================================== */

    function setupSearch() {

        const search =
            $(".command-search");

        if (!search) return;

        search.addEventListener(
            "click",
            openCommandPalette
        );
    }


    /* =====================================================
       TOP ACTIONS
    ===================================================== */

    function toggleBottomPanel(force) {

        if (!bottomPanel) return;

        if (force === true) {

            bottomPanel.style.display =
                "";

            return;
        }

        if (
            bottomPanel.style.display ===
            "none"
        ) {

            bottomPanel.style.display =
                "";

        } else {

            bottomPanel.style.display =
                "none";
        }
    }


    function setupTopActions() {

        $$(".top-actions button")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const title =
                            button.title;

                        if (
                            title ===
                            "Split editor"
                        ) {

                            terminalWrite(
                                "Split Editor activé."
                            );

                        } else if (
                            title ===
                            "Layout"
                        ) {

                            terminalWrite(
                                "Layout GCODE."
                            );

                        } else if (
                            title ===
                            "Panels"
                        ) {

                            toggleBottomPanel();
                        }
                    }
                );
            });
    }


    /* =====================================================
       WINDOW CONTROLS
    ===================================================== */

    function setupWindowControls() {

        const controls =
            $$(".window-controls button");

        if (controls[0]) {

            controls[0].onclick =
                () => {

                    document.body.style.opacity =
                        "0";

                    setTimeout(
                        () => {
                            document.body.style.opacity =
                                "";
                        },
                        250
                    );
                };
        }


        if (controls[1]) {

            controls[1].onclick =
                async () => {

                    try {

                        if (
                            !document.fullscreenElement
                        ) {

                            await document.documentElement
                                .requestFullscreen();

                        } else {

                            await document.exitFullscreen();
                        }

                    } catch {

                        terminalWrite(
                            "Mode plein écran non disponible."
                        );
                    }
                };
        }


        const close =
            $("#closeWindow");

        if (close) {

            close.onclick =
                () => {

                    const confirmed =
                        window.confirm(
                            "Fermer GCODE ?"
                        );

                    if (!confirmed) {
                        return;
                    }

                    window.close();

                    terminalWrite(
                        "Le navigateur peut empêcher la fermeture de l'onglet."
                    );
                };
        }
    }


    /* =====================================================
       EXPLORER EVENTS
    ===================================================== */

    function setupExplorer() {

        $$(".tree-item.file")
            .forEach(item => {

                item.addEventListener(
                    "dblclick",
                    () => {

                        const file =
                            item.dataset.file;

                        if (file) {
                            openFile(file);
                        }
                    }
                );

                item.addEventListener(
                    "click",
                    () => {

                        const file =
                            item.dataset.file;

                        if (file) {

                            $$(".tree-item.file")
                                .forEach(
                                    element =>
                                        element.classList.remove(
                                            "active"
                                        )
                                );

                            item.classList.add(
                                "active"
                            );
                        }
                    }
                );
            });


        $$(".tree-item.folder")
            .forEach(folder => {

                folder.addEventListener(
                    "click",
                    () =>
                        toggleFolder(folder)
                );
            });


        const workspaceTitle =
            $(".workspace-title");

        if (workspaceTitle) {

            workspaceTitle.addEventListener(
                "click",
                () => {

                    const tree =
                        $(".file-tree");

                    if (!tree) return;

                    const hidden =
                        tree.style.display ===
                        "none";

                    tree.style.display =
                        hidden
                            ? ""
                            : "none";
                }
            );
        }
    }


    /* =====================================================
       TABS EVENTS
    ===================================================== */

    function setupTabs() {

        if (!editorTabs) return;

        editorTabs.addEventListener(
            "click",
            event => {

                const close =
                    event.target.closest(
                        ".tab-close"
                    );

                if (close) {

                    const tab =
                        close.closest(
                            ".editor-tab"
                        );

                    if (!tab) return;

                    closeTab(
                        tab.dataset.file
                    );

                    return;
                }


                const tab =
                    event.target.closest(
                        ".editor-tab"
                    );

                if (!tab) return;

                openFile(
                    tab.dataset.file
                );
            }
        );
    }


    /* =====================================================
       EDITOR EVENTS
    ===================================================== */

    function setupEditor() {

        if (!codeDisplay) return;

        codeDisplay.setAttribute(
            "contenteditable",
            "true"
        );

        codeDisplay.setAttribute(
            "spellcheck",
            "false"
        );

        codeDisplay.addEventListener(
            "focus",
            () => {

                pushUndoState();
            }
        );


        codeDisplay.addEventListener(
            "input",
            () => {

                saveEditorContent();

                renderLineNumbers(
                    getEditorText()
                );

                updateCursorPosition();
            }
        );


        codeDisplay.addEventListener(
            "keyup",
            updateCursorPosition
        );


        codeDisplay.addEventListener(
            "mouseup",
            updateCursorPosition
        );


        codeDisplay.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Tab"
                ) {

                    event.preventDefault();

                    document.execCommand(
                        "insertText",
                        false,
                        "    "
                    );

                    return;
                }


                if (
                    event.ctrlKey &&
                    event.key.toLowerCase() ===
                        "s"
                ) {

                    event.preventDefault();

                    saveEditorContent();

                    terminalWrite(
                        `Saved ${activeFile}`
                    );

                    return;
                }


                if (
                    event.ctrlKey &&
                    event.key.toLowerCase() ===
                        "z"
                ) {

                    event.preventDefault();

                    undo();

                    return;
                }


                if (
                    event.ctrlKey &&
                    event.key.toLowerCase() ===
                        "y"
                ) {

                    event.preventDefault();

                    redo();
                }
            }
        );
    }


    /* =====================================================
       TERMINAL EVENTS
    ===================================================== */

    function setupTerminal() {

        ensureTerminal();

        if (!terminalInput) return;

        terminalInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    const command =
                        terminalInput.textContent
                            .trim();

                    terminalInput.textContent =
                        "";

                    executeCommand(
                        command
                    );

                    return;
                }


                if (
                    event.key ===
                    "ArrowUp"
                ) {

                    event.preventDefault();

                    if (
                        !terminalHistory.length
                    ) {
                        return;
                    }

                    historyIndex =
                        Math.max(
                            0,
                            historyIndex - 1
                        );

                    terminalInput.textContent =
                        terminalHistory[
                            historyIndex
                        ] || "";

                    terminalPrompt();

                    return;
                }


                if (
                    event.key ===
                    "ArrowDown"
                ) {

                    event.preventDefault();

                    if (
                        !terminalHistory.length
                    ) {
                        return;
                    }

                    historyIndex =
                        Math.min(
                            terminalHistory.length,
                            historyIndex + 1
                        );

                    terminalInput.textContent =
                        terminalHistory[
                            historyIndex
                        ] || "";

                    terminalPrompt();

                    return;
                }


                if (
                    event.key ===
                    "Tab"
                ) {

                    event.preventDefault();

                    autocompleteTerminal();

                    return;
                }


                if (
                    event.ctrlKey &&
                    event.key.toLowerCase() ===
                        "l"
                ) {

                    event.preventDefault();

                    terminalClear();
                }
            }
        );


        terminal.addEventListener(
            "click",
            () =>
                terminalPrompt()
        );
    }


    function autocompleteTerminal() {

        if (!terminalInput) return;

        const current =
            terminalInput.textContent
                .trim();

        const commands = [
            "help",
            "clear",
            "cls",
            "pwd",
            "ls",
            "dir",
            "cd",
            "mkdir",
            "touch",
            "cat",
            "type",
            "head",
            "tail",
            "rm",
            "del",
            "mv",
            "ren",
            "cp",
            "copy",
            "open",
            "code",
            "save",
            "export",
            "import",
            "run",
            "history",
            "env",
            "set",
            "echo",
            "whoami",
            "which",
            "version",
            "npm",
            "npx",
            "node",
            "git"
        ];

        const match =
            commands.find(
                command =>
                    command.startsWith(
                        current
                    ) &&
                    command !== current
            );

        if (match) {

            terminalInput.textContent =
                match;

            terminalPrompt();
        }
    }


    /* =====================================================
       PANEL TABS
    ===================================================== */

    function setupPanelTabs() {

        $$(".panel-tab")
            .forEach(tab => {

                tab.addEventListener(
                    "click",
                    () => {

                        $$(".panel-tab")
                            .forEach(
                                element =>
                                    element.classList.remove(
                                        "active"
                                    )
                            );

                        tab.classList.add(
                            "active"
                        );

                        const name =
                            tab.textContent
                                .trim()
                                .toLowerCase();

                        if (
                            name.includes(
                                "terminal"
                            )
                        ) {

                            showTerminalPanel();

                        } else {

                            terminalWrite(
                                `${tab.textContent.trim()} sélectionné.`
                            );
                        }
                    }
                );
            });


        $$(".panel-actions button")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const text =
                            button.textContent
                                .trim();

                        if (text === "＋") {

                            createNewTerminal();

                        } else if (
                            text === "□"
                        ) {

                            toggleBottomPanel(
                                true
                            );

                            bottomPanel?.classList.toggle(
                                "maximized"
                            );

                        } else if (
                            text === "×"
                        ) {

                            toggleBottomPanel(
                                false
                            );
                        }
                    }
                );
            });
    }


    function showTerminalPanel() {

        if (!bottomPanel) return;

        bottomPanel.style.display =
            "";
    }


    function createNewTerminal() {

        terminalWrite(
            "Nouveau terminal GCODE ouvert."
        );

        terminalPrompt();
    }


    /* =====================================================
       SIDEBAR MORE
    ===================================================== */

    function setupSidebarMore() {

        const button =
            $(".sidebar-more");

        if (!button) return;

        button.onclick =
            () =>
                createMenu(
                    button,
                    [
                        {
                            label: "New File",
                            action: () =>
                                commandTouch(
                                    ["untitled.txt"]
                                )
                        },
                        {
                            label: "Import",
                            action: commandImport
                        },
                        {
                            label: "Refresh",
                            action: () =>
                                renderEditor()
                        }
                    ]
                );
    }


    /* =====================================================
       TOP NAV BUTTONS
    ===================================================== */

    function setupNavigation() {

        const back =
            $("#backBtn");

        const forward =
            $("#forwardBtn");

        if (back) {
            back.onclick =
                goBack;
        }

        if (forward) {
            forward.onclick =
                goForward;
        }
    }


    /* =====================================================
       KEYBOARD SHORTCUTS
    ===================================================== */

    function setupGlobalKeyboard() {

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.ctrlKey &&
                    event.shiftKey &&
                    event.key.toLowerCase() ===
                        "p"
                ) {

                    event.preventDefault();

                    openCommandPalette();

                    return;
                }


                if (
                    event.ctrlKey &&
                    event.key.toLowerCase() ===
                        "f"
                ) {

                    event.preventDefault();

                    openSearch();

                    return;
                }


                if (
                    event.ctrlKey &&
                    event.key.toLowerCase() ===
                        "j"
                ) {

                    event.preventDefault();

                    toggleBottomPanel();

                    return;
                }


                if (
                    event.key ===
                    "Escape"
                ) {

                    closeMenus();
                }
            }
        );


        document.addEventListener(
            "click",
            event => {

                if (
                    menuOpen &&
                    !event.target.closest(
                        ".gcode-menu"
                    ) &&
                    !event.target.closest(
                        ".menu-button"
                    )
                ) {

                    closeMenus();
                }
            }
        );
    }


    /* =====================================================
       FILESYSTEM API
    ===================================================== */

    async function connectFilesystem() {

        if (
            !window.GCODEFileSystem
        ) {
            return;
        }

        try {

            window.GCODEFileSystem.on(
                "fileChanged",
                event => {

                    if (
                        event?.path
                    ) {

                        const name =
                            event.path
                                .split("/")
                                .pop();

                        if (name) {
                            renderExplorer();
                        }
                    }
                }
            );

        } catch {
            // Filesystem optional.
        }
    }


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    function initialize() {

        setupTopMenus();

        setupActivityBar();

        setupSearch();

        setupTopActions();

        setupWindowControls();

        setupExplorer();

        setupTabs();

        setupEditor();

        setupTerminal();

        setupPanelTabs();

        setupSidebarMore();

        setupNavigation();

        setupGlobalKeyboard();

        connectFilesystem();

        setTerminalPath();

        renderEditor();

        terminalWrite(
            "GCODE Terminal V4 prêt."
        );

        terminalWrite(
            "Tapez 'help' pour afficher les commandes."
        );
    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.GCODE = {

        files,

        openFile,

        save: saveEditorContent,

        run: runHTMLPreview,

        terminal: executeCommand,

        getActiveFile:
            () => activeFile,

        getFiles:
            () => ({ ...files }),

        createFile:
            name => {
                if (
                    !name ||
                    files[name] !== undefined
                ) {
                    return false;
                }

                files[name] = "";

                saveFiles();

                renderExplorer();

                return true;
            },

        deleteFile:
            name => {

                if (
                    files[name] === undefined
                ) {
                    return false;
                }

                delete files[name];

                saveFiles();

                renderExplorer();

                return true;
            }
    };


    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once: true
            }
        );

    } else {

        initialize();
    }

})();
