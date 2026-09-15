/* =========================================================
   GCODE
   REAL EDITOR CONTROLLER
   Interface conservée — fonctionnalités branchées
========================================================= */

(() => {
    "use strict";

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const sidebar = document.getElementById("sidebar");
    const editorTabs = document.getElementById("editorTabs");
    const codeDisplay = document.getElementById("codeDisplay");
    const breadcrumbFile = document.getElementById("breadcrumbFile");
    const lineNumbers = document.getElementById("lineNumbers");
    const language = document.getElementById("language");
    const cursorPosition = document.getElementById("cursorPosition");
    const codeEditor = document.getElementById("codeEditor");
    const terminal = document.getElementById("terminal");

    const backBtn = document.getElementById("backBtn");
    const forwardBtn = document.getElementById("forwardBtn");
    const closeWindow = document.getElementById("closeWindow");

    if (!codeDisplay || !editorTabs || !lineNumbers) {
        console.error("GCODE: éléments principaux introuvables.");
        return;
    }

    /* =====================================================
       STORAGE
    ===================================================== */

    const STORAGE_KEY = "GCODE_WORKSPACE_V3";
    const OPEN_TABS_KEY = "GCODE_OPEN_TABS_V3";
    const ACTIVE_FILE_KEY = "GCODE_ACTIVE_FILE_V3";

    /* =====================================================
       DEFAULT FILES
    ===================================================== */

    const defaultFiles = {
        "index.html": {
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

        "style.css": {
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

        "script.js": {
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

        "package.json": {
            language: "JSON",
            content: `{
    "name": "gcode",
    "version": "3.0.0",
    "private": true
}`
        },

        "README.md": {
            language: "Markdown",
            content: `# GCODE

GCODE est un éditeur de code inspiré des environnements modernes.

## Version

3.0.0`
        },

        ".env": {
            language: "Plain Text",
            content: `# Variables locales GCODE`
        },

        ".gitignore": {
            language: "Git",
            content: `node_modules/
dist/
build/
.env.local`
        }
    };

    /* =====================================================
       STATE
    ===================================================== */

    let files = loadFiles();

    let openTabs = loadOpenTabs();

    let activeFile = localStorage.getItem(ACTIVE_FILE_KEY);

    let history = [];
    let historyIndex = -1;

    let suppressHistory = false;

    /* =====================================================
       HELPERS
    ===================================================== */

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function loadFiles() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (!saved) {
                return clone(defaultFiles);
            }

            const parsed = JSON.parse(saved);

            if (!parsed || typeof parsed !== "object") {
                return clone(defaultFiles);
            }

            return {
                ...clone(defaultFiles),
                ...parsed
            };
        } catch (error) {
            console.warn("GCODE: impossible de charger le workspace.", error);
            return clone(defaultFiles);
        }
    }

    function saveFiles() {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(files)
        );
    }

    function loadOpenTabs() {
        try {
            const saved = JSON.parse(
                localStorage.getItem(OPEN_TABS_KEY)
            );

            if (Array.isArray(saved) && saved.length) {
                return saved.filter(name => filesExist(name));
            }
        } catch (error) {
            console.warn(error);
        }

        return ["style.css", "index.html"];
    }

    function saveOpenTabs() {
        localStorage.setItem(
            OPEN_TABS_KEY,
            JSON.stringify(openTabs)
        );
    }

    function filesExist(fileName) {
        return Object.prototype.hasOwnProperty.call(
            files,
            fileName
        );
    }

    function getLanguage(fileName) {
        const extension =
            fileName.split(".").pop().toLowerCase();

        const map = {
            html: "HTML",
            htm: "HTML",
            css: "CSS",
            js: "JavaScript",
            jsx: "JavaScript React",
            ts: "TypeScript",
            tsx: "TypeScript React",
            json: "JSON",
            md: "Markdown",
            txt: "Plain Text",
            xml: "XML",
            svg: "SVG",
            py: "Python",
            java: "Java",
            c: "C",
            cpp: "C++",
            h: "C/C++",
            php: "PHP",
            sql: "SQL",
            sh: "Shell",
            yml: "YAML",
            yaml: "YAML",
            gitignore: "Git",
            env: "Environment"
        };

        return map[extension] || "Plain Text";
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* =====================================================
       SYNTAX HIGHLIGHTING
    ===================================================== */

    function highlightCode(code, fileName) {
        const lang = getLanguage(fileName);

        let escaped = escapeHtml(code);

        if (lang === "HTML" || lang === "XML") {
            escaped = escaped
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
            escaped = escaped
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
                )
                .replace(
                    /(:\s*)([^;{}\n]+)/g,
                    '$1<span class="value">$2</span>'
                );
        }

        else if (
            lang === "JavaScript" ||
            lang === "TypeScript" ||
            lang.includes("React")
        ) {
            escaped = escaped
                .replace(
                    /(\/\/.*)$/gm,
                    '<span class="comment">$1</span>'
                )
                .replace(
                    /(&quot;.*?&quot;|'[^']*'|`[^`]*`)/g,
                    '<span class="value">$1</span>'
                )
                .replace(
                    /\b(const|let|var|function|return|if|else|for|while|class|new|import|from|export|default|async|await)\b/g,
                    '<span class="selector">$1</span>'
                )
                .replace(
                    /\b([a-zA-Z_$][\w$]*)\s*(?=\()/g,
                    '<span class="property">$1</span>'
                );
        }

        else if (lang === "JSON") {
            escaped = escaped
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
            escaped = escaped
                .replace(
                    /^(#{1,6} .*)$/gm,
                    '<span class="selector">$1</span>'
                )
                .replace(
                    /(`[^`]+`)/g,
                    '<span class="value">$1</span>'
                );
        }

        return escaped;
    }

    /* =====================================================
       EDITOR
    ===================================================== */

    function makeEditorEditable() {
        codeDisplay.setAttribute("contenteditable", "true");
        codeDisplay.setAttribute("spellcheck", "false");
        codeDisplay.setAttribute("autocorrect", "off");
        codeDisplay.setAttribute("autocapitalize", "off");

        codeDisplay.style.outline = "none";
        codeDisplay.style.whiteSpace = "pre";
    }

    function getEditorText() {
        return codeDisplay.innerText
            .replace(/\r\n/g, "\n");
    }

    function renderEditor(fileName, moveCaret = false) {
        if (!filesExist(fileName)) {
            return;
        }

        const file = files[fileName];

        activeFile = fileName;

        breadcrumbFile.textContent = fileName;

        language.textContent =
            file.language || getLanguage(fileName);

        codeDisplay.innerHTML =
            highlightCode(file.content, fileName);

        updateLineNumbers(file.content);

        updateActiveTab(fileName);

        updateSelectedTreeItem(fileName);

        updateCursor();

        if (moveCaret) {
            placeCaretAtEnd();
        }
    }

    function updateLineNumbers(content) {
        const lines =
            String(content).split("\n").length;

        lineNumbers.innerHTML = "";

        for (
            let index = 1;
            index <= Math.max(lines, 20);
            index++
        ) {
            const span =
                document.createElement("span");

            span.textContent = index;

            lineNumbers.appendChild(span);
        }
    }

    function updateCursor() {
        const selection =
            window.getSelection();

        if (!selection || !selection.rangeCount) {
            return;
        }

        const range =
            selection.getRangeAt(0);

        if (!codeDisplay.contains(range.startContainer)) {
            return;
        }

        const textBefore =
            getTextBeforeCaret(range);

        const line =
            textBefore.split("\n").length;

        const lastLine =
            textBefore.split("\n").pop() || "";

        const column =
            lastLine.length + 1;

        if (cursorPosition) {
            cursorPosition.textContent =
                `Ln ${line}, Col ${column}`;
        }
    }

    function getTextBeforeCaret(range) {
        const cloned =
            range.cloneRange();

        cloned.selectNodeContents(codeDisplay);
        cloned.setEnd(
            range.startContainer,
            range.startOffset
        );

        return cloned.toString();
    }

    function placeCaretAtEnd() {
        try {
            const range =
                document.createRange();

            range.selectNodeContents(codeDisplay);
            range.collapse(false);

            const selection =
                window.getSelection();

            selection.removeAllRanges();
            selection.addRange(range);

            updateCursor();
        } catch (error) {
            console.warn(error);
        }
    }

    /* =====================================================
       SAVE CURRENT EDIT
    ===================================================== */

    function saveCurrentEditor() {
        if (!activeFile || !filesExist(activeFile)) {
            return;
        }

        const newContent = getEditorText();

        if (files[activeFile].content === newContent) {
            return;
        }

        files[activeFile].content = newContent;

        saveFiles();

        updateLineNumbers(newContent);

        updateHistory(activeFile, newContent);

        markTabSaved(activeFile);
    }

    function markTabSaved(fileName) {
        const tab =
            document.querySelector(
                `.editor-tab[data-file="${CSS.escape(fileName)}"]`
            );

        if (!tab) {
            return;
        }

        const close =
            tab.querySelector(".tab-close");

        if (close) {
            close.textContent = "×";
        }

        tab.classList.remove("modified");
    }

    /* =====================================================
       INPUT
    ===================================================== */

    codeDisplay.addEventListener("input", () => {
        if (!activeFile || !filesExist(activeFile)) {
            return;
        }

        const content = getEditorText();

        files[activeFile].content = content;

        saveFiles();

        updateLineNumbers(content);

        markTabModified(activeFile);

        updateCursor();
    });

    codeDisplay.addEventListener("keyup", updateCursor);
    codeDisplay.addEventListener("mouseup", updateCursor);

    codeDisplay.addEventListener("keydown", event => {
        if (event.key === "Tab") {
            event.preventDefault();

            document.execCommand(
                "insertText",
                false,
                "    "
            );

            return;
        }

        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "s"
        ) {
            event.preventDefault();

            saveCurrentEditor();

            showNotification(
                `${activeFile} enregistré`
            );
        }
    });

    function markTabModified(fileName) {
        const tab =
            document.querySelector(
                `.editor-tab[data-file="${CSS.escape(fileName)}"]`
            );

        if (!tab) {
            return;
        }

        tab.classList.add("modified");

        const close =
            tab.querySelector(".tab-close");

        if (close) {
            close.textContent = "●";
        }
    }

    /* =====================================================
       OPEN FILE
    ===================================================== */

    function openFile(fileName, addHistory = true) {
        if (!filesExist(fileName)) {
            return;
        }

        if (!openTabs.includes(fileName)) {
            openTabs.push(fileName);
        }

        saveOpenTabs();

        if (
            addHistory &&
            !suppressHistory
        ) {
            history =
                history.slice(0, historyIndex + 1);

            history.push(fileName);

            historyIndex =
                history.length - 1;
        }

        renderTabs();

        renderEditor(fileName);

        localStorage.setItem(
            ACTIVE_FILE_KEY,
            fileName
        );
    }

    /* =====================================================
       TABS
    ===================================================== */

    function renderTabs() {
        editorTabs.innerHTML = "";

        openTabs.forEach(fileName => {
            if (!filesExist(fileName)) {
                return;
            }

            const tab =
                document.createElement("div");

            tab.className =
                "editor-tab";

            if (fileName === activeFile) {
                tab.classList.add("active");
            }

            tab.dataset.file = fileName;

            const icon =
                document.createElement("span");

            icon.className =
                "tab-file-icon " +
                getIconClass(fileName);

            icon.textContent =
                getFileIcon(fileName);

            const name =
                document.createElement("span");

            name.className = "tab-name";
            name.textContent = fileName;

            const close =
                document.createElement("button");

            close.className = "tab-close";
            close.type = "button";
            close.textContent = "×";

            tab.appendChild(icon);
            tab.appendChild(name);
            tab.appendChild(close);

            tab.addEventListener(
                "click",
                event => {
                    if (
                        event.target === close
                    ) {
                        closeTab(fileName);
                        return;
                    }

                    openFile(fileName);
                }
            );

            editorTabs.appendChild(tab);
        });
    }

    function closeTab(fileName) {
        const index =
            openTabs.indexOf(fileName);

        if (index === -1) {
            return;
        }

        openTabs.splice(index, 1);

        saveOpenTabs();

        if (activeFile === fileName) {
            const nextFile =
                openTabs[index] ||
                openTabs[index - 1] ||
                openTabs[0];

            if (nextFile) {
                openFile(nextFile);
            } else {
                activeFile = null;

                codeDisplay.innerHTML = "";

                breadcrumbFile.textContent = "";

                language.textContent =
                    "Plain Text";

                updateLineNumbers("");
            }
        }

        renderTabs();
    }

    function updateActiveTab(fileName) {
        document
            .querySelectorAll(".editor-tab")
            .forEach(tab => {
                tab.classList.toggle(
                    "active",
                    tab.dataset.file === fileName
                );
            });
    }

    /* =====================================================
       FILE TREE
    ===================================================== */

    function updateSelectedTreeItem(fileName) {
        document
            .querySelectorAll(".tree-item.file")
            .forEach(item => {
                item.classList.toggle(
                    "selected",
                    item.dataset.file === fileName
                );
            });
    }

    document
        .querySelectorAll(".tree-item.file")
        .forEach(item => {
            item.addEventListener(
                "click",
                () => {
                    const fileName =
                        item.dataset.file;

                    if (fileName) {
                        openFile(fileName);
                    }
                }
            );
        });

    function rebuildFileTree() {
        const tree =
            document.querySelector(".file-tree");

        if (!tree) {
            return;
        }

        const existing =
            Array.from(
                tree.querySelectorAll(
                    ".tree-item.file"
                )
            );

        existing.forEach(item => {
            item.remove();
        });

        Object.keys(files)
            .sort((a, b) =>
                a.localeCompare(b)
            )
            .forEach(fileName => {
                const item =
                    document.createElement("div");

                item.className =
                    "tree-item file";

                item.dataset.file =
                    fileName;

                const indent =
                    document.createElement("span");

                indent.className =
                    "file-indent";

                const icon =
                    document.createElement("span");

                icon.className =
                    "file-symbol " +
                    getIconClass(fileName);

                icon.textContent =
                    getFileIcon(fileName);

                const label =
                    document.createElement("span");

                label.textContent =
                    fileName;

                item.appendChild(indent);
                item.appendChild(icon);
                item.appendChild(label);

                item.addEventListener(
                    "click",
                    () => openFile(fileName)
                );

                tree.appendChild(item);
            });

        updateSelectedTreeItem(activeFile);
    }

    function getIconClass(fileName) {
        const ext =
            fileName.includes(".")
                ? fileName.split(".").pop().toLowerCase()
                : "";

        if (fileName === "index.html" || ext === "html") {
            return "html-symbol";
        }

        if (ext === "css") {
            return "css-symbol";
        }

        if (ext === "js") {
            return "js-symbol";
        }

        if (ext === "json") {
            return "json-symbol";
        }

        if (ext === "md") {
            return "md-symbol";
        }

        return "file-symbol";
    }

    function getFileIcon(fileName) {
        const ext =
            fileName.includes(".")
                ? fileName.split(".").pop().toLowerCase()
                : "";

        if (ext === "html") return "</>";
        if (ext === "css") return "#";
        if (ext === "js") return "JS";
        if (ext === "json") return "{ }";
        if (ext === "md") return "▤";

        return "◇";
    }

    /* =====================================================
       FOLDERS
    ===================================================== */

    document
        .querySelectorAll(".tree-item.folder")
        .forEach(folder => {
            folder.addEventListener(
                "click",
                event => {
                    event.stopPropagation();

                    const arrow =
                        folder.querySelector(
                            ".arrow"
                        );

                    if (!arrow) {
                        return;
                    }

                    arrow.textContent =
                        arrow.textContent === "›"
                            ? "⌄"
                            : "›";
                }
            );
        });

    /* =====================================================
       ACTIVITY BAR
    ===================================================== */

    document
        .querySelectorAll(".activity-item")
        .forEach(item => {
            item.addEventListener(
                "click",
                () => {
                    document
                        .querySelectorAll(
                            ".activity-item"
                        )
                        .forEach(button => {
                            button.classList.remove(
                                "active"
                            );
                        });

                    item.classList.add("active");

                    const panel =
                        item.dataset.panel;

                    if (panel === "explorer") {
                        restoreExplorer();
                    }

                    if (
                        panel === "search" ||
                        panel === "source" ||
                        panel === "run" ||
                        panel === "extensions"
                    ) {
                        showPanel(panel);
                    }
                }
            );
        });

    function restoreExplorer() {
        if (!sidebar) {
            return;
        }

        sidebar.innerHTML = `
            <div class="sidebar-header">
                <span>EXPLORER</span>
                <button class="sidebar-more">•••</button>
            </div>

            <div class="workspace-section">
                <div class="workspace-title">
                    <span class="arrow opened">›</span>
                    <span class="workspace-name">GCODE</span>
                </div>

                <div class="file-tree"></div>
            </div>

            <div class="sidebar-bottom">
                <div class="sidebar-section-title">
                    <span>›</span>
                    OUTLINE
                </div>

                <div class="sidebar-section-title">
                    <span>›</span>
                    TIMELINE
                </div>
            </div>
        `;

        rebuildFileTree();
    }

    function showPanel(type) {
        const titles = {
            search: "SEARCH",
            source: "SOURCE CONTROL",
            run: "RUN AND DEBUG",
            extensions: "EXTENSIONS"
        };

        const messages = {
            search: "Rechercher dans les fichiers",
            source: "Contrôle de source — Git sera connecté dans l'étape suivante.",
            run: "Exécution et débogage",
            extensions: "Extensions GCODE"
        };

        if (!sidebar || !titles[type]) {
            return;
        }

        sidebar.innerHTML = `
            <div class="sidebar-header">
                <span>${titles[type]}</span>
                <button class="sidebar-more">•••</button>
            </div>

            <div style="
                padding:20px;
                color:#888;
                font-size:12px;
            ">
                ${messages[type]}
            </div>
        `;

        if (type === "search") {
            createSearchPanel();
        }
    }

    /* =====================================================
       SEARCH
    ===================================================== */

    function createSearchPanel() {
        const container =
            sidebar.querySelector(
                "div[style]"
            );

        if (!container) {
            return;
        }

        container.innerHTML = `
            <input
                id="gcodeSearchInput"
                type="text"
                placeholder="Rechercher..."
                style="
                    width:100%;
                    box-sizing:border-box;
                    background:#252526;
                    color:#ddd;
                    border:1px solid #444;
                    padding:8px;
                    outline:none;
                "
            >

            <div
                id="gcodeSearchResults"
                style="margin-top:12px;"
            ></div>
        `;

        const input =
            document.getElementById(
                "gcodeSearchInput"
            );

        input.addEventListener(
            "input",
            () => searchFiles(input.value)
        );
    }

    function searchFiles(query) {
        const results =
            document.getElementById(
                "gcodeSearchResults"
            );

        if (!results) {
            return;
        }

        results.innerHTML = "";

        query = query.trim();

        if (!query) {
            return;
        }

        const lower =
            query.toLowerCase();

        Object.entries(files).forEach(
            ([fileName, file]) => {
                const lines =
                    file.content.split("\n");

                lines.forEach(
                    (line, index) => {
                        if (
                            line
                                .toLowerCase()
                                .includes(lower)
                        ) {
                            const result =
                                document.createElement(
                                    "div"
                                );

                            result.style.padding =
                                "6px 0";

                            result.style.cursor =
                                "pointer";

                            result.innerHTML =
                                `<strong>${escapeHtml(fileName)}</strong>
                                <br>
                                <span style="color:#777;">
                                    ${index + 1}: ${escapeHtml(line.trim())}
                                </span>`;

                            result.addEventListener(
                                "click",
                                () => {
                                    openFile(fileName);
                                }
                            );

                            results.appendChild(
                                result
                            );
                        }
                    }
                );
            }
        );
    }

    /* =====================================================
       COMMAND PALETTE
    ===================================================== */

    const commandSearch =
        document.querySelector(
            ".command-search"
        );

    if (commandSearch) {
        commandSearch.addEventListener(
            "click",
            openCommandPalette
        );
    }

    function openCommandPalette() {
        const command =
            prompt(
                "GCODE — Command Palette\n\n" +
                "Commandes disponibles :\n" +
                "• save\n" +
                "• new\n" +
                "• open\n" +
                "• delete\n" +
                "• search\n" +
                "• preview\n" +
                "• export\n" +
                "• terminal"
            );

        if (!command) {
            return;
        }

        executeCommand(command.trim());
    }

    function executeCommand(command) {
        const normalized =
            command.toLowerCase();

        if (
            normalized === "save"
        ) {
            saveCurrentEditor();
            showNotification("Fichier enregistré.");
            return;
        }

        if (
            normalized === "new"
        ) {
            createNewFile();
            return;
        }

        if (
            normalized === "open"
        ) {
            openFilePrompt();
            return;
        }

        if (
            normalized === "delete"
        ) {
            deleteCurrentFile();
            return;
        }

        if (
            normalized === "search"
        ) {
            activateSearch();
            return;
        }

        if (
            normalized === "preview"
        ) {
            previewHtml();
            return;
        }

        if (
            normalized === "export"
        ) {
            exportCurrentFile();
            return;
        }

        if (
            normalized === "terminal"
        ) {
            terminal?.scrollIntoView({
                behavior: "smooth"
            });
            return;
        }

        showNotification(
            `Commande inconnue : ${command}`
        );
    }

    /* =====================================================
       NEW FILE
    ===================================================== */

    function createNewFile() {
        const fileName =
            prompt(
                "Nom du nouveau fichier :",
                "nouveau.html"
            );

        if (!fileName) {
            return;
        }

        const cleanName =
            fileName.trim();

        if (!cleanName) {
            return;
        }

        if (filesExist(cleanName)) {
            showNotification(
                "Ce fichier existe déjà."
            );
            openFile(cleanName);
            return;
        }

        files[cleanName] = {
            language: getLanguage(cleanName),
            content: ""
        };

        saveFiles();

        openTabs.push(cleanName);

        saveOpenTabs();

        rebuildFileTree();
        renderTabs();

        openFile(cleanName);

        showNotification(
            `${cleanName} créé.`
        );
    }

    /* =====================================================
       DELETE FILE
    ===================================================== */

    function deleteCurrentFile() {
        if (!activeFile) {
            return;
        }

        const confirmation =
            confirm(
                `Supprimer "${activeFile}" ?`
            );

        if (!confirmation) {
            return;
        }

        delete files[activeFile];

        openTabs =
            openTabs.filter(
                name =>
                    name !== activeFile
            );

        saveFiles();
        saveOpenTabs();

        const nextFile =
            openTabs[0];

        if (nextFile) {
            openFile(nextFile);
        } else {
            activeFile = null;
            codeDisplay.innerHTML = "";
            breadcrumbFile.textContent = "";
            updateLineNumbers("");
        }

        rebuildFileTree();
        renderTabs();

        showNotification(
            "Fichier supprimé."
        );
    }

    /* =====================================================
       IMPORT FILE
    ===================================================== */

    function importFile() {
        const input =
            document.createElement("input");

        input.type = "file";
        input.multiple = true;

        input.addEventListener(
            "change",
            async () => {
                const selected =
                    Array.from(
                        input.files || []
                    );

                for (const file of selected) {
                    try {
                        const content =
                            await file.text();

                        files[file.name] = {
                            language:
                                getLanguage(
                                    file.name
                                ),
                            content
                        };

                        if (
                            !openTabs.includes(
                                file.name
                            )
                        ) {
                            openTabs.push(
                                file.name
                            );
                        }
                    } catch (error) {
                        console.error(
                            error
                        );
                    }
                }

                saveFiles();
                saveOpenTabs();

                rebuildFileTree();
                renderTabs();

                if (selected[0]) {
                    openFile(
                        selected[0].name
                    );
                }

                showNotification(
                    `${selected.length} fichier(s) importé(s).`
                );
            }
        );

        input.click();
    }

    /* =====================================================
       EXPORT CURRENT FILE
    ===================================================== */

    function exportCurrentFile() {
        if (!activeFile) {
            return;
        }

        saveCurrentEditor();

        const file =
            files[activeFile];

        const blob =
            new Blob(
                [file.content],
                {
                    type: "text/plain;charset=utf-8"
                }
            );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;
        link.download = activeFile;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

        showNotification(
            `${activeFile} exporté.`
        );
    }

    /* =====================================================
       OPEN FILE PROMPT
    ===================================================== */

    function openFilePrompt() {
        const names =
            Object.keys(files);

        const fileName =
            prompt(
                "Fichier à ouvrir :\n\n" +
                names.join("\n")
            );

        if (
            fileName &&
            filesExist(fileName.trim())
        ) {
            openFile(fileName.trim());
        }
    }

    /* =====================================================
       HTML PREVIEW
    ===================================================== */

    function previewHtml() {
        saveCurrentEditor();

        const html =
            files["index.html"]
                ? files["index.html"].content
                : "";

        const css =
            files["style.css"]
                ? files["style.css"].content
                : "";

        const js =
            files["script.js"]
                ? files["script.js"].content
                : "";

        const preview =
            window.open(
                "",
                "_blank",
                "width=1200,height=800"
            );

        if (!preview) {
            showNotification(
                "Le navigateur a bloqué la fenêtre de prévisualisation."
            );
            return;
        }

        preview.document.open();

        preview.document.write(`
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
${css}
</style>
</head>
<body>
${extractBody(html)}
<script>
${js.replace(/<\/script>/gi, "<\\/script>")}
<\/script>
</body>
</html>
        `);

        preview.document.close();
    }

    function extractBody(html) {
        const match =
            html.match(
                /<body[^>]*>([\s\S]*?)<\/body>/i
            );

        if (match) {
            return match[1];
        }

        return html;
    }

    /* =====================================================
       TERMINAL
    ===================================================== */

    function getTerminalInput() {
        return document.querySelector(
            ".terminal-input"
        );
    }

    function reconnectTerminal() {
        const input =
            getTerminalInput();

        if (!input) {
            return;
        }

        input.addEventListener(
            "keydown",
            event => {
                if (event.key !== "Enter") {
                    return;
                }

                event.preventDefault();

                const command =
                    input.innerText.trim();

                input.innerText = "";

                if (command) {
                    executeTerminalCommand(
                        command
                    );
                }
            }
        );
    }

    function executeTerminalCommand(
        command
    ) {
        if (!terminal) {
            return;
        }

        const commandLine =
            document.createElement("div");

        commandLine.style.marginTop =
            "8px";

        commandLine.innerHTML = `
            <span style="color:#569cd6;">PS</span>
            <span style="margin-left:7px;">
                D:\\GCODE&gt;
            </span>
            <span style="margin-left:5px;">
                ${escapeHtml(command)}
            </span>
        `;

        const currentLine =
            terminal.querySelector(
                ".terminal-line"
            );

        terminal.insertBefore(
            commandLine,
            currentLine
        );

        const response =
            document.createElement("div");

        response.style.marginTop =
            "3px";

        const normalized =
            command.trim().toLowerCase();

        if (normalized === "help") {
            response.textContent =
                "Commandes : help, clear, ls, pwd, version, open, save, new, delete, preview, export";
        }

        else if (normalized === "clear") {
            clearTerminal();
            return;
        }

        else if (normalized === "ls") {
            response.textContent =
                Object.keys(files).join(
                    "    "
                );
        }

        else if (normalized === "pwd") {
            response.textContent =
                "GCODE workspace";
        }

        else if (normalized === "version") {
            response.textContent =
                "GCODE 3.0.0";
        }

        else if (normalized === "save") {
            saveCurrentEditor();
            response.textContent =
                "Fichier enregistré.";
        }

        else if (normalized === "new") {
            createNewFile();
            response.textContent =
                "Création du fichier demandée.";
        }

        else if (normalized === "open") {
            openFilePrompt();
            response.textContent =
                "Ouverture demandée.";
        }

        else if (normalized === "delete") {
            deleteCurrentFile();
            response.textContent =
                "Suppression demandée.";
        }

        else if (normalized === "preview") {
            previewHtml();
            response.textContent =
                "Prévisualisation ouverte.";
        }

        else if (normalized === "export") {
            exportCurrentFile();
            response.textContent =
                "Export demandé.";
        }

        else {
            response.textContent =
                `'${command}' n'est pas une commande GCODE locale.`;
        }

        terminal.insertBefore(
            response,
            currentLine
        );
    }

    function clearTerminal() {
        if (!terminal) {
            return;
        }

        terminal.innerHTML = `
            <div class="terminal-line">
                <span class="terminal-prompt">PS</span>
                <span class="terminal-path">D:\\GCODE&gt;</span>
                <span
                    class="terminal-input"
                    contenteditable="true"
                    spellcheck="false"
                ></span>
                <span class="terminal-cursor">█</span>
            </div>
        `;

        reconnectTerminal();

        const input =
            getTerminalInput();

        input?.focus();
    }

    reconnectTerminal();

    /* =====================================================
       BACK / FORWARD
    ===================================================== */

    function navigateHistory(direction) {
        if (!history.length) {
            return;
        }

        const newIndex =
            historyIndex + direction;

        if (
            newIndex < 0 ||
            newIndex >= history.length
        ) {
            return;
        }

        historyIndex = newIndex;

        const fileName =
            history[historyIndex];

        suppressHistory = true;

        openFile(fileName, false);

        suppressHistory = false;
    }

    if (backBtn) {
        backBtn.addEventListener(
            "click",
            () => navigateHistory(-1)
        );
    }

    if (forwardBtn) {
        forwardBtn.addEventListener(
            "click",
            () => navigateHistory(1)
        );
    }

    /* =====================================================
       KEYBOARD SHORTCUTS
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {
            const modifier =
                event.ctrlKey ||
                event.metaKey;

            if (
                modifier &&
                event.key.toLowerCase() === "s"
            ) {
                event.preventDefault();

                saveCurrentEditor();

                showNotification(
                    "Fichier enregistré."
                );
            }

            if (
                modifier &&
                event.key.toLowerCase() === "p"
            ) {
                event.preventDefault();

                previewHtml();
            }

            if (
                modifier &&
                event.key.toLowerCase() === "f"
            ) {
                event.preventDefault();

                activateSearch();
            }

            if (
                modifier &&
                event.key.toLowerCase() === "n"
            ) {
                event.preventDefault();

                createNewFile();
            }

            if (
                modifier &&
                event.key.toLowerCase() === "o"
            ) {
                event.preventDefault();

                importFile();
            }

            if (
                modifier &&
                event.key.toLowerCase() === "w"
            ) {
                event.preventDefault();

                if (activeFile) {
                    closeTab(activeFile);
                }
            }

            if (
                modifier &&
                event.key === "ArrowLeft"
            ) {
                event.preventDefault();

                navigateHistory(-1);
            }

            if (
                modifier &&
                event.key === "ArrowRight"
            ) {
                event.preventDefault();

                navigateHistory(1);
            }
        }
    );

    /* =====================================================
       SEARCH ACTIVATION
    ===================================================== */

    function activateSearch() {
        const searchButton =
            document.querySelector(
                '.activity-item[data-panel="search"]'
            );

        if (searchButton) {
            searchButton.click();
        }
    }

    /* =====================================================
       FILE MENU
    ===================================================== */

    document
        .querySelectorAll(".menu-button")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const name =
                        button.textContent
                            .trim()
                            .toLowerCase();

                    if (name === "file") {
                        showFileMenu();
                    }

                    else if (name === "edit") {
                        showEditMenu();
                    }

                    else if (name === "selection") {
                        showNotification(
                            "Sélection : utilisez les fonctions natives du navigateur."
                        );
                    }

                    else if (name === "view") {
                        showNotification(
                            "Vue : interface conservée."
                        );
                    }

                    else if (name === "go") {
                        showNotification(
                            "Navigation GCODE disponible avec Alt/⌘ + ← →."
                        );
                    }

                    else if (name === "•••") {
                        openCommandPalette();
                    }
                }
            );
        });

    function showFileMenu() {
        const action =
            prompt(
                "FILE\n\n" +
                "1 = Nouveau fichier\n" +
                "2 = Importer\n" +
                "3 = Enregistrer\n" +
                "4 = Exporter\n" +
                "5 = Supprimer\n" +
                "6 = Prévisualiser"
            );

        switch (action) {
            case "1":
                createNewFile();
                break;

            case "2":
                importFile();
                break;

            case "3":
                saveCurrentEditor();
                break;

            case "4":
                exportCurrentFile();
                break;

            case "5":
                deleteCurrentFile();
                break;

            case "6":
                previewHtml();
                break;
        }
    }

    function showEditMenu() {
        const action =
            prompt(
                "EDIT\n\n" +
                "1 = Annuler\n" +
                "2 = Rétablir\n" +
                "3 = Rechercher"
            );

        if (action === "1") {
            document.execCommand(
                "undo"
            );
        }

        if (action === "2") {
            document.execCommand(
                "redo"
            );
        }

        if (action === "3") {
            activateSearch();
        }
    }

    /* =====================================================
       NOTIFICATION
    ===================================================== */

    function showNotification(message) {
        let notification =
            document.getElementById(
                "gcodeNotification"
            );

        if (!notification) {
            notification =
                document.createElement("div");

            notification.id =
                "gcodeNotification";

            notification.style.position =
                "fixed";

            notification.style.bottom =
                "35px";

            notification.style.right =
                "20px";

            notification.style.zIndex =
                "99999";

            notification.style.padding =
                "9px 14px";

            notification.style.background =
                "#252526";

            notification.style.color =
                "#cccccc";

            notification.style.border =
                "1px solid #444";

            notification.style.fontSize =
                "12px";

            document.body.appendChild(
                notification
            );
        }

        notification.textContent =
            message;

        notification.style.display =
            "block";

        clearTimeout(
            notification._timer
        );

        notification._timer =
            setTimeout(() => {
                notification.style.display =
                    "none";
            }, 2200);
    }

    /* =====================================================
       WINDOW CLOSE
    ===================================================== */

    if (closeWindow) {
        closeWindow.addEventListener(
            "click",
            () => {
                const confirmation =
                    confirm(
                        "Fermer GCODE ?"
                    );

                if (confirmation) {
                    window.close();

                    showNotification(
                        "GCODE ne peut pas fermer l'onglet automatiquement dans un navigateur."
                    );
                }
            }
        );
    }

    /* =====================================================
       HISTORY
    ===================================================== */

    function updateHistory(
        fileName,
        content
    ) {
        if (
            history.length === 0 ||
            history[history.length - 1] !==
                fileName
        ) {
            history =
                history.slice(
                    0,
                    historyIndex + 1
                );

            history.push(fileName);

            historyIndex =
                history.length - 1;
        }

        void content;
    }

    /* =====================================================
       INITIALIZATION
    ===================================================== */

    makeEditorEditable();

    rebuildFileTree();

    renderTabs();

    if (
        activeFile &&
        filesExist(activeFile)
    ) {
        openFile(
            activeFile,
            false
        );
    } else {
        const firstFile =
            openTabs.find(
                name => filesExist(name)
            ) ||
            "style.css";

        openFile(
            firstFile,
            false
        );
    }

    history = [
        activeFile
    ].filter(Boolean);

    historyIndex =
        history.length - 1;

    saveFiles();
    saveOpenTabs();

    console.log(
        "%cGCODE 3.0.0",
        "color:#4daafc;font-size:20px;font-weight:bold;"
    );

    console.log(
        "GCODE Editor initialized — functional mode."
    );

})();
