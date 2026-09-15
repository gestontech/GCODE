/* =========================================================
   GCODE V3
   REAL EDITOR CONTROLLER
   REAL FILE SYSTEM
   iOS / Android / Desktop
   Interface conservée
========================================================= */

(() => {
    "use strict";

    /* =====================================================
       ELEMENTS EXISTANTS
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
       REAL FILE SYSTEM
    ===================================================== */

    const FS = window.GCODEFileSystem || null;

    if (!FS) {
        console.error(
            "GCODE : filesystem.js n'est pas chargé avant script.js."
        );
    }

    /* =====================================================
       STORAGE
    ===================================================== */

    const OPEN_TABS_KEY = "GCODE_OPEN_TABS_V3";
    const ACTIVE_FILE_KEY = "GCODE_ACTIVE_FILE_V3";

    /* =====================================================
       ETAT
    ===================================================== */

    let projectOpened = false;
    let projectName = "GCODE";

    let files = {};
    let directories = new Set(["/"]);

    let openTabs = [];
    let activeFile = null;

    let isEditing = false;
    let isRendering = false;

    let undoStack = [];
    let redoStack = [];

    let currentPath = "/";

    /* =====================================================
       UTILITAIRES
    ===================================================== */

    function normalizePath(path) {
        if (FS && FS.normalizePath) {
            return FS.normalizePath(path);
        }

        let value = String(path || "/")
            .replace(/\\/g, "/")
            .replace(/\/+/g, "/");

        if (!value.startsWith("/")) {
            value = "/" + value;
        }

        if (value.length > 1 && value.endsWith("/")) {
            value = value.slice(0, -1);
        }

        return value;
    }

    function fileNameFromPath(path) {
        const normalized = normalizePath(path);

        return normalized
            .split("/")
            .pop() || "";
    }

    function parentPath(path) {
        if (FS && FS.getParentPath) {
            return FS.getParentPath(path);
        }

        const normalized = normalizePath(path);

        if (normalized === "/") {
            return "/";
        }

        const parts = normalized.split("/");
        parts.pop();

        return parts.join("/") || "/";
    }

    function joinPath(parent, name) {
        if (FS && FS.joinPath) {
            return FS.joinPath(parent, name);
        }

        const base = normalizePath(parent);
        const clean = String(name || "")
            .replace(/^\/+/, "")
            .replace(/\/+$/, "");

        return base === "/"
            ? "/" + clean
            : base + "/" + clean;
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    /* =====================================================
       LANGAGE
    ===================================================== */

    function getLanguage(fileName) {
        const lower = String(fileName)
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
        if (lower.endsWith(".bat")) return "Batch";
        if (lower.endsWith(".env")) return "Environment";
        if (lower === ".gitignore") return "Git";

        return "Plain Text";
    }

    /* =====================================================
       SYNTAX HIGHLIGHT
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

        } else if (lang === "CSS") {

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

        } else if (
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

        } else if (lang === "JSON") {

            text = text
                .replace(
                    /(&quot;.*?&quot;)(\s*:)/g,
                    '<span class="property">$1</span>$2'
                )
                .replace(
                    /(:\s*)(&quot;.*?&quot;|\d+(?:\.\d+)?|true|false|null)/g,
                    '$1<span class="value">$2</span>'
                );

        } else if (lang === "Markdown") {

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
       EDITOR IOS
    ===================================================== */

    function configureEditor() {
        codeDisplay.setAttribute("contenteditable", "true");
        codeDisplay.setAttribute("spellcheck", "false");
        codeDisplay.setAttribute("autocorrect", "off");
        codeDisplay.setAttribute("autocapitalize", "off");
        codeDisplay.setAttribute("autocomplete", "off");
        codeDisplay.setAttribute("inputmode", "text");
        codeDisplay.setAttribute("tabindex", "0");
        codeDisplay.setAttribute("role", "textbox");
        codeDisplay.setAttribute("aria-multiline", "true");

        codeDisplay.style.outline = "none";
        codeDisplay.style.whiteSpace = "pre";
        codeDisplay.style.webkitUserModify = "read-write";
        codeDisplay.style.webkitUserSelect = "text";
        codeDisplay.style.userSelect = "text";
        codeDisplay.style.touchAction = "manipulation";
    }

    function getEditorText() {
        return codeDisplay.innerText
            .replace(/\r\n/g, "\n")
            .replace(/\u00a0/g, " ");
    }

    function moveCaretToEnd() {
        try {
            const range = document.createRange();

            range.selectNodeContents(codeDisplay);
            range.collapse(false);

            const selection = window.getSelection();

            selection.removeAllRanges();
            selection.addRange(range);
        } catch (error) {
            console.warn("GCODE caret:", error);
        }
    }

    function enterEditMode() {
        if (isEditing) return;

        isEditing = true;

        const text = getEditorText();

        codeDisplay.textContent = text;

        codeDisplay.focus();

        moveCaretToEnd();
    }

    function leaveEditMode() {
        if (!isEditing || !activeFile) {
            return;
        }

        const content = getEditorText();

        isEditing = false;

        saveCurrentFile(content);
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
       LINE NUMBERS
    ===================================================== */

    function updateLineNumbers(content) {
        const lines = String(content || "").split("\n");

        lineNumbers.innerHTML = "";

        const total = Math.max(lines.length, 20);

        for (let i = 1; i <= total; i++) {
            const span = document.createElement("span");

            span.textContent = i;

            lineNumbers.appendChild(span);
        }
    }

    /* =====================================================
       CURSEUR
    ===================================================== */

    function updateCursor() {
        if (!cursorPosition) return;

        try {
            const selection = window.getSelection();

            if (!selection || !selection.rangeCount) {
                return;
            }

            const range = selection.getRangeAt(0);

            if (!codeDisplay.contains(range.startContainer)) {
                return;
            }

            let node = range.startContainer;
            let offset = range.startOffset;

            if (node.nodeType !== Node.TEXT_NODE) {
                return;
            }

            const before = node.textContent.slice(0, offset);

            let container = node;

            while (
                container &&
                container !== codeDisplay
            ) {
                if (container.previousSibling) {
                    let sibling =
                        container.previousSibling;

                    while (sibling) {
                        before;
                        sibling = sibling.previousSibling;
                    }
                }

                container = container.parentNode;
            }

            const fullText = getEditorText();

            const position =
                Math.max(
                    0,
                    fullText.indexOf(
                        node.textContent
                    ) + offset
                );

            const textBefore =
                fullText.slice(0, position);

            const lines =
                textBefore.split("\n");

            const line =
                lines.length;

            const column =
                lines[lines.length - 1].length + 1;

            cursorPosition.textContent =
                `Ln ${line}, Col ${column}`;

        } catch (error) {
            cursorPosition.textContent =
                "Ln 1, Col 1";
        }
    }

    /* =====================================================
       SAVE
    ===================================================== */

    async function saveCurrentFile(content) {
        if (!activeFile || !FS) {
            return false;
        }

        try {
            await FS.writeFile(
                activeFile,
                content
            );

            if (!files[activeFile]) {
                files[activeFile] = {};
            }

            files[activeFile].content = content;

            updateLineNumbers(content);

            setStatus("Sauvegardé");

            return true;

        } catch (error) {
            console.error(
                "GCODE : sauvegarde impossible",
                error
            );

            setStatus("Erreur de sauvegarde");

            return false;
        }
    }

    /* =====================================================
       OUVRIR FICHIER
    ===================================================== */

    async function openFile(path, focus = false) {
        if (!FS) return;

        const normalized = normalizePath(path);

        try {
            const content =
                await FS.readFile(normalized);

            files[normalized] = {
                language:
                    getLanguage(
                        fileNameFromPath(
                            normalized
                        )
                    ),
                content
            };

            if (!openTabs.includes(normalized)) {
                openTabs.push(normalized);
            }

            activeFile = normalized;

            saveTabsState();

            renderTabs();
            renderEditor(normalized, focus);

            setStatus("Fichier ouvert");

        } catch (error) {
            console.error(
                "GCODE : impossible d'ouvrir",
                normalized,
                error
            );

            setStatus("Impossible d'ouvrir le fichier");
        }
    }

    /* =====================================================
       RENDER EDITOR
    ===================================================== */

    function renderEditor(path, focus = false) {
        const normalized = normalizePath(path);

        if (!files[normalized]) {
            return;
        }

        activeFile = normalized;

        localStorage.setItem(
            ACTIVE_FILE_KEY,
            normalized
        );

        const file = files[normalized];

        const name =
            fileNameFromPath(normalized);

        breadcrumbFile.textContent = name;

        language.textContent =
            file.language ||
            getLanguage(name);

        isEditing = false;

        isRendering = true;

        codeDisplay.innerHTML =
            highlightCode(
                file.content || "",
                name
            );

        updateLineNumbers(
            file.content || ""
        );

        updateActiveTab(normalized);
        updateCursor();

        isRendering = false;

        if (focus) {
            setTimeout(
                focusEditor,
                50
            );
        }
    }

    /* =====================================================
       TABS
    ===================================================== */

    function saveTabsState() {
        try {
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
        } catch (error) {
            console.warn(error);
        }
    }

    function renderTabs() {
        editorTabs.innerHTML = "";

        openTabs.forEach(path => {
            const tab =
                document.createElement("div");

            tab.className = "editor-tab";

            if (path === activeFile) {
                tab.classList.add("active");
            }

            tab.dataset.file = path;

            const name =
                fileNameFromPath(path);

            tab.innerHTML = `
                <span class="tab-name">
                    ${escapeHtml(name)}
                </span>
                <span class="tab-close">×</span>
            `;

            tab.addEventListener(
                "click",
                event => {

                    if (
                        event.target.classList.contains(
                            "tab-close"
                        )
                    ) {
                        event.stopPropagation();

                        closeTab(path);

                        return;
                    }

                    openFile(path);
                }
            );

            editorTabs.appendChild(tab);
        });
    }

    function updateActiveTab(path) {
        editorTabs
            .querySelectorAll(".editor-tab")
            .forEach(tab => {

                tab.classList.toggle(
                    "active",
                    tab.dataset.file === path
                );
            });
    }

    async function closeTab(path) {
        const index =
            openTabs.indexOf(path);

        if (index === -1) return;

        openTabs.splice(index, 1);

        if (activeFile === path) {

            if (openTabs.length > 0) {

                const nextIndex =
                    Math.max(
                        0,
                        index - 1
                    );

                activeFile =
                    openTabs[nextIndex];

                await openFile(
                    activeFile
                );

            } else {

                activeFile = null;

                breadcrumbFile.textContent =
                    "Aucun fichier";

                language.textContent =
                    "Plain Text";

                codeDisplay.textContent = "";

                lineNumbers.innerHTML = "";
            }
        }

        saveTabsState();
        renderTabs();
    }

    /* =====================================================
       EXPLORER
    ===================================================== */

    async function refreshExplorer() {
        if (!FS) return;

        if (!projectOpened) {
            renderFallbackExplorer();
            return;
        }

        try {
            const root =
                await FS.listDirectory("/");

            renderDirectoryItems(
                root
            );

            setStatus("Explorateur actualisé");

        } catch (error) {
            console.error(
                "GCODE Explorer:",
                error
            );

            setStatus(
                "Erreur Explorer"
            );
        }
    }

    function findExplorerContainer() {
        if (!sidebar) return null;

        return (
            sidebar.querySelector(
                "[data-gcode-explorer]"
            ) ||
            sidebar.querySelector(
                ".file-tree"
            ) ||
            sidebar.querySelector(
                ".explorer"
            )
        );
    }

    function renderFallbackExplorer() {
        const container =
            findExplorerContainer();

        if (!container) return;

        const existing =
            container.querySelector(
                ".gcode-real-tree"
            );

        if (existing) {
            existing.remove();
        }

        const tree =
            document.createElement("div");

        tree.className =
            "gcode-real-tree";

        tree.dataset.gcodeExplorer =
            "true";

        Object.keys(files)
            .sort()
            .forEach(path => {

                addExplorerFile(
                    tree,
                    path
                );
            });

        container.appendChild(tree);
    }

    function renderDirectoryItems(items) {
        const container =
            findExplorerContainer();

        if (!container) {
            console.warn(
                "GCODE : conteneur Explorer introuvable."
            );
            return;
        }

        const oldTree =
            container.querySelector(
                ".gcode-real-tree"
            );

        if (oldTree) {
            oldTree.remove();
        }

        const tree =
            document.createElement("div");

        tree.className =
            "gcode-real-tree";

        tree.dataset.gcodeExplorer =
            "true";

        items.forEach(item => {

            if (item.kind === "directory") {
                addExplorerDirectory(
                    tree,
                    item
                );
            } else {
                addExplorerFile(
                    tree,
                    item.path
                );
            }
        });

        container.appendChild(tree);
    }

    function addExplorerFile(container, path) {
        const row =
            document.createElement("div");

        row.className =
            "gcode-file-item";

        row.dataset.path = path;

        if (path === activeFile) {
            row.classList.add("active");
        }

        const name =
            fileNameFromPath(path);

        row.innerHTML = `
            <span class="gcode-file-icon">▤</span>
            <span class="gcode-file-name">
                ${escapeHtml(name)}
            </span>
        `;

        row.addEventListener(
            "click",
            () => {
                openFile(path);
            }
        );

        container.appendChild(row);
    }

    function addExplorerDirectory(
        container,
        item
    ) {
        const row =
            document.createElement("div");

        row.className =
            "gcode-directory-item";

        row.dataset.path =
            item.path;

        row.innerHTML = `
            <span class="gcode-folder-icon">▸</span>
            <span class="gcode-folder-name">
                ${escapeHtml(item.name)}
            </span>
        `;

        row.addEventListener(
            "click",
            async () => {

                await openDirectory(
                    item.path
                );
            }
        );

        container.appendChild(row);
    }

    function updateSelectedTreeItem(path) {
        document
            .querySelectorAll(
                "[data-path]"
            )
            .forEach(element => {

                element.classList.toggle(
                    "active",
                    element.dataset.path === path
                );
            });
    }

    /* =====================================================
       OUVRIR DOSSIER
    ===================================================== */

    async function openProject() {
        if (!FS) {
            alert(
                "filesystem.js n'est pas chargé."
            );
            return;
        }

        if (!FS.supportsFileSystemAccess()) {
            alert(
                "Ce navigateur ne permet pas encore l'accès direct aux dossiers."
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

            currentPath = "/";

            setStatus(
                `Projet ouvert : ${projectName}`
            );

            await refreshExplorer();

        } catch (error) {
            console.error(error);

            setStatus(
                "Ouverture du projet annulée"
            );
        }
    }

    async function openDirectory(path) {
        currentPath =
            normalizePath(path);

        if (!FS) return;

        try {
            const items =
                await FS.listDirectory(
                    currentPath
                );

            renderDirectoryItems(
                items
            );

            setStatus(
                currentPath
            );

        } catch (error) {
            console.error(error);
        }
    }

    /* =====================================================
       CREER FICHIER
    ===================================================== */

    async function createFile() {
        if (!FS || !projectOpened) {
            alert(
                "Ouvre d'abord un dossier de projet."
            );
            return;
        }

        const name =
            window.prompt(
                "Nom du nouveau fichier :"
            );

        if (!name) return;

        const path =
            joinPath(
                currentPath,
                name
            );

        try {

            await FS.writeFile(
                path,
                ""
            );

            await openFile(path, true);

            await refreshExplorer();

            setStatus(
                `Fichier créé : ${name}`
            );

        } catch (error) {
            console.error(error);

            alert(
                "Impossible de créer le fichier."
            );
        }
    }

    /* =====================================================
       CREER DOSSIER
    ===================================================== */

    async function createFolder() {
        if (!FS || !projectOpened) {
            alert(
                "Ouvre d'abord un dossier de projet."
            );
            return;
        }

        const name =
            window.prompt(
                "Nom du nouveau dossier :"
            );

        if (!name) return;

        const path =
            joinPath(
                currentPath,
                name
            );

        try {

            await FS.createDirectory(
                path
            );

            await refreshExplorer();

            setStatus(
                `Dossier créé : ${name}`
            );

        } catch (error) {
            console.error(error);

            alert(
                "Impossible de créer le dossier."
            );
        }
    }

    /* =====================================================
       SUPPRIMER
    ===================================================== */

    async function deleteCurrentFile() {
        if (!FS || !activeFile) {
            return;
        }

        const name =
            fileNameFromPath(
                activeFile
            );

        const confirmed =
            window.confirm(
                `Supprimer "${name}" ?`
            );

        if (!confirmed) return;

        try {

            await FS.deletePath(
                activeFile
            );

            files[activeFile] = null;
            delete files[activeFile];

            await closeTab(
                activeFile
            );

            await refreshExplorer();

            setStatus(
                `Supprimé : ${name}`
            );

        } catch (error) {
            console.error(error);

            alert(
                "Impossible de supprimer le fichier."
            );
        }
    }

    /* =====================================================
       RENOMMER
    ===================================================== */

    async function renameCurrentFile() {
        if (!FS || !activeFile) {
            return;
        }

        const oldPath =
            activeFile;

        const oldName =
            fileNameFromPath(
                oldPath
            );

        const newName =
            window.prompt(
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
                parentPath(oldPath),
                newName
            );

        try {

            await FS.renameFile(
                oldPath,
                newPath
            );

            const data =
                files[oldPath];

            delete files[oldPath];

            files[newPath] = data;

            const index =
                openTabs.indexOf(
                    oldPath
                );

            if (index !== -1) {
                openTabs[index] =
                    newPath;
            }

            activeFile =
                newPath;

            saveTabsState();

            await openFile(
                newPath
            );

            await refreshExplorer();

            setStatus(
                `Renommé : ${newName}`
            );

        } catch (error) {
            console.error(error);

            alert(
                "Impossible de renommer le fichier."
            );
        }
    }

    /* =====================================================
       IMPORT
    ===================================================== */

    function importFile() {
        const input =
            document.createElement(
                "input"
            );

        input.type = "file";
        input.multiple = true;

        input.addEventListener(
            "change",
            async () => {

                if (!input.files) {
                    return;
                }

                for (
                    const file
                    of input.files
                ) {

                    try {

                        const result =
                            await FS.importLocalFile(
                                file
                            );

                        if (result) {
                            files[result.path] = {
                                language:
                                    getLanguage(
                                        result.name
                                    ),
                                content:
                                    result.content
                            };
                        }

                    } catch (error) {
                        console.error(
                            error
                        );
                    }
                }

                await refreshExplorer();

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

    async function exportCurrentFile() {
        if (!FS || !activeFile) {
            return;
        }

        try {

            const content =
                files[activeFile]?.content ||
                await FS.readFile(
                    activeFile
                );

            await FS.exportFile(
                activeFile,
                content
            );

            setStatus(
                "Export terminé"
            );

        } catch (error) {
            console.error(error);

            setStatus(
                "Erreur export"
            );
        }
    }

    /* =====================================================
       SEARCH
    ===================================================== */

    function searchInCurrentFile() {
        if (!activeFile) return;

        const query =
            window.prompt(
                "Rechercher dans le fichier :"
            );

        if (!query) return;

        const content =
            files[activeFile]?.content ||
            "";

        const index =
            content
                .toLowerCase()
                .indexOf(
                    query.toLowerCase()
                );

        if (index === -1) {
            setStatus(
                `"${query}" introuvable`
            );
            return;
        }

        setStatus(
            `"${query}" trouvé`
        );

        focusEditor();
    }

    /* =====================================================
       TERMINAL
    ===================================================== */

    function terminalWrite(text) {
        if (!terminal) return;

        const line =
            document.createElement(
                "div"
            );

        line.textContent = text;

        terminal.appendChild(line);

        terminal.scrollTop =
            terminal.scrollHeight;
    }

    function executeCommand(command) {
        const cmd =
            String(command || "")
                .trim();

        if (!cmd) return;

        terminalWrite(
            `> ${cmd}`
        );

        if (cmd === "clear") {
            terminal.innerHTML = "";
            return;
        }

        if (cmd === "pwd") {
            terminalWrite(
                projectOpened
                    ? `/${projectName}`
                    : "/GCODE"
            );
            return;
        }

        if (cmd === "ls") {

            if (!FS || !projectOpened) {
                terminalWrite(
                    "Aucun projet ouvert."
                );
                return;
            }

            FS.listDirectory(
                currentPath
            )
                .then(items => {

                    items.forEach(
                        item => {
                            terminalWrite(
                                item.name
                            );
                        }
                    );

                })
                .catch(error => {

                    terminalWrite(
                        `Erreur : ${error.message}`
                    );

                });

            return;
        }

        if (cmd === "help") {
            terminalWrite(
                "Commandes disponibles :"
            );
            terminalWrite(
                "help"
            );
            terminalWrite(
                "clear"
            );
            terminalWrite(
                "pwd"
            );
            terminalWrite(
                "ls"
            );
            return;
        }

        terminalWrite(
            `Commande non reconnue : ${cmd}`
        );
    }

    /* =====================================================
       STATUS
    ===================================================== */

    function setStatus(text) {
        const status =
            document.querySelector(
                ".status-message"
            );

        if (status) {
            status.textContent = text;
        }

        if (
            language &&
            text === "Sauvegardé"
        ) {
            language.style.opacity = "1";
        }
    }

    /* =====================================================
       HISTORIQUE
    ===================================================== */

    function pushHistory(content) {
        undoStack.push(content);

        if (undoStack.length > 100) {
            undoStack.shift();
        }

        redoStack = [];
    }

    async function undo() {
        if (!activeFile) return;

        if (undoStack.length === 0) {
            return;
        }

        const current =
            files[activeFile]?.content ||
            "";

        const previous =
            undoStack.pop();

        redoStack.push(current);

        files[activeFile].content =
            previous;

        await saveCurrentFile(
            previous
        );

        renderEditor(
            activeFile
        );
    }

    async function redo() {
        if (!activeFile) return;

        if (redoStack.length === 0) {
            return;
        }

        const current =
            files[activeFile]?.content ||
            "";

        const next =
            redoStack.pop();

        undoStack.push(current);

        files[activeFile].content =
            next;

        await saveCurrentFile(
            next
        );

        renderEditor(
            activeFile
        );
    }

    /* =====================================================
       EVENTS EDITEUR
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
        "input",
        async () => {

            if (
                isRendering ||
                !activeFile
            ) {
                return;
            }

            const content =
                getEditorText();

            if (!files[activeFile]) {
                files[activeFile] = {
                    language:
                        getLanguage(
                            fileNameFromPath(
                                activeFile
                            )
                        ),
                    content: ""
                };
            }

            files[activeFile].content =
                content;

            updateLineNumbers(
                content
            );

            updateCursor();

            /*
             * Sauvegarde automatique
             * dans le vrai fichier.
             */
            await saveCurrentFile(
                content
            );
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
       TABULATION DANS L'EDITEUR
    ===================================================== */

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

                return;
            }

            if (
                (event.metaKey ||
                    event.ctrlKey) &&
                event.key.toLowerCase() === "s"
            ) {

                event.preventDefault();

                if (activeFile) {
                    saveCurrentFile(
                        getEditorText()
                    );
                }

                return;
            }

            if (
                (event.metaKey ||
                    event.ctrlKey) &&
                event.key.toLowerCase() === "z"
            ) {

                event.preventDefault();

                undo();

                return;
            }

            if (
                (event.metaKey ||
                    event.ctrlKey) &&
                event.key.toLowerCase() === "y"
            ) {

                event.preventDefault();

                redo();

                return;
            }
        }
    );

    /* =====================================================
       DRAG / DROP
    ===================================================== */

    codeDisplay.addEventListener(
        "dragover",
        event => {
            event.preventDefault();
        }
    );

    codeDisplay.addEventListener(
        "drop",
        event => {
            event.preventDefault();

            const text =
                event.dataTransfer?.getData(
                    "text/plain"
                );

            if (text) {
                document.execCommand(
                    "insertText",
                    false,
                    text
                );
            }
        }
    );

    /* =====================================================
       BOUTONS EXISTANTS
    ===================================================== */

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
                    window.history.length > 1
                ) {
                    window.history.back();
                } else {
                    window.close();
                }
            }
        );
    }

    /* =====================================================
       COMMANDES PAR CLASSES
    ===================================================== */

    document.addEventListener(
        "click",
        event => {

            const target =
                event.target.closest(
                    "[data-gcode-action]"
                );

            if (!target) return;

            const action =
                target.dataset.gcodeAction;

            switch (action) {

                case "open-project":
                    openProject();
                    break;

                case "new-file":
                    createFile();
                    break;

                case "new-folder":
                    createFolder();
                    break;

                case "delete-file":
                    deleteCurrentFile();
                    break;

                case "rename-file":
                    renameCurrentFile();
                    break;

                case "import":
                    importFile();
                    break;

                case "export":
                    exportCurrentFile();
                    break;

                case "refresh":
                    refreshExplorer();
                    break;

                case "search":
                    searchInCurrentFile();
                    break;

                case "undo":
                    undo();
                    break;

                case "redo":
                    redo();
                    break;
            }
        }
    );

    /* =====================================================
       INPUT TERMINAL
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
                    event.key === "Enter"
                ) {

                    executeCommand(
                        terminalInput.value
                    );

                    terminalInput.value = "";
                }
            }
        );
    }

    /* =====================================================
       COMMAND SEARCH
    ===================================================== */

    document
        .querySelectorAll(
            ".command-search"
        )
        .forEach(input => {

            input.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key !== "Enter"
                    ) {
                        return;
                    }

                    const value =
                        input.value.trim();

                    if (!value) return;

                    if (
                        value ===
                        "open"
                    ) {
                        openProject();
                    }

                    else if (
                        value ===
                        "new file"
                    ) {
                        createFile();
                    }

                    else if (
                        value ===
                        "new folder"
                    ) {
                        createFolder();
                    }

                    else if (
                        value ===
                        "refresh"
                    ) {
                        refreshExplorer();
                    }

                    else {
                        searchInCurrentFile();
                    }
                }
            );
        });

    /* =====================================================
       RACCOURCIS GLOBAUX
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            const modifier =
                event.metaKey ||
                event.ctrlKey;

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

                createFile();

                return;
            }

            if (
                modifier &&
                event.key.toLowerCase() ===
                    "p"
            ) {

                /*
                 * Ne bloque pas le comportement
                 * si l'interface possède déjà
                 * sa palette de commandes.
                 */
                return;
            }
        }
    );

    /* =====================================================
       EVENTS DU FILE SYSTEM
    ===================================================== */

    if (FS && FS.on) {

        FS.on(
            "save",
            data => {

                if (
                    data &&
                    data.path
                ) {

                    setStatus(
                        `Sauvegardé : ${fileNameFromPath(
                            data.path
                        )}`
                    );
                }
            }
        );

        FS.on(
            "change",
            () => {

                if (projectOpened) {
                    refreshExplorer();
                }
            }
        );

        FS.on(
            "error",
            error => {

                console.error(
                    "GCODE File System:",
                    error
                );

                setStatus(
                    "Erreur système de fichiers"
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

                setStatus(
                    `Projet : ${projectName}`
                );
            }
        );
    }

    /* =====================================================
       INITIALISATION
    ===================================================== */

    async function initialize() {

        configureEditor();

        try {
            openTabs =
                JSON.parse(
                    localStorage.getItem(
                        OPEN_TABS_KEY
                    )
                ) || [];
        } catch {
            openTabs = [];
        }

        activeFile =
            localStorage.getItem(
                ACTIVE_FILE_KEY
            );

        renderTabs();

        /*
         * Si un projet réel est déjà ouvert
         * dans cette session, l'Explorer est
         * actualisé.
         */

        if (
            FS &&
            FS.hasRealProject &&
            FS.hasRealProject()
        ) {

            projectOpened = true;

            projectName =
                FS.getProjectName();

            await refreshExplorer();

        } else {

            renderFallbackExplorer();
        }

        /*
         * Restaurer le dernier onglet.
         */

        if (
            activeFile &&
            FS &&
            projectOpened
        ) {

            try {
                await openFile(
                    activeFile
                );
            } catch {
                activeFile = null;
            }

        }

        /*
         * Si aucun fichier réel n'est encore
         * ouvert, on laisse l'interface intacte.
         */

        setStatus(
            projectOpened
                ? `Projet : ${projectName}`
                : "GCODE prêt"
        );

        console.log(
            "GCODE V3 REAL EDITOR chargé."
        );
    }

    /* =====================================================
       API PUBLIQUE
    ===================================================== */

    window.GCODE = {

        openProject,

        openFile,

        createFile,

        createFolder,

        deleteCurrentFile,

        renameCurrentFile,

        refreshExplorer,

        importFile,

        exportCurrentFile,

        saveCurrentFile,

        undo,

        redo,

        getActiveFile() {
            return activeFile;
        },

        getProjectName() {
            return projectName;
        },

        getProjectOpened() {
            return projectOpened;
        }
    };

    initialize();

})();
