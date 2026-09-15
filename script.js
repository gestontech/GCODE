/* =========================================================
   GCODE
   REAL EDITOR CONTROLLER
   iOS / Android / Desktop
   Interface conservée
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
        console.error("GCODE : éléments principaux introuvables.");
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

    let activeFile =
        localStorage.getItem(ACTIVE_FILE_KEY);

    let history = [];
    let historyIndex = -1;

    let isEditing = false;

    /* =====================================================
       HELPERS
    ===================================================== */

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function filesExist(fileName) {
        return Object.prototype.hasOwnProperty.call(
            files,
            fileName
        );
    }

    function loadFiles() {
        try {
            const saved =
                localStorage.getItem(STORAGE_KEY);

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
            console.warn(
                "GCODE : impossible de charger le workspace.",
                error
            );

            return clone(defaultFiles);
        }
    }

    function saveFiles() {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(files)
            );
        } catch (error) {
            console.warn(
                "GCODE : impossible de sauvegarder.",
                error
            );
        }
    }

    function loadOpenTabs() {
        try {
            const saved = JSON.parse(
                localStorage.getItem(OPEN_TABS_KEY)
            );

            if (
                Array.isArray(saved) &&
                saved.length > 0
            ) {
                const valid = saved.filter(
                    fileName => filesExist(fileName)
                );

                if (valid.length > 0) {
                    return valid;
                }
            }
        } catch (error) {
            console.warn(error);
        }

        return [
            "style.css",
            "index.html"
        ];
    }

    function saveOpenTabs() {
        localStorage.setItem(
            OPEN_TABS_KEY,
            JSON.stringify(openTabs)
        );
    }

    function getLanguage(fileName) {
        const lower =
            fileName.toLowerCase();

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
        if (lower === ".env") return "Environment";
        if (lower === ".gitignore") return "Git";

        return "Plain Text";
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

        let text = escapeHtml(code);

        if (lang === "HTML" || lang === "XML") {

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
                    /\b(const|let|var|function|return|if|else|for|while|class|new|import|from|export|default|async|await)\b/g,
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
                )
                .replace(
                    /(`[^`]+`)/g,
                    '<span class="value">$1</span>'
                );
        }

        return text;
    }

    /* =====================================================
       IOS EDITOR FIX
    ===================================================== */

    function configureEditor() {

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
            "tabindex",
            "0"
        );

        codeDisplay.setAttribute(
            "role",
            "textbox"
        );

        codeDisplay.setAttribute(
            "aria-multiline",
            "true"
        );

        codeDisplay.style.outline = "none";
        codeDisplay.style.whiteSpace = "pre";
        codeDisplay.style.webkitUserModify =
            "read-write";
        codeDisplay.style.webkitUserSelect =
            "text";
        codeDisplay.style.userSelect =
            "text";
        codeDisplay.style.touchAction =
            "manipulation";
    }

    /*
       IMPORTANT :

       Quand l'utilisateur commence à écrire,
       on retire temporairement les <span>
       de coloration syntaxique.

       Cela donne à iOS un vrai texte éditable.
    */

    function enterEditMode() {

        if (isEditing) {
            return;
        }

        isEditing = true;

        const currentText =
            getEditorText();

        codeDisplay.textContent =
            currentText;

        codeDisplay.focus();

        moveCaretToEnd();
    }

    function leaveEditMode() {

        if (!isEditing) {
            return;
        }

        isEditing = false;

        if (!activeFile) {
            return;
        }

        const content =
            getEditorText();

        files[activeFile].content =
            content;

        saveFiles();

        codeDisplay.innerHTML =
            highlightCode(
                content,
                activeFile
            );

        updateLineNumbers(content);
    }

    /* =====================================================
       TEXT / CARET
    ===================================================== */

    function getEditorText() {

        return codeDisplay.innerText
            .replace(/\r\n/g, "\n")
            .replace(/\u00a0/g, " ");
    }

    function moveCaretToEnd() {

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

            selection.addRange(range);

        } catch (error) {
            console.warn(
                "GCODE caret error:",
                error
            );
        }
    }

    function focusEditor() {

        enterEditMode();

        setTimeout(() => {

            try {
                codeDisplay.focus();
            } catch (error) {
                console.warn(error);
            }

        }, 20);
    }

    /* =====================================================
       RENDER EDITOR
    ===================================================== */

    function renderEditor(
        fileName,
        focus = false
    ) {

        if (!filesExist(fileName)) {
            return;
        }

        activeFile =
            fileName;

        localStorage.setItem(
            ACTIVE_FILE_KEY,
            fileName
        );

        const file =
            files[fileName];

        breadcrumbFile.textContent =
            fileName;

        language.textContent =
            file.language ||
            getLanguage(fileName);

        isEditing = false;

        codeDisplay.innerHTML =
            highlightCode(
                file.content,
                fileName
            );

        updateLineNumbers(
            file.content
        );

        updateActiveTab(
            fileName
        );

        updateSelectedTreeItem(
            fileName
        );

        updateCursor();

        if (focus) {
            setTimeout(
                focusEditor,
                50
            );
        }
    }

    /* =====================================================
       LINE NUMBERS
    ===================================================== */

    function updateLineNumbers(
        content
    ) {

        const total =
            Math.max(
                String(content).split("\n").length,
                20
            );

        lineNumbers.innerHTML = "";

        for (
            let i = 1;
            i <= total;
            i++
        ) {

            const span =
                document.createElement("span");

            span.textContent =
                i;

            lineNumbers.appendChild(
                span
            );
        }
    }

    /* =====================================================
       CURSOR
    ===================================================== */

    function updateCursor() {

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

        const before =
            range.cloneRange();

        before.selectNodeContents(
            codeDisplay
        );

        before.setEnd(
            range.startContainer,
            range.startOffset
        );

        const text =
            before.toString();

        const lines =
            text.split("\n");

        const line =
            lines.length;

        const column =
            lines[lines.length - 1].length + 1;

        if (cursorPosition) {

            cursorPosition.textContent =
                `Ln ${line}, Col ${column}`;
        }
    }

    /* =====================================================
       EDITOR INPUT
    ===================================================== */

    codeDisplay.addEventListener(
        "focus",
        () => {

            if (!isEditing) {
                enterEditMode();
            }

        }
    );

    codeDisplay.addEventListener(
        "click",
        () => {

            if (!isEditing) {
                enterEditMode();
            }

        }
    );

    codeDisplay.addEventListener(
        "touchstart",
        () => {

            if (!isEditing) {
                enterEditMode();
            }

        },
        {
            passive: true
        }
    );

    codeDisplay.addEventListener(
        "touchend",
        () => {

            setTimeout(() => {

                try {
                    codeDisplay.focus();
                } catch (error) {
                    console.warn(error);
                }

            }, 50);

        },
        {
            passive: true
        }
    );

    codeDisplay.addEventListener(
        "input",
        () => {

            if (
                !activeFile ||
                !filesExist(activeFile)
            ) {
                return;
            }

            const content =
                getEditorText();

            files[activeFile].content =
                content;

            saveFiles();

            updateLineNumbers(
                content
            );

            markTabModified(
                activeFile
            );

            updateCursor();
        }
    );

    codeDisplay.addEventListener(
        "keyup",
        updateCursor
    );

    codeDisplay.addEventListener(
        "mouseup",
        updateCursor
    );

    codeDisplay.addEventListener(
        "touchend",
        updateCursor
    );

    /* =====================================================
       KEYBOARD
    ===================================================== */

    codeDisplay.addEventListener(
        "keydown",
        event => {

            if (event.key === "Tab") {

                event.preventDefault();

                insertText("    ");

                return;
            }

            if (
                (event.ctrlKey ||
                 event.metaKey) &&
                event.key.toLowerCase() === "s"
            ) {

                event.preventDefault();

                saveCurrentEditor();

                showNotification(
                    `${activeFile} enregistré`
                );

                return;
            }

            if (
                (event.ctrlKey ||
                 event.metaKey) &&
                event.key.toLowerCase() === "f"
            ) {

                event.preventDefault();

                openSearch();

                return;
            }

            if (
                (event.ctrlKey ||
                 event.metaKey) &&
                event.key.toLowerCase() === "p"
            ) {

                event.preventDefault();

                openCommandPalette();

                return;
            }
        }
    );

    function insertText(text) {

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

            range.deleteContents();

            const node =
                document.createTextNode(
                    text
                );

            range.insertNode(node);

            range.setStartAfter(node);
            range.collapse(true);

            selection.removeAllRanges();
            selection.addRange(range);

            codeDisplay.dispatchEvent(
                new Event("input", {
                    bubbles: true
                })
            );

        } catch (error) {
            console.warn(error);
        }
    }

    /* =====================================================
       SAVE
    ===================================================== */

    function saveCurrentEditor() {

        if (
            !activeFile ||
            !filesExist(activeFile)
        ) {
            return;
        }

        const content =
            getEditorText();

        files[activeFile].content =
            content;

        saveFiles();

        updateLineNumbers(
            content
        );

        isEditing = false;

        codeDisplay.innerHTML =
            highlightCode(
                content,
                activeFile
            );

        markTabSaved(
            activeFile
        );
    }

    function markTabModified(
        fileName
    ) {

        const tabs =
            document.querySelectorAll(
                ".editor-tab"
            );

        tabs.forEach(tab => {

            if (
                tab.dataset.file ===
                fileName
            ) {

                tab.classList.add(
                    "modified"
                );

                const close =
                    tab.querySelector(
                        ".tab-close"
                    );

                if (close) {
                    close.textContent =
                        "●";
                }
            }
        });
    }

    function markTabSaved(
        fileName
    ) {

        const tabs =
            document.querySelectorAll(
                ".editor-tab"
            );

        tabs.forEach(tab => {

            if (
                tab.dataset.file ===
                fileName
            ) {

                tab.classList.remove(
                    "modified"
                );

                const close =
                    tab.querySelector(
                        ".tab-close"
                    );

                if (close) {
                    close.textContent =
                        "×";
                }
            }
        });
    }

    /* =====================================================
       TABS
    ===================================================== */

    function renderTabs() {

        editorTabs.innerHTML = "";

        openTabs.forEach(
            fileName => {

                if (!filesExist(fileName)) {
                    return;
                }

                const tab =
                    document.createElement(
                        "div"
                    );

                tab.className =
                    "editor-tab";

                tab.dataset.file =
                    fileName;

                if (
                    fileName ===
                    activeFile
                ) {

                    tab.classList.add(
                        "active"
                    );
                }

                const icon =
                    document.createElement(
                        "span"
                    );

                icon.className =
                    "tab-icon";

                icon.textContent =
                    getFileIcon(
                        fileName
                    );

                const name =
                    document.createElement(
                        "span"
                    );

                name.className =
                    "tab-name";

                name.textContent =
                    fileName;

                const close =
                    document.createElement(
                        "span"
                    );

                close.className =
                    "tab-close";

                close.textContent =
                    "×";

                tab.appendChild(icon);
                tab.appendChild(name);
                tab.appendChild(close);

                tab.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target ===
                            close
                        ) {

                            closeTab(
                                fileName
                            );

                            return;
                        }

                        openFile(
                            fileName
                        );
                    }
                );

                editorTabs.appendChild(
                    tab
                );
            }
        );
    }

    function updateActiveTab(
        fileName
    ) {

        document
            .querySelectorAll(
                ".editor-tab"
            )
            .forEach(tab => {

                tab.classList.toggle(
                    "active",
                    tab.dataset.file ===
                    fileName
                );

            });
    }

    function getFileIcon(
        fileName
    ) {

        const lower =
            fileName.toLowerCase();

        if (lower.endsWith(".html"))
            return "◇";

        if (lower.endsWith(".css"))
            return "◇";

        if (lower.endsWith(".js"))
            return "◇";

        if (lower.endsWith(".json"))
            return "{}";

        if (lower.endsWith(".md"))
            return "M";

        return "•";
    }

    function openFile(
        fileName,
        addHistory = true
    ) {

        if (!filesExist(fileName)) {
            return;
        }

        if (
            !openTabs.includes(
                fileName
            )
        ) {

            openTabs.push(
                fileName
            );
        }

        saveOpenTabs();

        if (addHistory) {

            history =
                history.slice(
                    0,
                    historyIndex + 1
                );

            history.push(
                fileName
            );

            historyIndex =
                history.length - 1;
        }

        renderTabs();

        renderEditor(
            fileName
        );
    }

    function closeTab(
        fileName
    ) {

        const index =
            openTabs.indexOf(
                fileName
            );

        if (index === -1) {
            return;
        }

        openTabs.splice(
            index,
            1
        );

        if (
            activeFile ===
            fileName
        ) {

            const next =
                openTabs[index] ||
                openTabs[index - 1] ||
                null;

            activeFile =
                next;

            if (next) {

                renderEditor(
                    next
                );

            } else {

                codeDisplay.innerHTML =
                    "";

                breadcrumbFile.textContent =
                    "";

                language.textContent =
                    "Plain Text";
            }
        }

        saveOpenTabs();

        renderTabs();
    }

    /* =====================================================
       FILE TREE
    ===================================================== */

    function rebuildFileTree() {

        if (!sidebar) {
            return;
        }

        const existing =
            sidebar.querySelector(
                ".file-tree"
            );

        if (!existing) {
            return;
        }

        existing
            .querySelectorAll(
                ".tree-item.file"
            )
            .forEach(
                element =>
                    element.remove()
            );

        Object.keys(files)
            .forEach(fileName => {

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "tree-item file";

                item.dataset.file =
                    fileName;

                item.innerHTML = `
                    <span class="file-symbol">
                        ${getFileIcon(fileName)}
                    </span>
                    <span>${escapeHtml(fileName)}</span>
                `;

                item.addEventListener(
                    "click",
                    () => {

                        openFile(
                            fileName
                        );
                    }
                );

                existing.appendChild(
                    item
                );
            });
    }

    function updateSelectedTreeItem(
        fileName
    ) {

        document
            .querySelectorAll(
                ".tree-item.file"
            )
            .forEach(item => {

                item.classList.toggle(
                    "active",
                    item.dataset.file ===
                    fileName
                );

            });
    }

    /* =====================================================
       NEW FILE
    ===================================================== */

    function createNewFile() {

        const name =
            window.prompt(
                "Nom du nouveau fichier :",
                "nouveau.html"
            );

        if (!name) {
            return;
        }

        const clean =
            name.trim();

        if (!clean) {
            return;
        }

        if (filesExist(clean)) {

            showNotification(
                "Ce fichier existe déjà."
            );

            openFile(clean);

            return;
        }

        files[clean] = {

            language:
                getLanguage(clean),

            content:
                ""
        };

        saveFiles();

        rebuildFileTree();

        openFile(clean);

        showNotification(
            `${clean} créé`
        );
    }

    /* =====================================================
       DELETE FILE
    ===================================================== */

    function deleteCurrentFile() {

        if (!activeFile) {
            return;
        }

        const confirmed =
            window.confirm(
                `Supprimer ${activeFile} ?`
            );

        if (!confirmed) {
            return;
        }

        delete files[
            activeFile
        ];

        openTabs =
            openTabs.filter(
                file =>
                    file !==
                    activeFile
            );

        saveFiles();
        saveOpenTabs();

        rebuildFileTree();

        const next =
            openTabs[0];

        if (next) {

            openFile(
                next
            );

        } else {

            activeFile =
                null;

            codeDisplay.innerHTML =
                "";

            breadcrumbFile.textContent =
                "";

            language.textContent =
                "Plain Text";
        }

        renderTabs();
    }

    /* =====================================================
       IMPORT
    ===================================================== */

    function importFile() {

        const input =
            document.createElement(
                "input"
            );

        input.type =
            "file";

        input.accept =
            ".html,.css,.js,.jsx,.ts,.tsx,.json,.md,.txt,.xml,.svg,.py,.php,.sql,.yml,.yaml,.sh";

        input.addEventListener(
            "change",
            async event => {

                const file =
                    event.target.files[0];

                if (!file) {
                    return;
                }

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

                    saveFiles();

                    rebuildFileTree();

                    openFile(
                        file.name
                    );

                    showNotification(
                        `${file.name} importé`
                    );

                } catch (error) {

                    console.error(
                        error
                    );

                    showNotification(
                        "Erreur d'importation"
                    );
                }
            }
        );

        input.click();
    }

    /* =====================================================
       EXPORT
    ===================================================== */

    function exportCurrentFile() {

        if (!activeFile) {
            return;
        }

        const content =
            files[activeFile].content;

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

        link.href =
            url;

        link.download =
            activeFile;

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();

        URL.revokeObjectURL(
            url
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

        if (!query) {
            return;
        }

        const results = [];

        Object.entries(files)
            .forEach(
                ([fileName, file]) => {

                    if (
                        file.content
                            .toLowerCase()
                            .includes(
                                query.toLowerCase()
                            )
                    ) {

                        results.push(
                            fileName
                        );
                    }
                }
            );

        if (!results.length) {

            showNotification(
                "Aucun résultat"
            );

            return;
        }

        const first =
            results[0];

        openFile(first);

        showNotification(
            `${results.length} fichier(s) trouvé(s)`
        );
    }

    /* =====================================================
       COMMAND PALETTE
    ===================================================== */

    function openCommandPalette() {

        const command =
            window.prompt(
                "Commande GCODE :\n\n" +
                "new - nouveau fichier\n" +
                "import - importer\n" +
                "export - exporter\n" +
                "delete - supprimer\n" +
                "search - rechercher\n" +
                "preview - aperçu HTML\n" +
                "clear - vider terminal"
            );

        if (!command) {
            return;
        }

        executeCommand(
            command.trim()
        );
    }

    /* =====================================================
       TERMINAL
    ===================================================== */

    function writeTerminal(
        text
    ) {

        if (!terminal) {
            return;
        }

        const line =
            document.createElement(
                "div"
            );

        line.textContent =
            text;

        terminal.appendChild(
            line
        );

        terminal.scrollTop =
            terminal.scrollHeight;
    }

    function clearTerminal() {

        if (terminal) {
            terminal.innerHTML =
                "";
        }
    }

    function executeCommand(
        command
    ) {

        const cmd =
            command
                .toLowerCase()
                .trim();

        if (!cmd) {
            return;
        }

        writeTerminal(
            `> ${command}`
        );

        if (cmd === "help") {

            writeTerminal(
                "Commandes : help, clear, ls, pwd, version, new, import, export, preview"
            );

            return;
        }

        if (cmd === "clear") {

            clearTerminal();

            return;
        }

        if (cmd === "ls") {

            Object.keys(files)
                .forEach(
                    file =>
                        writeTerminal(
                            file
                        )
                );

            return;
        }

        if (cmd === "pwd") {

            writeTerminal(
                "/GCODE"
            );

            return;
        }

        if (cmd === "version") {

            writeTerminal(
                "GCODE 3.0.0"
            );

            return;
        }

        if (cmd === "new") {

            createNewFile();

            return;
        }

        if (cmd === "import") {

            importFile();

            return;
        }

        if (cmd === "export") {

            exportCurrentFile();

            return;
        }

        if (cmd === "preview") {

            previewHtml();

            return;
        }

        if (cmd === "delete") {

            deleteCurrentFile();

            return;
        }

        if (cmd === "search") {

            openSearch();

            return;
        }

        writeTerminal(
            `Commande inconnue : ${command}`
        );
    }

    /* =====================================================
       TERMINAL INPUT
    ===================================================== */

    const terminalInput =
        document.querySelector(
            ".terminal-input"
        );

    if (terminalInput) {

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
                }
            }
        );
    }

    /* =====================================================
       HTML PREVIEW
    ===================================================== */

    function previewHtml() {

        const html =
            files["index.html"]?.content ||
            "";

        const css =
            files["style.css"]?.content ||
            "";

        const js =
            files["script.js"]?.content ||
            "";

        const preview =
            window.open(
                "",
                "_blank"
            );

        if (!preview) {

            showNotification(
                "Le navigateur a bloqué l'aperçu."
            );

            return;
        }

        const finalHtml =
            html
                .replace(
                    "</head>",
                    `<style>${css}</style></head>`
                )
                .replace(
                    "</body>",
                    `<script>${js}<\/script></body>`
                );

        preview.document.open();

        preview.document.write(
            finalHtml
        );

        preview.document.close();
    }

    /* =====================================================
       ACTIVITY BAR
    ===================================================== */

    document
        .querySelectorAll(
            ".activity-item"
        )
        .forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    const panel =
                        item.dataset.panel;

                    if (!panel) {
                        return;
                    }

                    if (
                        panel ===
                        "search"
                    ) {

                        openSearch();

                        return;
                    }

                    document
                        .querySelectorAll(
                            ".activity-item"
                        )
                        .forEach(
                            other =>
                                other.classList.remove(
                                    "active"
                                )
                        );

                    item.classList.add(
                        "active"
                    );

                    showNotification(
                        panel
                    );
                }
            );
        });

    /* =====================================================
       MENU BUTTONS
    ===================================================== */

    document
        .querySelectorAll(
            ".menu-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const label =
                        button.textContent
                            .trim()
                            .toLowerCase();

                    if (
                        label ===
                        "file"
                    ) {

                        createNewFile();

                    } else if (
                        label ===
                        "edit"
                    ) {

                        focusEditor();

                    } else if (
                        label ===
                        "selection"
                    ) {

                        showNotification(
                            "Sélection active"
                        );

                    } else if (
                        label ===
                        "view"
                    ) {

                        showNotification(
                            "Vue GCODE"
                        );

                    } else if (
                        label ===
                        "go"
                    ) {

                        openSearch();

                    } else {

                        openCommandPalette();
                    }
                }
            );
        });

    /* =====================================================
       COMMAND SEARCH
    ===================================================== */

    const commandSearch =
        document.querySelector(
            ".command-search"
        );

    if (commandSearch) {

        commandSearch.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    const value =
                        commandSearch.value.trim();

                    if (value) {

                        openFile(
                            value
                        );
                    }
                }
            }
        );
    }

    /* =====================================================
       BACK / FORWARD
    ===================================================== */

    if (backBtn) {

        backBtn.addEventListener(
            "click",
            () => {

                if (
                    historyIndex <= 0
                ) {
                    return;
                }

                historyIndex--;

                const file =
                    history[
                        historyIndex
                    ];

                openFile(
                    file,
                    false
                );
            }
        );
    }

    if (forwardBtn) {

        forwardBtn.addEventListener(
            "click",
            () => {

                if (
                    historyIndex >=
                    history.length - 1
                ) {
                    return;
                }

                historyIndex++;

                const file =
                    history[
                        historyIndex
                    ];

                openFile(
                    file,
                    false
                );
            }
        );
    }

    /* =====================================================
       KEYBOARD GLOBAL
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            const key =
                event.key.toLowerCase();

            if (
                (event.ctrlKey ||
                 event.metaKey) &&
                key === "n"
            ) {

                event.preventDefault();

                createNewFile();
            }

            if (
                (event.ctrlKey ||
                 event.metaKey) &&
                key === "o"
            ) {

                event.preventDefault();

                importFile();
            }

            if (
                (event.ctrlKey ||
                 event.metaKey) &&
                key === "w"
            ) {

                event.preventDefault();

                if (activeFile) {
                    closeTab(
                        activeFile
                    );
                }
            }
        }
    );

    /* =====================================================
       CLOSE WINDOW
    ===================================================== */

    if (closeWindow) {

        closeWindow.addEventListener(
            "click",
            () => {

                try {

                    window.close();

                } catch (error) {

                    document.body.innerHTML = `
                        <div style="
                            height:100vh;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            background:#1e1e1e;
                            color:#cccccc;
                            font-family:Arial,sans-serif;
                        ">
                            <div style="text-align:center">
                                <h2>GCODE</h2>
                                <p>Fenêtre fermée.</p>
                                <button onclick="location.reload()">
                                    Revenir à GCODE
                                </button>
                            </div>
                        </div>
                    `;
                }
            }
        );
    }

    /* =====================================================
       NOTIFICATION
    ===================================================== */

    function showNotification(
        message
    ) {

        let notification =
            document.getElementById(
                "gcodeNotification"
            );

        if (!notification) {

            notification =
                document.createElement(
                    "div"
                );

            notification.id =
                "gcodeNotification";

            notification.style.position =
                "fixed";

            notification.style.bottom =
                "45px";

            notification.style.right =
                "20px";

            notification.style.zIndex =
                "99999";

            notification.style.padding =
                "10px 14px";

            notification.style.background =
                "#252526";

            notification.style.color =
                "#ffffff";

            notification.style.border =
                "1px solid #3e3e42";

            notification.style.borderRadius =
                "6px";

            notification.style.fontSize =
                "13px";

            notification.style.boxShadow =
                "0 4px 15px rgba(0,0,0,.35)";

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
            setTimeout(
                () => {

                    notification.style.display =
                        "none";

                },
                2200
            );
    }

    /* =====================================================
       INITIALISATION
    ===================================================== */

    configureEditor();

    rebuildFileTree();

    if (
        !activeFile ||
        !filesExist(activeFile)
    ) {

        activeFile =
            openTabs[0] ||
            "style.css";
    }

    renderTabs();

    renderEditor(
        activeFile
    );

    history = [
        activeFile
    ];

    historyIndex = 0;

    saveOpenTabs();

    console.log(
        "GCODE Editor V3 chargé."
    );

})();
