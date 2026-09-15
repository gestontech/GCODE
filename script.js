/* =========================================================
   GCODE V3
   REAL VS CODE STYLE CONTROLLER
   iPHONE / iPAD / ANDROID / DESKTOP

   IMPORTANT :
   - Ne modifie pas le thème
   - Ne modifie pas le HTML
   - Contrôle uniquement le comportement
========================================================= */

(() => {
    "use strict";

    /* =====================================================
       DOM
    ===================================================== */

    const sidebar = document.getElementById("sidebar");
    const editorTabs = document.getElementById("editorTabs");
    const codeEditor = document.getElementById("codeEditor");
    const codeDisplay = document.getElementById("codeDisplay");
    const lineNumbers = document.getElementById("lineNumbers");
    const breadcrumbFile = document.getElementById("breadcrumbFile");
    const language = document.getElementById("language");
    const cursorPosition = document.getElementById("cursorPosition");
    const terminal = document.getElementById("terminal");
    const bottomPanel = document.getElementById("bottomPanel");

    const backBtn = document.getElementById("backBtn");
    const forwardBtn = document.getElementById("forwardBtn");
    const closeWindow = document.getElementById("closeWindow");

    const fileTree =
        document.querySelector(".file-tree");

    const commandSearch =
        document.querySelector(".command-search");

    /* =====================================================
       FILE SYSTEM
    ===================================================== */

    const FS = window.GCODEFileSystem || null;

    /* =====================================================
       CONSTANTES
    ===================================================== */

    const OPEN_TABS_KEY =
        "GCODE_OPEN_TABS_V3";

    const ACTIVE_FILE_KEY =
        "GCODE_ACTIVE_FILE_V3";

    const EDITOR_HISTORY_KEY =
        "GCODE_EDITOR_HISTORY_V3";

    /* =====================================================
       ETAT
    ===================================================== */

    const defaultFiles = {
        "/index.html": {
            language: "HTML",
            content: `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GCODE</title>
</head>
<body>
    <div id="app">
        GCODE Editor
    </div>
</body>
</html>`
        },

        "/style.css": {
            language: "CSS",
            content: `/* GCODE Editor */

body {
    margin: 0;
    padding: 0;
    background: #1e1e1e;
    color: #cccccc;
}

.editor {
    display: flex;
    height: 100vh;
}

/* Terminal */

.terminal {
    height: 240px;
}

/* End */`
        },

        "/script.js": {
            language: "JavaScript",
            content: `// GCODE JavaScript

const app = {
    name: "GCODE",
    version: "3.0.0",

    start() {
        console.log("GCODE started");
    }
};

app.start();`
        },

        "/package.json": {
            language: "JSON",
            content: `{
    "name": "gcode",
    "version": "3.0.0",
    "private": true
}`
        },

        "/README.md": {
            language: "Markdown",
            content: `# GCODE

GCODE est un éditeur de code.

## Version

3.0.0`
        },

        "/.env": {
            language: "Environment",
            content: `# Variables locales GCODE`
        },

        "/.gitignore": {
            language: "Git",
            content: `node_modules/
dist/
build/
.env.local`
        }
    };

    let files = {};
    let openTabs = [];
    let activeFile = null;

    let undoStack = [];
    let redoStack = [];

    let currentDirectory = "/";
    let projectOpened = false;
    let projectName = "GCODE";

    let terminalHistory = [];
    let terminalHistoryIndex = -1;

    let terminalInput = null;

    let menuOverlay = null;
    let searchOverlay = null;

    let editorFocused = false;
    let saveTimer = null;

    /* =====================================================
       OUTILS
    ===================================================== */

    function normalizePath(path) {
        if (FS?.normalizePath) {
            return FS.normalizePath(path);
        }

        let value = String(path || "/")
            .replace(/\\/g, "/")
            .replace(/\/+/g, "/");

        if (!value.startsWith("/")) {
            value = "/" + value;
        }

        if (
            value.length > 1 &&
            value.endsWith("/")
        ) {
            value = value.slice(0, -1);
        }

        return value;
    }

    function fileName(path) {
        return normalizePath(path)
            .split("/")
            .pop() || "";
    }

    function parentPath(path) {
        const normalized =
            normalizePath(path);

        if (normalized === "/") {
            return "/";
        }

        const parts =
            normalized.split("/");

        parts.pop();

        return parts.join("/") || "/";
    }

    function joinPath(parent, name) {
        if (FS?.joinPath) {
            return FS.joinPath(parent, name);
        }

        const base =
            normalizePath(parent);

        const clean =
            String(name || "")
                .replace(/^\/+/, "")
                .replace(/\/+$/, "");

        return base === "/"
            ? "/" + clean
            : base + "/" + clean;
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function getLanguage(name) {
        const lower =
            String(name)
                .toLowerCase();

        if (lower.endsWith(".html")) return "HTML";
        if (lower.endsWith(".htm")) return "HTML";
        if (lower.endsWith(".css")) return "CSS";
        if (lower.endsWith(".js")) return "JavaScript";
        if (lower.endsWith(".jsx")) return "JavaScript React";
        if (lower.endsWith(".ts")) return "TypeScript";
        if (lower.endsWith(".tsx")) return "TypeScript React";
        if (lower.endsWith(".json")) return "JSON";
        if (lower.endsWith(".md")) return "Markdown";
        if (lower.endsWith(".py")) return "Python";
        if (lower.endsWith(".php")) return "PHP";
        if (lower.endsWith(".sql")) return "SQL";
        if (lower.endsWith(".xml")) return "XML";
        if (lower.endsWith(".svg")) return "SVG";
        if (lower.endsWith(".yml")) return "YAML";
        if (lower.endsWith(".yaml")) return "YAML";
        if (lower.endsWith(".sh")) return "Shell";
        if (lower.endsWith(".env")) return "Environment";
        if (lower === ".gitignore") return "Git";

        return "Plain Text";
    }

    function setStatus(text) {
        const existing =
            document.querySelector(
                ".status-message"
            );

        if (existing) {
            existing.textContent = text;
        }

        console.log(
            "[GCODE]",
            text
        );
    }

    /* =====================================================
       STORAGE LOCAL
    ===================================================== */

    function loadLocalFiles() {
        try {
            const saved =
                localStorage.getItem(
                    "GCODE_LOCAL_FILES_V3"
                );

            if (saved) {
                const parsed =
                    JSON.parse(saved);

                if (
                    parsed &&
                    typeof parsed === "object"
                ) {
                    return parsed;
                }
            }
        } catch (error) {
            console.warn(error);
        }

        return structuredClone
            ? structuredClone(defaultFiles)
            : JSON.parse(
                JSON.stringify(defaultFiles)
            );
    }

    function saveLocalFiles() {
        try {
            localStorage.setItem(
                "GCODE_LOCAL_FILES_V3",
                JSON.stringify(files)
            );
        } catch (error) {
            console.warn(
                "GCODE local storage:",
                error
            );
        }
    }

    function loadTabs() {
        try {
            const value =
                localStorage.getItem(
                    OPEN_TABS_KEY
                );

            if (!value) {
                return [
                    "/style.css",
                    "/index.html"
                ];
            }

            const parsed =
                JSON.parse(value);

            return Array.isArray(parsed)
                ? parsed
                : [];
        } catch {
            return [];
        }
    }

    function saveTabs() {
        localStorage.setItem(
            OPEN_TABS_KEY,
            JSON.stringify(openTabs)
        );

        if (activeFile) {
            localStorage.setItem(
                ACTIVE_FILE_KEY,
                activeFile
            );
        }
    }

    /* =====================================================
       SYNTAX HIGHLIGHT
    ===================================================== */

    function highlight(code, name) {
        const lang =
            getLanguage(name);

        let text =
            escapeHTML(code);

        if (
            lang === "HTML" ||
            lang === "XML"
        ) {
            text = text
                .replace(
                    /(&lt;!--[\s\S]*?--&gt;)/g,
                    '<span class="comment">$1</span>'
                )
                .replace(
                    /(&lt;\/?[a-zA-Z0-9-]+)/g,
                    '<span class="selector">$1</span>'
                )
                .replace(
                    /([a-zA-Z-]+)(=)/g,
                    '<span class="property">$1</span>$2'
                )
                .replace(
                    /(&quot;.*?&quot;)/g,
                    '<span class="value">$1</span>'
                );
        }

        else if (lang === "CSS") {
            text = text
                .replace(
                    /(\/\*[\s\S]*?\*\/)/g,
                    '<span class="comment">$1</span>'
                )
                .replace(
                    /(^|[{}]\s*)([.#a-zA-Z][^{\n]*)(?=\s*\{)/gm,
                    '$1<span class="selector">$2</span>'
                )
                .replace(
                    /([a-zA-Z-]+)(\s*:)/g,
                    '<span class="property">$1</span>$2'
                );
        }

        else if (
            lang === "JavaScript" ||
            lang === "TypeScript" ||
            lang.includes("React")
        ) {
            text = text
                .replace(
                    /(\/\/.*)$/gm,
                    '<span class="comment">$1</span>'
                )
                .replace(
                    /(&quot;.*?&quot;|'[^']*'|`[^`]*`)/g,
                    '<span class="value">$1</span>'
                )
                .replace(
                    /\b(const|let|var|function|return|if|else|for|while|class|new|import|from|export|default|async|await|try|catch|throw)\b/g,
                    '<span class="selector">$1</span>'
                );
        }

        else if (lang === "JSON") {
            text = text
                .replace(
                    /(&quot;.*?&quot;)(\s*:)/g,
                    '<span class="property">$1</span>$2'
                )
                .replace(
                    /(:\s*)(&quot;.*?&quot;|\d+(?:\.\d+)?|true|false|null)/g,
                    '$1<span class="value">$2</span>'
                );
        }

        else if (lang === "Markdown") {
            text = text
                .replace(
                    /^(#{1,6} .*)$/gm,
                    '<span class="selector">$1</span>'
                );
        }

        return text;
    }

    /* =====================================================
       EDITOR IOS
    ===================================================== */

    function configureEditor() {
        if (!codeDisplay) return;

        codeDisplay.setAttribute(
            "contenteditable",
            "true"
        );

        codeDisplay.setAttribute(
            "spellcheck",
            "false"
        );

        codeDisplay.setAttribute(
            "autocorrect",
            "off"
        );

        codeDisplay.setAttribute(
            "autocapitalize",
            "off"
        );

        codeDisplay.setAttribute(
            "autocomplete",
            "off"
        );

        codeDisplay.setAttribute(
            "inputmode",
            "text"
        );

        codeDisplay.setAttribute(
            "role",
            "textbox"
        );

        codeDisplay.setAttribute(
            "aria-multiline",
            "true"
        );

        codeDisplay.style.webkitUserModify =
            "read-write";

        codeDisplay.style.webkitUserSelect =
            "text";

        codeDisplay.style.userSelect =
            "text";

        codeDisplay.style.touchAction =
            "manipulation";

        codeDisplay.addEventListener(
            "focus",
            () => {
                editorFocused = true;
            }
        );

        codeDisplay.addEventListener(
            "blur",
            () => {
                editorFocused = false;
            }
        );
    }

    function editorText() {
        if (!codeDisplay) {
            return "";
        }

        return codeDisplay.innerText
            .replace(/\r\n/g, "\n")
            .replace(/\u00a0/g, " ");
    }

    function enterEditor() {
        if (!codeDisplay) return;

        const text =
            editorText();

        codeDisplay.textContent =
            text;

        codeDisplay.focus();

        moveCaretEnd();
    }

    function moveCaretEnd() {
        try {
            const range =
                document.createRange();

            range.selectNodeContents(
                codeDisplay
            );

            range.collapse(false);

            const selection =
                window.getSelection();

            selection.removeAllRanges();

            selection.addRange(
                range
            );
        } catch {}
    }

    /* =====================================================
       LIGNES
    ===================================================== */

    function updateLineNumbers(text) {
        if (!lineNumbers) return;

        const count =
            Math.max(
                1,
                String(text || "")
                    .split("\n")
                    .length
            );

        lineNumbers.innerHTML = "";

        for (
            let i = 1;
            i <= Math.max(count, 20);
            i++
        ) {
            const span =
                document.createElement(
                    "span"
                );

            span.textContent =
                String(i);

            lineNumbers.appendChild(
                span
            );
        }
    }

    function updateCursor() {
        if (!cursorPosition) return;

        try {
            const selection =
                window.getSelection();

            if (
                !selection ||
                !selection.rangeCount
            ) {
                return;
            }

            const range =
                selection.getRangeAt(0);

            if (
                !codeDisplay.contains(
                    range.startContainer
                )
            ) {
                return;
            }

            const text =
                editorText();

            const before =
                text.substring(
                    0,
                    Math.min(
                        text.length,
                        range.startOffset
                    )
                );

            const lines =
                before.split("\n");

            const line =
                lines.length;

            const column =
                lines[lines.length - 1]
                    .length + 1;

            cursorPosition.textContent =
                `Ln ${line}, Col ${column}`;
        } catch {}
    }

    /* =====================================================
       RENDER EDITOR
    ===================================================== */

    function renderEditor(
        path,
        focus = false
    ) {
        if (!files[path]) return;

        activeFile = path;

        const name =
            fileName(path);

        const content =
            files[path].content || "";

        if (breadcrumbFile) {
            breadcrumbFile.textContent =
                name;
        }

        if (language) {
            language.textContent =
                getLanguage(name);
        }

        codeDisplay.innerHTML =
            highlight(
                content,
                name
            );

        updateLineNumbers(
            content
        );

        renderTabs();

        updateTreeSelection();

        saveTabs();

        if (focus) {
            setTimeout(
                () => {
                    enterEditor();
                },
                80
            );
        }
    }

    /* =====================================================
       TABS
    ===================================================== */

    function renderTabs() {
        if (!editorTabs) return;

        editorTabs.innerHTML = "";

        openTabs.forEach(path => {
            const tab =
                document.createElement(
                    "div"
                );

            tab.className =
                "editor-tab";

            tab.dataset.file =
                path;

            if (path === activeFile) {
                tab.classList.add(
                    "active"
                );
            }

            const name =
                fileName(path);

            tab.innerHTML = `
                <span class="tab-file-icon ${getLanguage(name).toLowerCase()}-symbol">
                    ${getTabIcon(name)}
                </span>
                <span class="tab-name">
                    ${escapeHTML(name)}
                </span>
                <button class="tab-close" type="button">×</button>
            `;

            tab.addEventListener(
                "click",
                event => {

                    if (
                        event.target.closest(
                            ".tab-close"
                        )
                    ) {
                        event.stopPropagation();
                        closeTab(path);
                        return;
                    }

                    openFile(path);
                }
            );

            editorTabs.appendChild(
                tab
            );
        });
    }

    function getTabIcon(name) {
        const lang =
            getLanguage(name);

        if (lang === "CSS") return "#";
        if (lang === "HTML") return "</>";
        if (lang === "JavaScript") return "JS";
        if (lang === "JSON") return "{ }";
        if (lang === "Markdown") return "▤";

        return "•";
    }

    function closeTab(path) {
        const index =
            openTabs.indexOf(path);

        if (index === -1) return;

        openTabs.splice(
            index,
            1
        );

        if (activeFile === path) {

            if (openTabs.length) {

                const next =
                    openTabs[
                        Math.max(
                            0,
                            index - 1
                        )
                    ];

                openFile(next);

            } else {

                activeFile = null;

                codeDisplay.textContent =
                    "";

                breadcrumbFile.textContent =
                    "";

                if (language) {
                    language.textContent =
                        "Plain Text";
                }
            }
        }

        saveTabs();
        renderTabs();
    }

    /* =====================================================
       FICHIERS
    ===================================================== */

    async function openFile(path) {
        const normalized =
            normalizePath(path);

        try {

            let content;

            if (
                projectOpened &&
                FS
            ) {
                content =
                    await FS.readFile(
                        normalized
                    );
            }

            else if (
                files[normalized]
            ) {
                content =
                    files[normalized]
                        .content;
            }

            else {
                return;
            }

            files[normalized] = {
                language:
                    getLanguage(
                        fileName(
                            normalized
                        )
                    ),
                content:
                    content
            };

            if (
                !openTabs.includes(
                    normalized
                )
            ) {
                openTabs.push(
                    normalized
                );
            }

            undoStack = [];
            redoStack = [];

            renderEditor(
                normalized
            );

            setStatus(
                `Ouvert : ${fileName(normalized)}`
            );

        } catch (error) {
            console.error(error);

            setStatus(
                `Erreur : ${fileName(normalized)}`
            );
        }
    }

    async function saveFile(
        path = activeFile,
        content = editorText()
    ) {
        if (!path) return false;

        if (!files[path]) {
            files[path] = {
                language:
                    getLanguage(
                        fileName(path)
                    ),
                content: ""
            };
        }

        files[path].content =
            content;

        saveLocalFiles();

        if (
            projectOpened &&
            FS
        ) {
            try {
                await FS.writeFile(
                    path,
                    content
                );
            } catch (error) {
                console.error(
                    "Save error:",
                    error
                );

                setStatus(
                    "Erreur de sauvegarde"
                );

                return false;
            }
        }

        setStatus(
            `Sauvegardé : ${fileName(path)}`
        );

        return true;
    }

    /* =====================================================
       INPUT EDITEUR
    ===================================================== */

    codeDisplay.addEventListener(
        "input",
        () => {

            if (!activeFile) return;

            const newContent =
                editorText();

            if (
                !files[activeFile]
            ) {
                files[activeFile] = {
                    language:
                        getLanguage(
                            fileName(
                                activeFile
                            )
                        ),
                    content: ""
                };
            }

            undoStack.push(
                files[activeFile]
                    .content
            );

            if (
                undoStack.length > 100
            ) {
                undoStack.shift();
            }

            redoStack = [];

            files[activeFile]
                .content =
                newContent;

            updateLineNumbers(
                newContent
            );

            updateCursor();

            saveLocalFiles();

            clearTimeout(
                saveTimer
            );

            saveTimer =
                setTimeout(
                    () => {
                        saveFile(
                            activeFile,
                            newContent
                        );
                    },
                    350
                );
        }
    );

    codeDisplay.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Tab"
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
                (event.ctrlKey ||
                    event.metaKey) &&
                event.key.toLowerCase() === "s"
            ) {
                event.preventDefault();

                saveFile();

                return;
            }

            if (
                (event.ctrlKey ||
                    event.metaKey) &&
                event.key.toLowerCase() === "z"
            ) {
                event.preventDefault();

                undo();

                return;
            }

            if (
                (event.ctrlKey ||
                    event.metaKey) &&
                (
                    event.key.toLowerCase() ===
                    "y" ||
                    (
                        event.shiftKey &&
                        event.key.toLowerCase() ===
                        "z"
                    )
                )
            ) {
                event.preventDefault();

                redo();
            }
        }
    );

    codeDisplay.addEventListener(
        "keyup",
        updateCursor
    );

    codeDisplay.addEventListener(
        "click",
        updateCursor
    );

    codeDisplay.addEventListener(
        "touchend",
        updateCursor
    );

    /* =====================================================
       UNDO / REDO
    ===================================================== */

    async function undo() {
        if (!activeFile) return;

        if (!undoStack.length) {
            setStatus(
                "Aucune modification à annuler"
            );
            return;
        }

        const current =
            files[activeFile].content;

        const previous =
            undoStack.pop();

        redoStack.push(
            current
        );

        files[activeFile].content =
            previous;

        renderEditor(
            activeFile,
            true
        );

        await saveFile(
            activeFile,
            previous
        );
    }

    async function redo() {
        if (!activeFile) return;

        if (!redoStack.length) {
            setStatus(
                "Aucune modification à rétablir"
            );
            return;
        }

        const current =
            files[activeFile].content;

        const next =
            redoStack.pop();

        undoStack.push(
            current
        );

        files[activeFile].content =
            next;

        renderEditor(
            activeFile,
            true
        );

        await saveFile(
            activeFile,
            next
        );
    }

    /* =====================================================
       EXPLORER
    ===================================================== */

    function updateTreeSelection() {
        document
            .querySelectorAll(
                ".tree-item.file"
            )
            .forEach(item => {

                const path =
                    normalizePath(
                        item.dataset.file ||
                        item.querySelector(
                            "span:last-child"
                        )?.textContent ||
                        ""
                    );

                item.classList.toggle(
                    "active",
                    path === activeFile
                );
            });
    }

    function connectExistingFiles() {
        document
            .querySelectorAll(
                ".tree-item.file"
            )
            .forEach(item => {

                if (
                    item.dataset.gcodeBound
                ) {
                    return;
                }

                item.dataset.gcodeBound =
                    "true";

                item.addEventListener(
                    "click",
                    async event => {

                        event.stopPropagation();

                        let path =
                            item.dataset.file;

                        if (!path) {
                            const spans =
                                item.querySelectorAll(
                                    "span"
                                );

                            const last =
                                spans[
                                    spans.length - 1
                                ];

                            path =
                                last?.textContent
                                    .trim();
                        }

                        if (!path) return;

                        await openFile(
                            normalizePath(
                                path
                            )
                        );
                    }
                );
            });
    }

    function connectFolders() {
        document
            .querySelectorAll(
                ".tree-item.folder"
            )
            .forEach(folder => {

                if (
                    folder.dataset.gcodeBound
                ) {
                    return;
                }

                folder.dataset.gcodeBound =
                    "true";

                folder.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                        const arrow =
                            folder.querySelector(
                                ".arrow"
                            );

                        const open =
                            folder.classList.toggle(
                                "opened"
                            );

                        if (arrow) {
                            arrow.textContent =
                                open
                                    ? "⌄"
                                    : "›";
                        }

                        setStatus(
                            open
                                ? "Dossier ouvert"
                                : "Dossier fermé"
                        );
                    }
                );
            });
    }

    async function openProject() {
        if (!FS) {
            setStatus(
                "filesystem.js manquant"
            );
            return;
        }

        if (
            !FS.supportsFileSystemAccess()
        ) {
            setStatus(
                "Accès dossier non disponible sur ce navigateur"
            );

            return;
        }

        try {

            const directory =
                await FS.openProject();

            if (!directory) {
                return;
            }

            projectOpened = true;

            projectName =
                FS.getProjectName();

            currentDirectory = "/";

            await refreshRealExplorer();

            setStatus(
                `Projet ouvert : ${projectName}`
            );

        } catch (error) {
            console.error(error);

            setStatus(
                "Ouverture du projet annulée"
            );
        }
    }

    async function refreshRealExplorer() {
        if (!FS || !projectOpened) {
            return;
        }

        try {

            const items =
                await FS.listDirectory(
                    currentDirectory
                );

            /*
             * On conserve le thème existant.
             * On ne remplace pas le HTML de
             * l'Explorer automatiquement.
             *
             * Les fichiers réels peuvent
             * maintenant être ouverts par
             * l'API GCODE.
             */

            console.log(
                "GCODE real files:",
                items
            );

        } catch (error) {
            console.error(error);
        }
    }

    /* =====================================================
       NOUVEAU FICHIER
    ===================================================== */

    async function newFile() {
        const name =
            prompt(
                "Nom du nouveau fichier :"
            );

        if (!name) return;

        const path =
            joinPath(
                currentDirectory,
                name
            );

        try {

            if (projectOpened && FS) {
                await FS.writeFile(
                    path,
                    ""
                );
            }

            files[path] = {
                language:
                    getLanguage(name),
                content: ""
            };

            openTabs.push(path);

            await openFile(path);

            connectExistingFiles();

            setStatus(
                `Créé : ${name}`
            );

        } catch (error) {
            console.error(error);

            setStatus(
                "Impossible de créer le fichier"
            );
        }
    }

    /* =====================================================
       NOUVEAU DOSSIER
    ===================================================== */

    async function newFolder() {
        const name =
            prompt(
                "Nom du nouveau dossier :"
            );

        if (!name) return;

        const path =
            joinPath(
                currentDirectory,
                name
            );

        try {

            if (projectOpened && FS) {
                await FS.createDirectory(
                    path
                );
            }

            setStatus(
                `Dossier créé : ${name}`
            );

            await refreshRealExplorer();

        } catch (error) {
            console.error(error);

            setStatus(
                "Impossible de créer le dossier"
            );
        }
    }

    /* =====================================================
       RENOMMER
    ===================================================== */

    async function renameFile() {
        if (!activeFile || !FS) return;

        const oldName =
            fileName(activeFile);

        const newName =
            prompt(
                "Nouveau nom :",
                oldName
            );

        if (
            !newName ||
            newName === oldName
        ) {
            return;
        }

        const newPath =
            joinPath(
                parentPath(activeFile),
                newName
            );

        try {

            await FS.renameFile(
                activeFile,
                newPath
            );

            files[newPath] =
                files[activeFile];

            delete files[activeFile];

            const index =
                openTabs.indexOf(
                    activeFile
                );

            if (index !== -1) {
                openTabs[index] =
                    newPath;
            }

            activeFile =
                newPath;

            saveTabs();

            renderEditor(
                newPath
            );

            setStatus(
                `Renommé : ${newName}`
            );

        } catch (error) {
            console.error(error);

            setStatus(
                "Impossible de renommer"
            );
        }
    }

    /* =====================================================
       SUPPRIMER
    ===================================================== */

    async function deleteFile() {
        if (!activeFile) return;

        const name =
            fileName(activeFile);

        if (
            !confirm(
                `Supprimer "${name}" ?`
            )
        ) {
            return;
        }

        try {

            if (projectOpened && FS) {
                await FS.deletePath(
                    activeFile
                );
            }

            delete files[activeFile];

            closeTab(
                activeFile
            );

            saveLocalFiles();

            setStatus(
                `Supprimé : ${name}`
            );

        } catch (error) {
            console.error(error);

            setStatus(
                "Impossible de supprimer"
            );
        }
    }

    /* =====================================================
       IMPORT
    ===================================================== */

    function importFiles() {
        const input =
            document.createElement(
                "input"
            );

        input.type = "file";
        input.multiple = true;

        input.addEventListener(
            "change",
            async () => {

                for (
                    const file
                    of Array.from(
                        input.files || []
                    )
                ) {

                    try {

                        const content =
                            await file.text();

                        const path =
                            joinPath(
                                currentDirectory,
                                file.name
                            );

                        if (
                            projectOpened &&
                            FS
                        ) {
                            await FS.writeFile(
                                path,
                                content
                            );
                        }

                        files[path] = {
                            language:
                                getLanguage(
                                    file.name
                                ),
                            content
                        };

                        await openFile(
                            path
                        );

                    } catch (error) {
                        console.error(
                            error
                        );
                    }
                }

                setStatus(
                    "Import terminé"
                );
            }
        );

        input.click();
    }

    /* =====================================================
       EXPORT
    ===================================================== */

    async function exportFile() {
        if (!activeFile) return;

        const content =
            files[activeFile]?.content ||
            "";

        if (
            FS?.exportFile
        ) {
            await FS.exportFile(
                activeFile,
                content
            );

            setStatus(
                "Export terminé"
            );

            return;
        }

        const blob =
            new Blob(
                [content],
                {
                    type:
                        "text/plain;charset=utf-8"
                }
            );

        const url =
            URL.createObjectURL(
                blob
            );

        const link =
            document.createElement(
                "a"
            );

        link.href = url;
        link.download =
            fileName(activeFile);

        link.click();

        URL.revokeObjectURL(
            url
        );
    }

    /* =====================================================
       TERMINAL
    ===================================================== */

    function setupTerminal() {
        if (!terminal) return;

        terminalInput =
            terminal.querySelector(
                ".terminal-input"
            );

        if (!terminalInput) {
            terminalInput =
                document.createElement(
                    "span"
                );

            terminalInput.className =
                "terminal-input";

            terminalInput.contentEditable =
                "true";

            terminal.appendChild(
                terminalInput
            );
        }

        terminalInput.contentEditable =
            "true";

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
            "autocomplete",
            "off"
        );

        terminalInput.setAttribute(
            "inputmode",
            "text"
        );

        terminalInput.setAttribute(
            "role",
            "textbox"
        );

        terminalInput.setAttribute(
            "aria-label",
            "Terminal input"
        );

        terminalInput.style.webkitUserModify =
            "read-write";

        terminalInput.style.webkitUserSelect =
            "text";

        terminalInput.style.userSelect =
            "text";

        terminalInput.addEventListener(
            "click",
            () => {
                terminalInput.focus();
            }
        );

        terminalInput.addEventListener(
            "touchstart",
            () => {
                terminalInput.focus();
            },
            {
                passive: true
            }
        );

        terminalInput.addEventListener(
            "keydown",
            terminalKeyDown
        );

        /*
         * Sur iPhone, un clic dans le terminal
         * doit toujours donner le focus au champ.
         */
        terminal.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest(
                        ".terminal-input"
                    )
                ) {
                    terminalInput.focus();
                    return;
                }

                terminalInput.focus();
            }
        );
    }

    function terminalText() {
        return (
            terminalInput?.textContent ||
            ""
        );
    }

    function clearTerminalInput() {
        if (terminalInput) {
            terminalInput.textContent =
                "";
        }
    }

    function terminalPrint(text) {
        if (!terminal) return;

        const line =
            document.createElement(
                "div"
            );

        line.className =
            "terminal-line";

        line.textContent =
            String(text);

        terminal.appendChild(
            line
        );

        terminal.scrollTop =
            terminal.scrollHeight;
    }

    function terminalKeyDown(event) {

        if (
            event.key === "Enter"
        ) {
            event.preventDefault();

            const command =
                terminalText().trim();

            if (command) {
                terminalHistory.push(
                    command
                );

                terminalHistoryIndex =
                    terminalHistory.length;

                terminalPrint(
                    `> ${command}`
                );

                executeCommand(
                    command
                );
            }

            clearTerminalInput();

            setTimeout(
                () => terminalInput?.focus(),
                10
            );

            return;
        }

        if (
            event.key === "ArrowUp"
        ) {
            event.preventDefault();

            if (
                terminalHistory.length === 0
            ) {
                return;
            }

            terminalHistoryIndex =
                Math.max(
                    0,
                    terminalHistoryIndex - 1
                );

            terminalInput.textContent =
                terminalHistory[
                    terminalHistoryIndex
                ] || "";

            moveTerminalCaretEnd();

            return;
        }

        if (
            event.key === "ArrowDown"
        ) {
            event.preventDefault();

            if (
                terminalHistory.length === 0
            ) {
                return;
            }

            terminalHistoryIndex =
                Math.min(
                    terminalHistory.length,
                    terminalHistoryIndex + 1
                );

            terminalInput.textContent =
                terminalHistory[
                    terminalHistoryIndex
                ] || "";

            moveTerminalCaretEnd();
        }
    }

    function moveTerminalCaretEnd() {
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

            selection.addRange(
                range
            );
        } catch {}
    }

    async function executeCommand(command) {

        const cmd =
            command.trim();

        if (!cmd) return;

        const parts =
            cmd.split(/\s+/);

        const main =
            parts[0].toLowerCase();

        switch (main) {

            case "help":

                terminalPrint(
                    "GCODE Terminal"
                );

                terminalPrint(
                    "Commandes : help, clear, pwd, ls, cd, open, save"
                );

                break;

            case "clear":

                terminal.innerHTML = "";

                setupTerminal();

                break;

            case "pwd":

                terminalPrint(
                    projectOpened
                        ? `/${projectName}${currentDirectory === "/" ? "" : currentDirectory}`
                        : currentDirectory
                );

                break;

            case "ls":

                if (
                    projectOpened &&
                    FS
                ) {

                    try {

                        const items =
                            await FS.listDirectory(
                                currentDirectory
                            );

                        if (!items.length) {
                            terminalPrint(
                                "(dossier vide)"
                            );
                        }

                        items.forEach(
                            item => {
                                terminalPrint(
                                    item.kind ===
                                    "directory"
                                        ? `[DIR] ${item.name}`
                                        : item.name
                                );
                            }
                        );

                    } catch (error) {

                        terminalPrint(
                            `Erreur : ${error.message}`
                        );
                    }

                } else {

                    Object.keys(files)
                        .forEach(path => {
                            terminalPrint(
                                fileName(path)
                            );
                        });
                }

                break;

            case "cd":

                if (!parts[1]) {
                    currentDirectory =
                        "/";
                }

                else if (
                    parts[1] === ".."
                ) {
                    currentDirectory =
                        parentPath(
                            currentDirectory
                        );
                }

                else {
                    currentDirectory =
                        joinPath(
                            currentDirectory,
                            parts[1]
                        );
                }

                terminalPrint(
                    currentDirectory
                );

                break;

            case "open":

                if (parts[1]) {

                    const path =
                        normalizePath(
                            parts[1]
                        );

                    await openFile(
                        path
                    );

                    terminalPrint(
                        `Ouverture : ${path}`
                    );

                } else {
                    terminalPrint(
                        "Utilisation : open fichier"
                    );
                }

                break;

            case "save":

                await saveFile();

                terminalPrint(
                    "Fichier sauvegardé."
                );

                break;

            default:

                terminalPrint(
                    `Commande inconnue : ${cmd}`
                );

                terminalPrint(
                    "Tapez help pour afficher les commandes."
                );
        }
    }

    /* =====================================================
       RECHERCHE
    ===================================================== */

    function openSearch() {

        if (searchOverlay) {
            searchOverlay.remove();
        }

        searchOverlay =
            document.createElement(
                "div"
            );

        searchOverlay.style.position =
            "fixed";

        searchOverlay.style.inset =
            "0";

        searchOverlay.style.zIndex =
            "99999";

        searchOverlay.style.background =
            "rgba(0,0,0,.45)";

        const box =
            document.createElement(
                "div"
            );

        box.style.position =
            "absolute";

        box.style.top =
            "20%";

        box.style.left =
            "50%";

        box.style.transform =
            "translateX(-50%)";

        box.style.width =
            "min(600px,90vw)";

        box.style.padding =
            "12px";

        box.style.background =
            "#1e1e1e";

        const input =
            document.createElement(
                "input"
            );

        input.type = "search";
        input.placeholder =
            "Rechercher dans GCODE...";

        input.style.width =
            "100%";

        input.style.boxSizing =
            "border-box";

        input.style.padding =
            "12px";

        input.style.background =
            "#252526";

        input.style.color =
            "#fff";

        input.style.border =
            "1px solid #555";

        box.appendChild(
            input
        );

        searchOverlay.appendChild(
            box
        );

        document.body.appendChild(
            searchOverlay
        );

        input.focus();

        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape"
                ) {
                    searchOverlay.remove();
                    searchOverlay = null;
                }

                if (
                    event.key === "Enter"
                ) {
                    performSearch(
                        input.value
                    );
                }
            }
        );

        searchOverlay.addEventListener(
            "click",
            event => {
                if (
                    event.target ===
                    searchOverlay
                ) {
                    searchOverlay.remove();
                    searchOverlay = null;
                }
            }
        );
    }

    function performSearch(query) {

        const q =
            String(query || "")
                .trim()
                .toLowerCase();

        if (!q) return;

        const results = [];

        Object.entries(files)
            .forEach(
                ([path, data]) => {

                    const content =
                        data.content || "";

                    const index =
                        content
                            .toLowerCase()
                            .indexOf(q);

                    if (index !== -1) {

                        const before =
                            content.slice(
                                0,
                                index
                            );

                        const line =
                            before.split(
                                "\n"
                            ).length;

                        results.push(
                            `${fileName(path)} : ligne ${line}`
                        );
                    }
                }
            );

        if (!results.length) {
            alert(
                `"${query}" introuvable.`
            );
        } else {
            alert(
                results.join("\n")
            );
        }

        searchOverlay?.remove();
        searchOverlay = null;
    }

    /* =====================================================
       MENUS
    ===================================================== */

    function createMenu(items) {

        closeMenu();

        menuOverlay =
            document.createElement(
                "div"
            );

        menuOverlay.style.position =
            "fixed";

        menuOverlay.style.inset =
            "0";

        menuOverlay.style.zIndex =
            "99998";

        menuOverlay.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    menuOverlay
                ) {
                    closeMenu();
                }
            }
        );

        const menu =
            document.createElement(
                "div"
            );

        menu.style.position =
            "absolute";

        menu.style.top =
            "48px";

        menu.style.left =
            "10px";

        menu.style.minWidth =
            "220px";

        menu.style.background =
            "#252526";

        menu.style.border =
            "1px solid #454545";

        menu.style.boxShadow =
            "0 8px 25px rgba(0,0,0,.5)";

        items.forEach(item => {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.textContent =
                item.label;

            button.style.display =
                "block";

            button.style.width =
                "100%";

            button.style.padding =
                "10px 14px";

            button.style.textAlign =
                "left";

            button.style.background =
                "transparent";

            button.style.color =
                "#ddd";

            button.style.border =
                "0";

            button.addEventListener(
                "click",
                () => {

                    closeMenu();

                    item.action();
                }
            );

            menu.appendChild(
                button
            );
        });

        menuOverlay.appendChild(
            menu
        );

        document.body.appendChild(
            menuOverlay
        );
    }

    function closeMenu() {
        if (menuOverlay) {
            menuOverlay.remove();
            menuOverlay = null;
        }
    }

    function openFileMenu() {
        createMenu([
            {
                label: "New File",
                action: newFile
            },
            {
                label: "New Folder",
                action: newFolder
            },
            {
                label: "Open Folder",
                action: openProject
            },
            {
                label: "Import",
                action: importFiles
            },
            {
                label: "Export",
                action: exportFile
            },
            {
                label: "Save",
                action: saveFile
            }
        ]);
    }

    function openEditMenu() {
        createMenu([
            {
                label: "Undo",
                action: undo
            },
            {
                label: "Redo",
                action: redo
            },
            {
                label: "Rename",
                action: renameFile
            },
            {
                label: "Delete",
                action: deleteFile
            }
        ]);
    }

    function openSelectionMenu() {
        createMenu([
            {
                label: "Select All",
                action: () => {
                    codeDisplay.focus();

                    const range =
                        document.createRange();

                    range.selectNodeContents(
                        codeDisplay
                    );

                    const selection =
                        window.getSelection();

                    selection.removeAllRanges();
                    selection.addRange(
                        range
                    );
                }
            },
            {
                label: "Search",
                action: openSearch
            }
        ]);
    }

    function openViewMenu() {
        createMenu([
            {
                label: "Explorer",
                action: () =>
                    activatePanel(
                        "explorer"
                    )
            },
            {
                label: "Search",
                action: openSearch
            },
            {
                label: "Terminal",
                action: showBottomPanel
            }
        ]);
    }

    function openGoMenu() {
        createMenu([
            {
                label: "Back",
                action: () =>
                    history.back()
            },
            {
                label: "Forward",
                action: () =>
                    history.forward()
            },
            {
                label: "Search",
                action: openSearch
            }
        ]);
    }

    /* =====================================================
       ACTIVITY BAR
    ===================================================== */

    function activatePanel(name) {

        document
            .querySelectorAll(
                ".activity-item"
            )
            .forEach(button => {

                button.classList.toggle(
                    "active",
                    button.dataset.panel ===
                    name
                );
            });

        if (name === "explorer") {
            if (sidebar) {
                sidebar.style.display =
                    "";
            }
        }

        if (name === "search") {
            openSearch();
        }

        if (name === "source") {
            alert(
                "Source Control : panneau prêt pour l'intégration Git."
            );
        }

        if (name === "run") {
            runCurrentFile();
        }

        if (name === "extensions") {
            alert(
                "Extensions : gestionnaire d'extensions GCODE."
            );
        }
    }

    /* =====================================================
       RUN
    ===================================================== */

    function runCurrentFile() {

        if (!activeFile) {
            setStatus(
                "Aucun fichier à exécuter"
            );
            return;
        }

        const lang =
            getLanguage(
                fileName(activeFile)
            );

        if (
            lang === "HTML"
        ) {
            previewHTML();
            return;
        }

        if (
            lang === "JavaScript"
        ) {
            try {
                const result =
                    Function(
                        files[activeFile]
                            .content
                    )();

                terminalPrint(
                    String(
                        result ??
                        "JavaScript exécuté."
                    )
                );

            } catch (error) {

                terminalPrint(
                    `Erreur JS : ${error.message}`
                );
            }

            return;
        }

        terminalPrint(
            `Run : ${fileName(activeFile)}`
        );
    }

    function previewHTML() {

        const html =
            files[activeFile]?.content;

        if (!html) return;

        const win =
            window.open(
                "",
                "_blank"
            );

        if (!win) {
            alert(
                "Autorise les fenêtres contextuelles pour le preview."
            );
            return;
        }

        win.document.open();

        win.document.write(
            html
        );

        win.document.close();
    }

    /* =====================================================
       PANNEAU BAS
    ===================================================== */

    function showBottomPanel() {

        if (!bottomPanel) return;

        bottomPanel.style.display =
            "";

        bottomPanel.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });

        setTimeout(
            () => terminalInput?.focus(),
            100
        );
    }

    function connectPanelTabs() {

        document
            .querySelectorAll(
                ".panel-tab"
            )
            .forEach(tab => {

                tab.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".panel-tab"
                            )
                            .forEach(
                                t =>
                                    t.classList.remove(
                                        "active"
                                    )
                            );

                        tab.classList.add(
                            "active"
                        );

                        const name =
                            tab.textContent
                                .trim();

                        setStatus(
                            name
                        );

                        if (
                            name ===
                            "TERMINAL"
                        ) {
                            setupTerminal();

                            setTimeout(
                                () =>
                                    terminalInput?.focus(),
                                80
                            );
                        }
                    }
                );
            });
    }

    /* =====================================================
       BOUTONS TOP BAR
    ===================================================== */

    function connectTopButtons() {

        const menuButtons =
            document.querySelectorAll(
                ".menu-button"
            );

        menuButtons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const text =
                            button.textContent
                                .trim();

                        switch (text) {

                            case "File":
                                openFileMenu();
                                break;

                            case "Edit":
                                openEditMenu();
                                break;

                            case "Selection":
                                openSelectionMenu();
                                break;

                            case "View":
                                openViewMenu();
                                break;

                            case "Go":
                                openGoMenu();
                                break;

                            case "•••":
                                openFileMenu();
                                break;
                        }
                    }
                );
            }
        );

        if (commandSearch) {

            commandSearch.addEventListener(
                "click",
                openSearch
            );

            commandSearch.setAttribute(
                "role",
                "button"
            );

            commandSearch.setAttribute(
                "tabindex",
                "0"
            );

            commandSearch.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                        "Enter" ||
                        event.key === " "
                    ) {
                        event.preventDefault();
                        openSearch();
                    }
                }
            );
        }

        if (backBtn) {
            backBtn.addEventListener(
                "click",
                () => {
                    history.back();
                }
            );
        }

        if (forwardBtn) {
            forwardBtn.addEventListener(
                "click",
                () => {
                    history.forward();
                }
            );
        }

        if (closeWindow) {
            closeWindow.addEventListener(
                "click",
                () => {

                    if (
                        confirm(
                            "Fermer GCODE ?"
                        )
                    ) {
                        window.close();

                        setStatus(
                            "GCODE prêt à être fermé"
                        );
                    }
                }
            );
        }
    }

    /* =====================================================
       TOP ACTIONS
    ===================================================== */

    function connectTopActions() {

        const buttons =
            document.querySelectorAll(
                ".top-actions button"
            );

        buttons.forEach(
            (button, index) => {

                button.addEventListener(
                    "click",
                    () => {

                        if (index === 0) {
                            toggleSplit();
                        }

                        else if (index === 1) {
                            setStatus(
                                "Layout"
                            );
                        }

                        else if (index === 2) {
                            showBottomPanel();
                        }
                    }
                );
            }
        );
    }

    function toggleSplit() {
        if (!codeEditor) return;

        codeEditor.classList.toggle(
            "gcode-split-active"
        );

        setStatus(
            "Split editor"
        );
    }

    /* =====================================================
       SIDEBAR MORE
    ===================================================== */

    function connectSidebarMore() {

        const button =
            document.querySelector(
                ".sidebar-more"
            );

        if (!button) return;

        button.addEventListener(
            "click",
            () => {

                createMenu([
                    {
                        label: "New File",
                        action: newFile
                    },
                    {
                        label: "New Folder",
                        action: newFolder
                    },
                    {
                        label: "Open Folder",
                        action: openProject
                    },
                    {
                        label: "Refresh",
                        action: refreshRealExplorer
                    }
                ]);
            }
        );
    }

    /* =====================================================
       ACTIVITY BUTTONS
    ===================================================== */

    function connectActivityBar() {

        document
            .querySelectorAll(
                ".activity-item[data-panel]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            activatePanel(
                                button.dataset.panel
                            );
                        }
                    );
                }
            );

        const settings =
            Array.from(
                document.querySelectorAll(
                    ".activity-item"
                )
            )
            .find(
                item =>
                    item.textContent
                        .includes(
                            "Settings"
                        )
            );

        if (settings) {
            settings.addEventListener(
                "click",
                () => {
                    alert(
                        "GCODE Settings"
                    );
                }
            );
        }

        const account =
            Array.from(
                document.querySelectorAll(
                    ".activity-item"
                )
            )
            .find(
                item =>
                    item.textContent
                        .includes(
                            "Account"
                        )
            );

        if (account) {
            account.addEventListener(
                "click",
                () => {
                    alert(
                        "GCODE Account"
                    );
                }
            );
        }
    }

    /* =====================================================
       WORKSPACE
    ===================================================== */

    function connectWorkspace() {

        const workspace =
            document.querySelector(
                ".workspace-title"
            );

        if (!workspace) return;

        workspace.addEventListener(
            "click",
            () => {

                const arrow =
                    workspace.querySelector(
                        ".arrow"
                    );

                const tree =
                    fileTree;

                if (!tree) return;

                const hidden =
                    tree.style.display ===
                    "none";

                tree.style.display =
                    hidden
                        ? ""
                        : "none";

                if (arrow) {
                    arrow.textContent =
                        hidden
                            ? "⌄"
                            : "›";
                }
            }
        );
    }

    /* =====================================================
       RACCOURCIS GLOBAUX
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            const modifier =
                event.ctrlKey ||
                event.metaKey;

            if (
                modifier &&
                event.key.toLowerCase() ===
                "s"
            ) {
                event.preventDefault();

                saveFile();

                return;
            }

            if (
                modifier &&
                event.key.toLowerCase() ===
                "o"
            ) {
                event.preventDefault();

                openProject();

                return;
            }

            if (
                modifier &&
                event.key.toLowerCase() ===
                "n"
            ) {
                event.preventDefault();

                newFile();

                return;
            }

            if (
                modifier &&
                event.key.toLowerCase() ===
                "f"
            ) {
                event.preventDefault();

                openSearch();

                return;
            }

            if (
                event.key === "Escape"
            ) {
                closeMenu();

                if (searchOverlay) {
                    searchOverlay.remove();
                    searchOverlay = null;
                }
            }
        }
    );

    /* =====================================================
       FILE SYSTEM EVENTS
    ===================================================== */

    if (FS?.on) {

        FS.on(
            "save",
            data => {

                if (data?.path) {
                    setStatus(
                        `Sauvegardé : ${fileName(
                            data.path
                        )}`
                    );
                }
            }
        );

        FS.on(
            "error",
            error => {

                console.error(
                    "GCODE FS:",
                    error
                );
            }
        );

        FS.on(
            "open",
            data => {

                projectOpened = true;

                projectName =
                    data?.name ||
                    "GCODE";
            }
        );
    }

    /* =====================================================
       INITIALISATION DES FICHIERS
    ===================================================== */

    function initializeFiles() {

        files =
            loadLocalFiles();

        openTabs =
            loadTabs();

        activeFile =
            localStorage.getItem(
                ACTIVE_FILE_KEY
            );

        /*
         * Si aucun onglet valide n'existe,
         * utiliser style.css comme dans
         * l'interface actuelle.
         */

        openTabs =
            openTabs.filter(
                path =>
                    files[path] ||
                    projectOpened
            );

        if (
            !activeFile ||
            (
                !files[activeFile] &&
                !projectOpened
            )
        ) {
            activeFile =
                openTabs[0] ||
                "/style.css";
        }

        if (
            !openTabs.includes(
                activeFile
            )
        ) {
            openTabs.push(
                activeFile
            );
        }
    }

    /* =====================================================
       INITIALISATION
    ===================================================== */

    async function initialize() {

        console.log(
            "GCODE V3 : initialisation..."
        );

        configureEditor();

        initializeFiles();

        connectExistingFiles();
        connectFolders();

        connectTopButtons();
        connectTopActions();
        connectSidebarMore();
        connectActivityBar();
        connectWorkspace();

        connectPanelTabs();

        setupTerminal();

        renderTabs();

        if (
            activeFile &&
            files[activeFile]
        ) {
            renderEditor(
                activeFile
            );
        }

        updateTreeSelection();

        if (
            FS &&
            FS.hasRealProject &&
            FS.hasRealProject()
        ) {
            projectOpened = true;

            projectName =
                FS.getProjectName();

            await refreshRealExplorer();
        }

        setStatus(
            projectOpened
                ? `Projet : ${projectName}`
                : "GCODE prêt"
        );

        console.log(
            "GCODE V3 : système prêt."
        );
    }

    /* =====================================================
       API PUBLIQUE
    ===================================================== */

    window.GCODE = {

        openProject,

        openFile,

        newFile,

        newFolder,

        saveFile,

        deleteFile,

        renameFile,

        importFiles,

        exportFile,

        undo,

        redo,

        openSearch,

        runCurrentFile,

        executeCommand,

        refreshExplorer:
            refreshRealExplorer,

        getActiveFile() {
            return activeFile;
        },

        getProjectName() {
            return projectName;
        }
    };

    /* =====================================================
       START
    ===================================================== */

    initialize();

})();
