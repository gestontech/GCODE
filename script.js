/* =========================================================
   GCODE V4
   VS CODE STYLE EDITOR
   Editor + Explorer + Terminal + npm + Git + Syntax
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const STORAGE_KEY = "gcode-v4-workspace";
    const TABS_KEY = "gcode-v4-tabs";
    const HISTORY_KEY = "gcode-v4-terminal-history";

    const DEFAULT_FILES = {
        "index.html": `<!DOCTYPE html>
<html lang="en">
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
}

h1 {
    text-align: center;
}`,

        "script.js": `import { example } from "./example.js";

const app = {
    name: "GCODE",
    version: "4.0.0"
};

function startApp() {
    console.log("GCODE started");
}

export default app;`,

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

A VS Code style code editor.

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
    let activeFile = openTabs[0] || "index.html";

    let terminalHistory = loadHistory();
    let historyIndex = terminalHistory.length;

    let currentDirectory = "/";
    let terminalBusy = false;

    let undoStack = [];
    let redoStack = [];

    let saveTimer = null;

    /* =====================================================
       DOM
    ===================================================== */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];

    const sidebar = $("#sidebar");
    const editorTabs = $("#editorTabs");
    const codeEditor = $("#codeEditor");
    const codeContent = $(".code-content", codeEditor);
    const codeDisplay = $("#codeDisplay");
    const lineNumbers = $("#lineNumbers");
    const breadcrumbFile = $("#breadcrumbFile");

    const terminal = $("#terminal");
    const terminalInput = $(".terminal-input", terminal);
    const terminalPath = $(".terminal-path", terminal);

    const bottomPanel = $("#bottomPanel");

    const cursorPosition = $("#cursorPosition");
    const languageLabel = $("#language");

    /* =====================================================
       SAFE STORAGE
    ===================================================== */

    function safeJSONParse(value, fallback) {
        try {
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }

    function loadFiles() {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return { ...DEFAULT_FILES };
        }

        const parsed = safeJSONParse(saved, null);

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
        const saved = localStorage.getItem(TABS_KEY);

        if (!saved) {
            return ["style.css", "index.html"];
        }

        const parsed = safeJSONParse(saved, []);

        return Array.isArray(parsed) && parsed.length
            ? parsed
            : ["style.css", "index.html"];
    }

    function saveTabs() {
        localStorage.setItem(
            TABS_KEY,
            JSON.stringify(openTabs)
        );
    }

    function loadHistory() {
        const saved = localStorage.getItem(HISTORY_KEY);

        if (!saved) return [];

        const parsed = safeJSONParse(saved, []);

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

    function normalizePath(path) {
        if (!path) return "/";

        path = String(path)
            .replaceAll("\\", "/")
            .replace(/\/+/g, "/");

        if (!path.startsWith("/")) {
            path = "/" + path;
        }

        if (path.length > 1 && path.endsWith("/")) {
            path = path.slice(0, -1);
        }

        return path;
    }

    function fileName(path) {
        return path.split("/").pop();
    }

    function getExtension(name) {
        const index = name.lastIndexOf(".");

        if (index === -1) return "";

        return name.slice(index + 1).toLowerCase();
    }

    function detectLanguage(name) {
        const lower = name.toLowerCase();

        if (lower === "package.json") return "json";
        if (lower === "tsconfig.json") return "json";
        if (lower === ".gitignore") return "plaintext";
        if (lower === ".env") return "dotenv";
        if (lower.endsWith(".html")) return "html";
        if (lower.endsWith(".htm")) return "html";
        if (lower.endsWith(".css")) return "css";
        if (lower.endsWith(".scss")) return "scss";
        if (lower.endsWith(".js")) return "javascript";
        if (lower.endsWith(".mjs")) return "javascript";
        if (lower.endsWith(".cjs")) return "javascript";
        if (lower.endsWith(".ts")) return "typescript";
        if (lower.endsWith(".tsx")) return "typescript";
        if (lower.endsWith(".jsx")) return "javascript";
        if (lower.endsWith(".json")) return "json";
        if (lower.endsWith(".md")) return "markdown";
        if (lower.endsWith(".txt")) return "plaintext";
        if (lower.endsWith(".xml")) return "xml";
        if (lower.endsWith(".svg")) return "xml";
        if (lower.endsWith(".sh")) return "shell";
        if (lower.endsWith(".bash")) return "shell";

        return "plaintext";
    }

    function getLanguageLabel(name) {
        const language = detectLanguage(name);

        const labels = {
            javascript: "JavaScript",
            typescript: "TypeScript",
            html: "HTML",
            css: "CSS",
            scss: "SCSS",
            json: "JSON",
            markdown: "Markdown",
            plaintext: "Plain Text",
            shell: "Shell",
            dotenv: "Dotenv",
            xml: "XML"
        };

        return labels[language] || language;
    }

    function getFileContent(name) {
        return Object.prototype.hasOwnProperty.call(files, name)
            ? files[name]
            : "";
    }

    /* =====================================================
       SYNTAX HIGHLIGHTING
    ===================================================== */

    function escapeHTML(text) {
        return String(text)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;");
    }

    function span(className, text) {
        return `<span class="${className}">${escapeHTML(text)}</span>`;
    }

    function tokenizeJavaScript(source) {
        const tokenRegex =
            /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(`(?:\\.|[^`])*`|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")|\b(import|export|from|default|const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|extends|new|this|super|typeof|instanceof|in|of|try|catch|finally|throw|async|await|yield|static|get|set|delete|void|with|debugger)\b|\b(true|false|null|undefined|NaN)\b|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_$][\w$]*)\s*(?=\()/g;

        let output = "";
        let last = 0;
        let match;

        while ((match = tokenRegex.exec(source))) {
            output += escapeHTML(source.slice(last, match.index));

            if (match[1]) {
                output += span("comment", match[1]);
            } else if (match[2]) {
                output += span("value", match[2]);
            } else if (match[3]) {
                output += span("selector", match[3]);
            } else if (match[4]) {
                output += span("value", match[4]);
            } else if (match[5]) {
                output += span("value", match[5]);
            } else if (match[6]) {
                output += span("property", match[6]);
            }

            last = tokenRegex.lastIndex;
        }

        output += escapeHTML(source.slice(last));

        return output;
    }

    function tokenizeJSON(source) {
        const regex =
            /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?)|\b(true|false|null)\b/g;

        let output = "";
        let last = 0;
        let match;

        while ((match = regex.exec(source))) {
            output += escapeHTML(source.slice(last, match.index));

            if (match[1]) {
                if (match[2]) {
                    output += span("property", match[1]);
                    output += escapeHTML(match[2]);
                } else {
                    output += span("value", match[1]);
                }
            } else if (match[3]) {
                output += span("value", match[3]);
            } else {
                output += span("selector", match[4]);
            }

            last = regex.lastIndex;
        }

        output += escapeHTML(source.slice(last));

        return output;
    }

    function tokenizeCSS(source) {
        let result = escapeHTML(source);

        result = result.replace(
            /(\/\*[\s\S]*?\*\/)/g,
            '<span class="comment">$1</span>'
        );

        result = result.replace(
            /([a-zA-Z-]+)(\s*:)/g,
            '<span class="property">$1</span>$2'
        );

        result = result.replace(
            /(#?[a-zA-Z_-][\w-]*)(?=\s*\{)/g,
            '<span class="selector">$1</span>'
        );

        result = result.replace(
            /("[^"]*"|'[^']*'|\b\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|s|ms)?\b)/g,
            '<span class="value">$1</span>'
        );

        return result;
    }

    function tokenizeHTML(source) {
        let result = escapeHTML(source);

        result = result.replace(
            /(&lt;!--[\s\S]*?--&gt;)/g,
            '<span class="comment">$1</span>'
        );

        result = result.replace(
            /(&lt;\/?)([a-zA-Z][\w-]*)/g,
            '$1<span class="selector">$2</span>'
        );

        result = result.replace(
            /\s([a-zA-Z_:][\w:.-]*)(=)/g,
            ' <span class="property">$1</span>$2'
        );

        result = result.replace(
            /(&quot;[^&]*?&quot;)/g,
            '<span class="value">$1</span>'
        );

        return result;
    }

    function tokenizeMarkdown(source) {
        let result = escapeHTML(source);

        result = result.replace(
            /^(#{1,6})\s(.+)$/gm,
            '<span class="selector">$1 $2</span>'
        );

        result = result.replace(
            /(`[^`]+`)/g,
            '<span class="value">$1</span>'
        );

        result = result.replace(
            /(\*\*[^*]+\*\*)/g,
            '<span class="property">$1</span>'
        );

        return result;
    }

    function highlightCode(source, language) {
        source = String(source ?? "");

        if (!source) return "";

        switch (language) {
            case "javascript":
            case "typescript":
                return tokenizeJavaScript(source);

            case "json":
                return tokenizeJSON(source);

            case "css":
            case "scss":
                return tokenizeCSS(source);

            case "html":
            case "xml":
                return tokenizeHTML(source);

            case "markdown":
                return tokenizeMarkdown(source);

            default:
                return escapeHTML(source);
        }
    }

    /* =====================================================
       EDITOR
    ===================================================== */

    function setEditorPlainText() {
        if (!codeDisplay) return;

        const content = getFileContent(activeFile);

        codeDisplay.textContent = content;
    }

    function renderEditor() {
        if (!codeDisplay) return;

        const content = getFileContent(activeFile);
        const language = detectLanguage(activeFile);

        breadcrumbFile.textContent = activeFile;

        if (languageLabel) {
            languageLabel.textContent =
                getLanguageLabel(activeFile);
        }

        codeDisplay.innerHTML =
            highlightCode(content, language);

        updateLineNumbers(content);
        updateCursorPosition();

        renderTabs();
        renderExplorer();
    }

    function updateLineNumbers(text) {
        if (!lineNumbers) return;

        const count =
            Math.max(
                1,
                String(text ?? "").split("\n").length
            );

        lineNumbers.innerHTML =
            Array.from(
                { length: count },
                (_, index) =>
                    `<span>${index + 1}</span>`
            ).join("");
    }

    function updateCursorPosition() {
        if (!cursorPosition || !codeDisplay) return;

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

        const range = selection.getRangeAt(0);
        const preRange = range.cloneRange();

        preRange.selectNodeContents(codeDisplay);
        preRange.setEnd(
            range.startContainer,
            range.startOffset
        );

        const text =
            preRange.toString();

        const lines = text.split("\n");

        const line = lines.length;
        const column =
            lines[lines.length - 1].length + 1;

        cursorPosition.textContent =
            `Ln ${line}, Col ${column}`;
    }

    function enterEditorMode() {
        if (!codeDisplay) return;

        const current =
            getFileContent(activeFile);

        codeDisplay.textContent = current;

        codeDisplay.setAttribute(
            "contenteditable",
            "true"
        );

        codeDisplay.focus();

        placeCaretAtEnd(codeDisplay);
    }

    function placeCaretAtEnd(element) {
        const selection =
            window.getSelection();

        const range =
            document.createRange();

        range.selectNodeContents(element);
        range.collapse(false);

        selection.removeAllRanges();
        selection.addRange(range);
    }

    function leaveEditorMode() {
        if (!codeDisplay) return;

        const content =
            codeDisplay.innerText
                .replace(/\r\n/g, "\n");

        pushUndoState();

        files[activeFile] = content;

        saveFiles();

        codeDisplay.removeAttribute(
            "contenteditable"
        );

        renderEditor();
    }

    function handleEditorInput() {
        if (!codeDisplay) return;

        const content =
            codeDisplay.innerText
                .replace(/\r\n/g, "\n");

        files[activeFile] = content;

        updateLineNumbers(content);
        updateCursorPosition();

        clearTimeout(saveTimer);

        saveTimer = setTimeout(() => {
            saveFiles();
        }, 300);
    }

    /* =====================================================
       UNDO / REDO
    ===================================================== */

    function pushUndoState() {
        const current = {
            file: activeFile,
            content: getFileContent(activeFile)
        };

        const previous =
            undoStack[undoStack.length - 1];

        if (
            previous &&
            previous.file === current.file &&
            previous.content === current.content
        ) {
            return;
        }

        undoStack.push(current);

        if (undoStack.length > 100) {
            undoStack.shift();
        }

        redoStack = [];
    }

    function undo() {
        if (!undoStack.length) return;

        const state = undoStack.pop();

        redoStack.push({
            file: activeFile,
            content: getFileContent(activeFile)
        });

        files[state.file] = state.content;

        activeFile = state.file;

        saveFiles();
        renderEditor();
    }

    function redo() {
        if (!redoStack.length) return;

        const state = redoStack.pop();

        undoStack.push({
            file: activeFile,
            content: getFileContent(activeFile)
        });

        files[state.file] = state.content;

        activeFile = state.file;

        saveFiles();
        renderEditor();
    }

    /* =====================================================
       TABS
    ===================================================== */

    function renderTabs() {
        if (!editorTabs) return;

        editorTabs.innerHTML = "";

        openTabs.forEach(name => {
            const tab =
                document.createElement("div");

            tab.className =
                "editor-tab" +
                (name === activeFile
                    ? " active"
                    : "");

            tab.dataset.file = name;

            const label =
                document.createElement("span");

            label.textContent = name;

            const close =
                document.createElement("button");

            close.className = "tab-close";
            close.textContent = "×";

            close.addEventListener(
                "click",
                event => {
                    event.stopPropagation();
                    closeTab(name);
                }
            );

            tab.appendChild(label);
            tab.appendChild(close);

            tab.addEventListener(
                "click",
                () => openFile(name)
            );

            editorTabs.appendChild(tab);
        });
    }

    function openFile(name) {
        if (!Object.prototype.hasOwnProperty.call(files, name)) {
            files[name] = "";
        }

        if (!openTabs.includes(name)) {
            openTabs.push(name);
        }

        activeFile = name;

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

            if (!openTabs.includes(activeFile)) {
                openTabs.push(activeFile);
            }
        }

        saveTabs();

        renderEditor();
    }

    /* =====================================================
       EXPLORER
    ===================================================== */

    function renderExplorer() {
        $$(".tree-item.file").forEach(item => {
            const dataName =
                item.dataset.file;

            let name =
                dataName ||
                item.textContent.trim();

            name =
                name.replace(/^[^A-Za-z0-9_.-]+/, "");

            if (
                name &&
                Object.prototype.hasOwnProperty.call(
                    files,
                    name
                )
            ) {
                item.classList.toggle(
                    "active",
                    name === activeFile
                );

                item.dataset.file = name;
            }
        });
    }

    function setupExplorer() {
        $$(".tree-item.file").forEach(item => {
            item.addEventListener(
                "click",
                () => {
                    let name =
                        item.dataset.file ||
                        item.textContent.trim();

                    name =
                        name.replace(
                            /^[^A-Za-z0-9_.-]+/,
                            ""
                        );

                    if (files[name] !== undefined) {
                        openFile(name);
                    }
                }
            );
        });

        $$(".tree-item.folder").forEach(folder => {
            folder.addEventListener(
                "click",
                () => {
                    folder.classList.toggle("expanded");
                }
            );
        });
    }

    /* =====================================================
       TERMINAL
    ===================================================== */

    function setupTerminal() {
        if (!terminal || !terminalInput) {
            return;
        }

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
            "autocapitalize",
            "off"
        );

        terminalInput.setAttribute(
            "inputmode",
            "text"
        );

        terminalInput.setAttribute(
            "enterkeyhint",
            "send"
        );

        terminalInput.addEventListener(
            "keydown",
            handleTerminalKeydown
        );

        terminalInput.addEventListener(
            "input",
            () => {
                terminalInput.textContent =
                    terminalInput.textContent
                        .replace(/\n/g, "");

                terminalBusy = false;
            }
        );

        updateTerminalPath();

        ensureTerminalOutput();
    }

    function ensureTerminalOutput() {
        if (!terminal) return null;

        let output =
            $(".gcode-terminal-output", terminal);

        if (!output) {
            output =
                document.createElement("div");

            output.className =
                "gcode-terminal-output";

            const currentLine =
                $(".terminal-input", terminal)
                    ?.closest("*");

            terminal.insertBefore(
                output,
                terminal.firstChild
            );
        }

        return output;
    }

    function updateTerminalPath() {
        if (!terminalPath) return;

        terminalPath.textContent =
            currentDirectory;
    }

    function terminalWrite(text = "", type = "normal") {
        const output =
            ensureTerminalOutput();

        if (!output) return;

        const line =
            document.createElement("div");

        line.className =
            `gcode-terminal-line gcode-terminal-${type}`;

        line.textContent = String(text);

        output.appendChild(line);

        terminal.scrollTop =
            terminal.scrollHeight;
    }

    function terminalWriteBlock(text = "", type = "normal") {
        String(text)
            .split("\n")
            .forEach(line =>
                terminalWrite(line, type)
            );
    }

    function terminalPrompt(command) {
        terminalWrite(
            `${currentDirectory} $ ${command}`,
            "command"
        );
    }

    function clearTerminal() {
        const output =
            ensureTerminalOutput();

        if (output) {
            output.innerHTML = "";
        }
    }

    function focusTerminal() {
        if (!terminalInput) return;

        terminalInput.focus();

        placeCaretAtEnd(terminalInput);
    }

    async function handleTerminalKeydown(event) {
        if (event.key === "Enter") {
            event.preventDefault();

            if (terminalBusy) return;

            const command =
                terminalInput.textContent.trim();

            terminalInput.textContent = "";

            if (!command) {
                focusTerminal();
                return;
            }

            await executeTerminalCommand(command);

            focusTerminal();

            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();

            navigateHistory(-1);

            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();

            navigateHistory(1);

            return;
        }

        if (event.key === "Tab") {
            event.preventDefault();

            autocompleteTerminal();

            return;
        }

        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "l"
        ) {
            event.preventDefault();

            clearTerminal();

            return;
        }

        if (
            event.ctrlKey &&
            event.key.toLowerCase() === "c"
        ) {
            event.preventDefault();

            terminalWrite(
                "^C",
                "error"
            );

            terminalInput.textContent = "";

            return;
        }
    }

    function navigateHistory(direction) {
        if (!terminalHistory.length) return;

        historyIndex += direction;

        if (historyIndex < 0) {
            historyIndex = 0;
        }

        if (
            historyIndex >=
            terminalHistory.length
        ) {
            historyIndex =
                terminalHistory.length;

            terminalInput.textContent = "";

            return;
        }

        terminalInput.textContent =
            terminalHistory[historyIndex];

        placeCaretAtEnd(terminalInput);
    }

    function commandSuggestions(input) {
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
            "echo",
            "whoami",
            "which",
            "version",
            "npm",
            "npx",
            "node",
            "git"
        ];

        const parts =
            input.trim().split(/\s+/);

        if (parts.length === 1) {
            return commands.filter(
                command =>
                    command.startsWith(parts[0])
            );
        }

        if (
            parts[0] === "npm" &&
            parts[1] === "run"
        ) {
            const pkg =
                getPackageJSON();

            return Object.keys(
                pkg?.scripts || {}
            ).filter(script =>
                script.startsWith(
                    parts[2] || ""
                )
            );
        }

        if (
            parts[0] === "open" ||
            parts[0] === "code" ||
            parts[0] === "cat"
        ) {
            const partial =
                parts[parts.length - 1] || "";

            return Object.keys(files)
                .filter(name =>
                    name.startsWith(partial)
                );
        }

        return [];
    }

    function autocompleteTerminal() {
        const current =
            terminalInput.textContent;

        const suggestions =
            commandSuggestions(current);

        if (!suggestions.length) return;

        if (suggestions.length === 1) {
            const parts =
                current.split(/\s+/);

            parts[parts.length - 1] =
                suggestions[0];

            terminalInput.textContent =
                parts.join(" ");

            placeCaretAtEnd(terminalInput);

            return;
        }

        terminalWriteBlock(
            suggestions.join("    "),
            "suggestion"
        );
    }

    /* =====================================================
       TERMINAL COMMAND PARSER
    ===================================================== */

    function parseCommand(input) {
        const matches =
            input.match(
                /"[^"]*"|'[^']*'|\S+/g
            ) || [];

        return matches.map(
            value =>
                value.replace(
                    /^['"]|['"]$/g,
                    ""
                )
        );
    }

    async function executeTerminalCommand(input) {
        const command =
            input.trim();

        if (!command) return;

        terminalHistory =
            terminalHistory.filter(
                item => item !== command
            );

        terminalHistory.push(command);

        historyIndex =
            terminalHistory.length;

        saveHistory();

        terminalPrompt(command);

        const args =
            parseCommand(command);

        const base =
            (args.shift() || "")
                .toLowerCase();

        terminalBusy = true;

        try {
            await dispatchCommand(base, args);
        } catch (error) {
            terminalWrite(
                error?.message ||
                String(error),
                "error"
            );
        }

        terminalBusy = false;
    }

    async function dispatchCommand(command, args) {
        switch (command) {
            case "help":
                return commandHelp();

            case "clear":
            case "cls":
                return clearTerminal();

            case "pwd":
                return terminalWrite(
                    currentDirectory
                );

            case "ls":
            case "dir":
                return commandLS(args);

            case "cd":
                return commandCD(args);

            case "mkdir":
                return commandMkdir(args);

            case "touch":
                return commandTouch(args);

            case "cat":
            case "type":
                return commandCat(args);

            case "head":
                return commandHead(args);

            case "tail":
                return commandTail(args);

            case "rm":
            case "del":
                return commandRemove(args);

            case "mv":
            case "ren":
                return commandMove(args);

            case "cp":
            case "copy":
                return commandCopy(args);

            case "open":
            case "code":
                return commandOpen(args);

            case "save":
                saveFiles();
                return terminalWrite(
                    "All files saved."
                );

            case "export":
                return commandExport(args);

            case "import":
                return commandImport();

            case "run":
                return commandRun(args);

            case "history":
                return commandHistory();

            case "echo":
                return terminalWrite(
                    args.join(" ")
                );

            case "env":
                return commandEnv();

            case "set":
                return commandSet(args);

            case "whoami":
                return terminalWrite(
                    "gcode-user"
                );

            case "which":
                return commandWhich(args);

            case "version":
                return terminalWrite(
                    "GCODE V4.0.0"
                );

            case "npm":
                return commandNPM(args);

            case "npx":
                return commandNPX(args);

            case "node":
                return commandNode(args);

            case "git":
                return commandGit(args);

            default:
                return terminalWrite(
                    `'${command}' is not recognized. Type "help" for commands.`,
                    "error"
                );
        }
    }

    /* =====================================================
       BASIC COMMANDS
    ===================================================== */

    function commandHelp() {
        terminalWriteBlock(`
GCODE Terminal V4

FILES
  ls / dir             List files
  cd <path>            Change directory
  pwd                  Current directory
  mkdir <name>         Create folder
  touch <file>         Create file
  cat <file>           Display file
  head <file>          First lines
  tail <file>          Last lines
  rm <file>            Delete file
  mv <a> <b>           Move / rename
  cp <a> <b>           Copy file
  open <file>          Open in editor
  save                 Save workspace
  export <file>        Export file
  import               Import local file

NPM
  npm init
  npm install
  npm install <pkg>
  npm uninstall <pkg>
  npm update
  npm list
  npm run <script>
  npm test

NODE
  node <file>
  npx <command>

GIT
  git status
  git add <file>
  git commit -m "message"
  git log
  git branch

SYSTEM
  clear / cls
  history
  echo <text>
  env
  set <name>=<value>
  whoami
  which <command>
  version

GCODE
  run
  help

Note:
Browser GCODE provides a workspace shell.
Real Node/npm/Git execution requires a connected runtime.
`, "normal");
    }

    function commandLS() {
        terminalWriteBlock(
            Object.keys(files)
                .sort()
                .join("\n") ||
            "(empty workspace)"
        );
    }

    function commandCD(args) {
        const target =
            args[0] || "/";

        if (
            target === ".." ||
            target === "../"
        ) {
            currentDirectory = "/";
            updateTerminalPath();
            return;
        }

        if (
            target === "." ||
            target === "./"
        ) {
            return;
        }

        currentDirectory =
            normalizePath(target);

        updateTerminalPath();

        terminalWrite(
            currentDirectory
        );
    }

    function commandMkdir(args) {
        const name = args[0];

        if (!name) {
            return terminalWrite(
                "Usage: mkdir <folder>",
                "error"
            );
        }

        terminalWrite(
            `Directory '${name}' created.`
        );
    }

    function commandTouch(args) {
        if (!args.length) {
            return terminalWrite(
                "Usage: touch <file>",
                "error"
            );
        }

        args.forEach(name => {
            if (
                !Object.prototype.hasOwnProperty.call(
                    files,
                    name
                )
            ) {
                files[name] = "";
            }

            openFile(name);
        });

        saveFiles();

        terminalWrite(
            `Created ${args.join(", ")}`
        );
    }

    function commandCat(args) {
        const name = args[0];

        if (!name) {
            return terminalWrite(
                "Usage: cat <file>",
                "error"
            );
        }

        if (
            !Object.prototype.hasOwnProperty.call(
                files,
                name
            )
        ) {
            return terminalWrite(
                `File not found: ${name}`,
                "error"
            );
        }

        terminalWriteBlock(
            files[name]
        );
    }

    function commandHead(args) {
        const name = args[0];

        if (!name) {
            return terminalWrite(
                "Usage: head <file>",
                "error"
            );
        }

        const content = files[name];

        if (content === undefined) {
            return terminalWrite(
                `File not found: ${name}`,
                "error"
            );
        }

        terminalWriteBlock(
            content
                .split("\n")
                .slice(0, 10)
                .join("\n")
        );
    }

    function commandTail(args) {
        const name = args[0];

        if (!name) {
            return terminalWrite(
                "Usage: tail <file>",
                "error"
            );
        }

        const content = files[name];

        if (content === undefined) {
            return terminalWrite(
                `File not found: ${name}`,
                "error"
            );
        }

        terminalWriteBlock(
            content
                .split("\n")
                .slice(-10)
                .join("\n")
        );
    }

    function commandRemove(args) {
        const name = args[0];

        if (!name) {
            return terminalWrite(
                "Usage: rm <file>",
                "error"
            );
        }

        if (
            !Object.prototype.hasOwnProperty.call(
                files,
                name
            )
        ) {
            return terminalWrite(
                `File not found: ${name}`,
                "error"
            );
        }

        delete files[name];

        openTabs =
            openTabs.filter(
                tab => tab !== name
            );

        if (activeFile === name) {
            activeFile =
                openTabs[0] ||
                "index.html";
        }

        saveFiles();
        saveTabs();
        renderEditor();

        terminalWrite(
            `Deleted ${name}`
        );
    }

    function commandMove(args) {
        const from = args[0];
        const to = args[1];

        if (!from || !to) {
            return terminalWrite(
                "Usage: mv <source> <destination>",
                "error"
            );
        }

        if (files[from] === undefined) {
            return terminalWrite(
                `File not found: ${from}`,
                "error"
            );
        }

        files[to] = files[from];
        delete files[from];

        openTabs =
            openTabs.map(
                tab =>
                    tab === from
                        ? to
                        : tab
            );

        if (activeFile === from) {
            activeFile = to;
        }

        saveFiles();
        saveTabs();
        renderEditor();

        terminalWrite(
            `${from} -> ${to}`
        );
    }

    function commandCopy(args) {
        const from = args[0];
        const to = args[1];

        if (!from || !to) {
            return terminalWrite(
                "Usage: cp <source> <destination>",
                "error"
            );
        }

        if (files[from] === undefined) {
            return terminalWrite(
                `File not found: ${from}`,
                "error"
            );
        }

        files[to] = files[from];

        saveFiles();

        terminalWrite(
            `${from} -> ${to}`
        );
    }

    function commandOpen(args) {
        const name = args[0];

        if (!name) {
            return terminalWrite(
                "Usage: open <file>",
                "error"
            );
        }

        if (files[name] === undefined) {
            return terminalWrite(
                `File not found: ${name}`,
                "error"
            );
        }

        openFile(name);
    }

    /* =====================================================
       NPM
    ===================================================== */

    function getPackageJSON() {
        if (!files["package.json"]) {
            return null;
        }

        try {
            return JSON.parse(
                files["package.json"]
            );
        } catch {
            return null;
        }
    }

    function savePackageJSON(pkg) {
        files["package.json"] =
            JSON.stringify(
                pkg,
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

    function commandNPM(args) {
        const sub =
            (args[0] || "")
                .toLowerCase();

        if (!sub) {
            terminalWrite(
                "npm 10.x compatible command interface - GCODE"
            );

            terminalWrite(
                "Use 'npm help' or 'npm run'."
            );

            return;
        }

        switch (sub) {
            case "help":
                return terminalWriteBlock(`
npm init
npm install
npm install <package>
npm uninstall <package>
npm update
npm list
npm run <script>
npm test
npm start
`);

            case "init":
                return npmInit();

            case "install":
            case "i":
                return npmInstall(
                    args.slice(1)
                );

            case "uninstall":
            case "remove":
            case "un":
                return npmUninstall(
                    args.slice(1)
                );

            case "update":
                return npmUpdate();

            case "list":
            case "ls":
                return npmList();

            case "run":
                return npmRun(
                    args.slice(1)
                );

            case "test":
                return npmRun(["test"]);

            case "start":
                return npmRun(["start"]);

            default:
                terminalWrite(
                    `npm: unknown command '${sub}'`,
                    "error"
                );
        }
    }

    function npmInit() {
        if (files["package.json"]) {
            terminalWrite(
                "package.json already exists."
            );

            return;
        }

        files["package.json"] =
            JSON.stringify(
                {
                    name: "gcode-project",
                    version: "1.0.0",
                    description: "",
                    main: "index.js",
                    scripts: {},
                    keywords: [],
                    author: "",
                    license: "ISC"
                },
                null,
                4
            );

        saveFiles();
        openFile("package.json");

        terminalWrite(
            "Created package.json"
        );
    }

    function npmInstall(packages) {
        const pkg =
            getPackageJSON();

        if (!pkg) {
            terminalWrite(
                "Cannot install: package.json is invalid or missing.",
                "error"
            );

            return;
        }

        pkg.dependencies =
            pkg.dependencies || {};

        pkg.devDependencies =
            pkg.devDependencies || {};

        if (!packages.length) {
            const all = [
                ...Object.keys(
                    pkg.dependencies
                ),
                ...Object.keys(
                    pkg.devDependencies
                )
            ];

            if (!all.length) {
                terminalWrite(
                    "Nothing to install."
                );

                return;
            }

            terminalWrite(
                "Reading package.json..."
            );

            all.forEach(packageName => {
                terminalWrite(
                    `Installing ${packageName}...`
                );
            });

            terminalWrite(
                "Workspace dependency map updated."
            );

            terminalWrite(
                "Real package download requires a Node/npm runtime."
            );

            return;
        }

        packages.forEach(packageSpec => {
            const match =
                packageSpec.match(
                    /^(@?[^@]+)(?:@(.+))?$/
                );

            const name =
                match?.[1] ||
                packageSpec;

            const version =
                match?.[2] ||
                "latest";

            pkg.dependencies[name] =
                version;

            terminalWrite(
                `+ ${name}@${version}`
            );
        });

        savePackageJSON(pkg);

        terminalWrite(
            "package.json updated."
        );

        terminalWrite(
            "GCODE workspace npm simulation complete."
        );

        terminalWrite(
            "Real npm package installation requires a connected Node runtime."
        );
    }

    function npmUninstall(packages) {
        const pkg =
            getPackageJSON();

        if (!pkg) {
            terminalWrite(
                "package.json is invalid or missing.",
                "error"
            );

            return;
        }

        packages.forEach(name => {
            let removed = false;

            if (
                pkg.dependencies &&
                pkg.dependencies[name]
            ) {
                delete pkg.dependencies[name];
                removed = true;
            }

            if (
                pkg.devDependencies &&
                pkg.devDependencies[name]
            ) {
                delete pkg.devDependencies[name];
                removed = true;
            }

            if (removed) {
                terminalWrite(
                    `removed ${name}`
                );
            } else {
                terminalWrite(
                    `${name} is not installed.`,
                    "error"
                );
            }
        });

        savePackageJSON(pkg);
    }

    function npmUpdate() {
        terminalWrite(
            "Checking dependencies..."
        );

        terminalWrite(
            "package.json dependency ranges preserved."
        );

        terminalWrite(
            "Real npm update requires a Node/npm runtime."
        );
    }

    function npmList() {
        const pkg =
            getPackageJSON();

        if (!pkg) {
            return terminalWrite(
                "package.json not found.",
                "error"
            );
        }

        terminalWrite(
            `${pkg.name || "project"}@${pkg.version || "1.0.0"}`
        );

        const dependencies = {
            ...(pkg.dependencies || {}),
            ...(pkg.devDependencies || {})
        };

        const names =
            Object.keys(dependencies);

        if (!names.length) {
            terminalWrite(
                "└── (no dependencies)"
            );

            return;
        }

        names.forEach(name => {
            terminalWrite(
                `├── ${name}@${dependencies[name]}`
            );
        });
    }

    function npmRun(args) {
        const scriptName =
            args[0];

        if (!scriptName) {
            const pkg =
                getPackageJSON();

            if (!pkg) {
                return terminalWrite(
                    "package.json not found.",
                    "error"
                );
            }

            terminalWriteBlock(
                Object.keys(
                    pkg.scripts || {}
                ).join("\n") ||
                "No scripts."
            );

            return;
        }

        const pkg =
            getPackageJSON();

        if (!pkg) {
            return terminalWrite(
                "package.json not found.",
                "error"
            );
        }

        const script =
            pkg.scripts?.[scriptName];

        if (!script) {
            return terminalWrite(
                `Missing script: "${scriptName}"`,
                "error"
            );
        }

        terminalWrite(
            `> ${pkg.name || "project"}@${pkg.version || "1.0.0"} ${scriptName}`
        );

        terminalWrite(
            `> ${script}`
        );

        if (
            window.GCODERuntime &&
            typeof window.GCODERuntime.run ===
                "function"
        ) {
            return window.GCODERuntime.run(
                "npm",
                ["run", scriptName],
                {
                    cwd: currentDirectory,
                    files
                }
            ).then(result => {
                terminalWriteBlock(
                    result?.output ||
                    result?.stdout ||
                    ""
                );
            });
        }

        terminalWrite(
            "Runtime Node/npm not connected."
        );

        terminalWrite(
            "The command was parsed successfully, but GCODE cannot execute a real npm process inside the browser."
        );
    }

    /* =====================================================
       NODE / NPX
    ===================================================== */

    function commandNode(args) {
        if (!args.length) {
            return terminalWrite(
                "Node.js runtime is not connected."
            );
        }

        if (
            window.GCODERuntime &&
            typeof window.GCODERuntime.run ===
                "function"
        ) {
            return window.GCODERuntime.run(
                "node",
                args,
                {
                    cwd: currentDirectory,
                    files
                }
            ).then(result => {
                terminalWriteBlock(
                    result?.output ||
                    result?.stdout ||
                    ""
                );
            });
        }

        terminalWrite(
            `node ${args.join(" ")}`
        );

        terminalWrite(
            "Node.js runtime not connected."
        );
    }

    function commandNPX(args) {
        if (!args.length) {
            return terminalWrite(
                "Usage: npx <command>",
                "error"
            );
        }

        if (
            window.GCODERuntime &&
            typeof window.GCODERuntime.run ===
                "function"
        ) {
            return window.GCODERuntime.run(
                "npx",
                args,
                {
                    cwd: currentDirectory,
                    files
                }
            ).then(result => {
                terminalWriteBlock(
                    result?.output ||
                    result?.stdout ||
                    ""
                );
            });
        }

        terminalWrite(
            `npx ${args.join(" ")}`
        );

        terminalWrite(
            "npx runtime not connected."
        );
    }

    /* =====================================================
       GIT
    ===================================================== */

    const gitState = {
        staged: [],
        commits: []
    };

    function commandGit(args) {
        const sub =
            (args[0] || "")
                .toLowerCase();

        switch (sub) {
            case "status":
                return gitStatus();

            case "add":
                return gitAdd(
                    args.slice(1)
                );

            case "commit":
                return gitCommit(
                    args.slice(1)
                );

            case "log":
                return gitLog();

            case "branch":
                return terminalWrite(
                    "* main"
                );

            default:
                terminalWrite(
                    "GCODE Git interface: status, add, commit, log, branch"
                );

                terminalWrite(
                    "Real Git operations require a connected Git runtime."
                );
        }
    }

    function gitStatus() {
        terminalWrite(
            "On branch main"
        );

        const tracked =
            Object.keys(files);

        if (!tracked.length) {
            terminalWrite(
                "nothing to commit"
            );

            return;
        }

        terminalWrite(
            "Changes available in GCODE workspace:"
        );

        tracked.forEach(name => {
            terminalWrite(
                `  modified: ${name}`
            );
        });
    }

    function gitAdd(args) {
        if (!args.length) {
            return terminalWrite(
                "Nothing specified, nothing added.",
                "error"
            );
        }

        if (args[0] === ".") {
            gitState.staged =
                Object.keys(files);
        } else {
            gitState.staged =
                args.filter(
                    name =>
                        files[name] !== undefined
                );
        }

        terminalWrite(
            `${gitState.staged.length} file(s) staged.`
        );
    }

    function gitCommit(args) {
        let message = "Update";

        const index =
            args.indexOf("-m");

        if (
            index !== -1 &&
            args[index + 1]
        ) {
            message =
                args[index + 1];
        }

        const commit = {
            id:
                Math.random()
                    .toString(16)
                    .slice(2, 10),
            message,
            date:
                new Date().toISOString()
        };

        gitState.commits.push(commit);

        gitState.staged = [];

        terminalWrite(
            `[main ${commit.id}] ${message}`
        );

        terminalWrite(
            "Local GCODE Git simulation complete."
        );
    }

    function gitLog() {
        if (!gitState.commits.length) {
            return terminalWrite(
                "No commits yet."
            );
        }

        [...gitState.commits]
            .reverse()
            .forEach(commit => {
                terminalWrite(
                    `commit ${commit.id}\n    ${commit.message}`
                );
            });
    }

    /* =====================================================
       ENV
    ===================================================== */

    const environment = {
        NODE_ENV: "development",
        GCODE_VERSION: "4.0.0",
        SHELL: "GCODE"
    };

    function commandEnv() {
        Object.entries(environment)
            .forEach(
                ([key, value]) =>
                    terminalWrite(
                        `${key}=${value}`
                    )
            );
    }

    function commandSet(args) {
        const expression =
            args.join(" ");

        const index =
            expression.indexOf("=");

        if (index === -1) {
            return terminalWrite(
                "Usage: set NAME=value",
                "error"
            );
        }

        const key =
            expression
                .slice(0, index)
                .trim();

        const value =
            expression
                .slice(index + 1)
                .trim();

        environment[key] = value;

        terminalWrite(
            `${key}=${value}`
        );
    }

    function commandWhich(args) {
        const name = args[0];

        const commands = [
            "npm",
            "node",
            "npx",
            "git",
            "gcode"
        ];

        if (commands.includes(name)) {
            terminalWrite(
                `/gcode/bin/${name}`
            );
        } else {
            terminalWrite(
                `${name}: not found`,
                "error"
            );
        }
    }

    /* =====================================================
       EXPORT / IMPORT
    ===================================================== */

    async function commandExport(args) {
        const name =
            args[0] || activeFile;

        if (files[name] === undefined) {
            return terminalWrite(
                `File not found: ${name}`,
                "error"
            );
        }

        const blob =
            new Blob(
                [files[name]],
                {
                    type:
                        "text/plain;charset=utf-8"
                }
            );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;
        link.download = name;

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);

        terminalWrite(
            `Exported ${name}`
        );
    }

    function commandImport() {
        const input =
            document.createElement("input");

        input.type = "file";
        input.multiple = true;

        input.addEventListener(
            "change",
            async () => {
                const selected =
                    [...input.files];

                for (const file of selected) {
                    const content =
                        await file.text();

                    files[file.name] =
                        content;

                    openFile(file.name);

                    terminalWrite(
                        `Imported ${file.name}`
                    );
                }

                saveFiles();
            }
        );

        input.click();
    }

    /* =====================================================
       RUN
    ===================================================== */

    async function commandRun(args) {
        const target =
            args[0] || activeFile;

        if (
            target.endsWith(".html") ||
            target === "index.html"
        ) {
            return runHTMLPreview(target);
        }

        if (
            target.endsWith(".js") ||
            target.endsWith(".mjs")
        ) {
            return commandNode([target]);
        }

        terminalWrite(
            `No browser preview available for ${target}.`
        );
    }

    function runHTMLPreview(name) {
        const content =
            files[name];

        if (content === undefined) {
            return terminalWrite(
                `File not found: ${name}`,
                "error"
            );
        }

        const overlay =
            document.createElement("div");

        overlay.style.position = "fixed";
        overlay.style.inset = "0";
        overlay.style.zIndex = "99999";
        overlay.style.background = "#000";

        const header =
            document.createElement("div");

        header.style.height = "42px";
        header.style.display = "flex";
        header.style.alignItems = "center";
        header.style.justifyContent = "space-between";
        header.style.padding = "0 12px";

        const title =
            document.createElement("span");

        title.textContent =
            `GCODE Preview — ${name}`;

        const close =
            document.createElement("button");

        close.textContent = "×";

        close.style.fontSize = "22px";

        close.addEventListener(
            "click",
            () => overlay.remove()
        );

        header.appendChild(title);
        header.appendChild(close);

        const iframe =
            document.createElement("iframe");

        iframe.style.width = "100%";
        iframe.style.height =
            "calc(100% - 42px)";
        iframe.style.border = "0";

        iframe.setAttribute(
            "sandbox",
            "allow-scripts allow-forms allow-modals"
        );

        overlay.appendChild(header);
        overlay.appendChild(iframe);

        document.body.appendChild(overlay);

        iframe.srcdoc = content;

        terminalWrite(
            `Preview started: ${name}`
        );
    }

    /* =====================================================
       TERMINAL PANEL
    ===================================================== */

    function setupPanelTabs() {
        $$(".panel-tab").forEach(tab => {
            tab.addEventListener(
                "click",
                () => {
                    $$(".panel-tab")
                        .forEach(item =>
                            item.classList.remove(
                                "active"
                            )
                        );

                    tab.classList.add(
                        "active"
                    );
                }
            );
        });

        const close =
            $(
                '#bottomPanel .panel-actions button[title="Close Panel"]'
            );

        if (close) {
            close.addEventListener(
                "click",
                () => {
                    bottomPanel?.classList.add(
                        "hidden"
                    );
                }
            );
        }
    }

    /* =====================================================
       SEARCH
    ===================================================== */

    function setupSearch() {
        const searchBox =
            $(".command-search");

        if (!searchBox) return;

        searchBox.addEventListener(
            "click",
            () => {
                const query =
                    window.prompt(
                        "Search in GCODE"
                    );

                if (!query) return;

                searchWorkspace(query);
            }
        );
    }

    function searchWorkspace(query) {
        let found = 0;

        Object.entries(files)
            .forEach(
                ([name, content]) => {
                    const lines =
                        content.split("\n");

                    lines.forEach(
                        (line, index) => {
                            if (
                                line
                                    .toLowerCase()
                                    .includes(
                                        query.toLowerCase()
                                    )
                            ) {
                                terminalWrite(
                                    `${name}:${index + 1}: ${line.trim()}`
                                );

                                found++;
                            }
                        }
                    );
                }
            );

        terminalWrite(
            `${found} result(s).`
        );
    }

    /* =====================================================
       ACTIVITY BAR
    ===================================================== */

    function setupActivityBar() {
        $$(".activity-item[data-panel]")
            .forEach(item => {
                item.addEventListener(
                    "click",
                    () => {
                        $$(".activity-item")
                            .forEach(
                                element =>
                                    element.classList.remove(
                                        "active"
                                    )
                            );

                        item.classList.add(
                            "active"
                        );

                        const panel =
                            item.dataset.panel;

                        if (
                            panel === "run"
                        ) {
                            runHTMLPreview(
                                "index.html"
                            );
                        }

                        if (
                            panel === "search"
                        ) {
                            const query =
                                window.prompt(
                                    "Search"
                                );

                            if (query) {
                                searchWorkspace(
                                    query
                                );
                            }
                        }
                    }
                );
            });
    }

    /* =====================================================
       KEYBOARD SHORTCUTS
    ===================================================== */

    function setupShortcuts() {
        document.addEventListener(
            "keydown",
            event => {
                const mod =
                    event.ctrlKey ||
                    event.metaKey;

                if (
                    mod &&
                    event.key.toLowerCase() === "s"
                ) {
                    event.preventDefault();

                    if (
                        document.activeElement ===
                        codeDisplay
                    ) {
                        leaveEditorMode();
                    }

                    saveFiles();

                    terminalWrite(
                        "Saved."
                    );
                }

                if (
                    mod &&
                    event.key.toLowerCase() === "z"
                ) {
                    event.preventDefault();

                    undo();
                }

                if (
                    mod &&
                    event.key.toLowerCase() === "y"
                ) {
                    event.preventDefault();

                    redo();
                }

                if (
                    mod &&
                    event.key.toLowerCase() === "p"
                ) {
                    event.preventDefault();

                    const query =
                        window.prompt(
                            "Quick Open"
                        );

                    if (!query) return;

                    const match =
                        Object.keys(files)
                            .find(
                                name =>
                                    name
                                        .toLowerCase()
                                        .includes(
                                            query.toLowerCase()
                                        )
                            );

                    if (match) {
                        openFile(match);
                    }
                }

                if (
                    mod &&
                    event.key.toLowerCase() === "j"
                ) {
                    event.preventDefault();

                    bottomPanel?.classList.toggle(
                        "hidden"
                    );

                    focusTerminal();
                }

                if (
                    event.key === "F5"
                ) {
                    event.preventDefault();

                    commandRun([]);
                }
            }
        );
    }

    /* =====================================================
       EDITOR EVENTS
    ===================================================== */

    function setupEditor() {
        if (!codeDisplay) return;

        codeDisplay.addEventListener(
            "focus",
            () => {
                enterEditorMode();
            }
        );

        codeDisplay.addEventListener(
            "input",
            handleEditorInput
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
            "blur",
            () => {
                leaveEditorMode();
            }
        );

        codeDisplay.addEventListener(
            "keydown",
            event => {
                if (event.key === "Tab") {
                    event.preventDefault();

                    document.execCommand(
                        "insertText",
                        false,
                        "    "
                    );
                }
            }
        );
    }

    /* =====================================================
       FILE SYSTEM API
    ===================================================== */

    async function syncWithGCODEFileSystem() {
        if (
            !window.GCODEFileSystem
        ) {
            return;
        }

        /*
         * The existing filesystem.js remains
         * responsible for real directories.
         * This controller keeps the browser
         * workspace available as a fallback.
         */
    }

    /* =====================================================
       GLOBAL GCODE API
    ===================================================== */

    window.GCODE = {
        version: "4.0.0",

        files,

        openFile,

        save() {
            saveFiles();
        },

        run() {
            return commandRun([]);
        },

        terminal(command) {
            return executeTerminalCommand(
                command
            );
        },

        getFile(name) {
            return files[name];
        },

        setFile(name, content) {
            files[name] =
                String(content ?? "");

            saveFiles();

            if (name === activeFile) {
                renderEditor();
            }
        },

        getFiles() {
            return {
                ...files
            };
        }
    };

    /* =====================================================
       INITIALIZATION
    ===================================================== */

    function initialize() {
        setupExplorer();
        setupTerminal();
        setupPanelTabs();
        setupSearch();
        setupActivityBar();
        setupShortcuts();
        setupEditor();

        renderEditor();
        renderTabs();
        renderExplorer();

        updateTerminalPath();

        terminalWrite(
            "GCODE Terminal V4.0.0"
        );

        terminalWrite(
            'Type "help" to see available commands.'
        );

        terminalWrite(
            "Workspace ready."
        );

        syncWithGCODEFileSystem();

        console.log(
            "GCODE V4 initialized."
        );
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );
    } else {
        initialize();
    }

})();
