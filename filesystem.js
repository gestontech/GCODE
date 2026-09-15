/* =========================================================
   GCODE
   REAL PROJECT FILE SYSTEM
   Aucun changement du thème
========================================================= */

(() => {
    "use strict";

    const GCODE_FS_VERSION = "1.0.0";

    let projectDirectory = null;
    let currentDirectory = null;

    const memoryFiles = new Map();
    const memoryDirectories = new Set(["/"]);

    /* =====================================================
       EVENTS
    ===================================================== */

    const events = {
        change: [],
        open: [],
        save: [],
        error: []
    };

    function on(event, callback) {
        if (!events[event]) return;

        events[event].push(callback);
    }

    function emit(event, data) {
        if (!events[event]) return;

        events[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(
                    "GCODE FS event error:",
                    error
                );
            }
        });
    }

    /* =====================================================
       SUPPORT
    ===================================================== */

    function supportsFileSystemAccess() {
        return (
            typeof window !== "undefined" &&
            "showDirectoryPicker" in window
        );
    }

    function supportsFileSave() {
        return (
            typeof window !== "undefined" &&
            "showSaveFilePicker" in window
        );
    }

    /* =====================================================
       PATH HELPERS
    ===================================================== */

    function normalizePath(path) {
        if (!path) return "/";

        let value = String(path)
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

    function getFileName(path) {
        const normalized =
            normalizePath(path);

        return normalized
            .split("/")
            .pop();
    }

    function getParentPath(path) {
        const normalized =
            normalizePath(path);

        if (normalized === "/") {
            return "/";
        }

        const parts =
            normalized.split("/");

        parts.pop();

        const parent =
            parts.join("/");

        return parent || "/";
    }

    function joinPath(parent, name) {
        const base =
            normalizePath(parent);

        const cleanName =
            String(name)
                .replace(/^\/+/, "")
                .replace(/\/+$/, "");

        if (base === "/") {
            return "/" + cleanName;
        }

        return base + "/" + cleanName;
    }

    /* =====================================================
       MEMORY FALLBACK
    ===================================================== */

    function setMemoryFile(path, content) {
        const normalized =
            normalizePath(path);

        memoryFiles.set(
            normalized,
            String(content)
        );

        memoryDirectories.add(
            getParentPath(normalized)
        );

        emit("change", {
            type: "write",
            path: normalized
        });
    }

    function getMemoryFile(path) {
        return memoryFiles.get(
            normalizePath(path)
        );
    }

    /* =====================================================
       OPEN PROJECT
    ===================================================== */

    async function openProject() {

        if (!supportsFileSystemAccess()) {

            throw new Error(
                "Le navigateur actuel ne prend pas en charge l'accès direct aux dossiers."
            );
        }

        try {

            projectDirectory =
                await window.showDirectoryPicker({
                    mode: "readwrite"
                });

            currentDirectory =
                projectDirectory;

            emit("open", {
                name:
                    projectDirectory.name
            });

            return projectDirectory;

        } catch (error) {

            if (
                error &&
                error.name ===
                "AbortError"
            ) {
                return null;
            }

            emit("error", error);

            throw error;
        }
    }

    /* =====================================================
       DIRECTORY HANDLE
    ===================================================== */

    async function getDirectoryHandle(
        path,
        create = false
    ) {

        if (!projectDirectory) {
            throw new Error(
                "Aucun projet ouvert."
            );
        }

        const normalized =
            normalizePath(path);

        if (normalized === "/") {
            return projectDirectory;
        }

        const parts =
            normalized
                .split("/")
                .filter(Boolean);

        let handle =
            projectDirectory;

        for (const part of parts) {

            handle =
                await handle.getDirectoryHandle(
                    part,
                    {
                        create
                    }
                );
        }

        return handle;
    }

    /* =====================================================
       FILE HANDLE
    ===================================================== */

    async function getFileHandle(
        path,
        create = false
    ) {

        const normalized =
            normalizePath(path);

        const parent =
            getParentPath(normalized);

        const fileName =
            getFileName(normalized);

        const directory =
            await getDirectoryHandle(
                parent,
                create
            );

        return directory.getFileHandle(
            fileName,
            {
                create
            }
        );
    }

    /* =====================================================
       READ FILE
    ===================================================== */

    async function readFile(path) {

        const normalized =
            normalizePath(path);

        if (!projectDirectory) {

            const memory =
                getMemoryFile(
                    normalized
                );

            if (
                typeof memory ===
                "undefined"
            ) {
                throw new Error(
                    `Fichier introuvable : ${normalized}`
                );
            }

            return memory;
        }

        try {

            const handle =
                await getFileHandle(
                    normalized,
                    false
                );

            const file =
                await handle.getFile();

            return await file.text();

        } catch (error) {

            emit("error", error);

            throw error;
        }
    }

    /* =====================================================
       WRITE FILE
    ===================================================== */

    async function writeFile(
        path,
        content
    ) {

        const normalized =
            normalizePath(path);

        const text =
            String(content ?? "");

        if (!projectDirectory) {

            setMemoryFile(
                normalized,
                text
            );

            emit("save", {
                path: normalized
            });

            return true;
        }

        try {

            const handle =
                await getFileHandle(
                    normalized,
                    true
                );

            const writable =
                await handle.createWritable();

            await writable.write(text);

            await writable.close();

            emit("save", {
                path: normalized
            });

            emit("change", {
                type: "write",
                path: normalized
            });

            return true;

        } catch (error) {

            emit("error", error);

            throw error;
        }
    }

    /* =====================================================
       CREATE DIRECTORY
    ===================================================== */

    async function createDirectory(
        path
    ) {

        const normalized =
            normalizePath(path);

        if (!projectDirectory) {

            memoryDirectories.add(
                normalized
            );

            emit("change", {
                type: "directory-created",
                path: normalized
            });

            return true;
        }

        try {

            await getDirectoryHandle(
                normalized,
                true
            );

            emit("change", {
                type: "directory-created",
                path: normalized
            });

            return true;

        } catch (error) {

            emit("error", error);

            throw error;
        }
    }

    /* =====================================================
       DELETE FILE / DIRECTORY
    ===================================================== */

    async function deletePath(
        path,
        recursive = false
    ) {

        const normalized =
            normalizePath(path);

        if (normalized === "/") {
            throw new Error(
                "Impossible de supprimer la racine du projet."
            );
        }

        if (!projectDirectory) {

            memoryFiles.delete(
                normalized
            );

            memoryDirectories.delete(
                normalized
            );

            emit("change", {
                type: "delete",
                path: normalized
            });

            return true;
        }

        try {

            const parent =
                getParentPath(
                    normalized
                );

            const name =
                getFileName(
                    normalized
                );

            const directory =
                await getDirectoryHandle(
                    parent,
                    false
                );

            await directory.removeEntry(
                name,
                {
                    recursive
                }
            );

            emit("change", {
                type: "delete",
                path: normalized
            });

            return true;

        } catch (error) {

            emit("error", error);

            throw error;
        }
    }

    /* =====================================================
       RENAME
    ===================================================== */

    async function renameFile(
        oldPath,
        newPath
    ) {

        const oldNormalized =
            normalizePath(oldPath);

        const newNormalized =
            normalizePath(newPath);

        const content =
            await readFile(
                oldNormalized
            );

        await writeFile(
            newNormalized,
            content
        );

        await deletePath(
            oldNormalized
        );

        emit("change", {
            type: "rename",
            oldPath:
                oldNormalized,
            newPath:
                newNormalized
        });

        return true;
    }

    /* =====================================================
       LIST DIRECTORY
    ===================================================== */

    async function listDirectory(
        path = "/"
    ) {

        const normalized =
            normalizePath(path);

        if (!projectDirectory) {

            const result = [];

            const prefix =
                normalized === "/"
                    ? "/"
                    : normalized + "/";

            memoryDirectories.forEach(
                directory => {

                    if (
                        directory !==
                        normalized &&
                        directory.startsWith(
                            prefix
                        )
                    ) {

                        const remainder =
                            directory.slice(
                                prefix.length
                            );

                        if (
                            remainder &&
                            !remainder.includes("/")
                        ) {

                            result.push({
                                name:
                                    remainder,
                                kind:
                                    "directory",
                                path:
                                    directory
                            });
                        }
                    }
                }
            );

            memoryFiles.forEach(
                (_, filePath) => {

                    if (
                        filePath.startsWith(
                            prefix
                        )
                    ) {

                        const remainder =
                            filePath.slice(
                                prefix.length
                            );

                        if (
                            remainder &&
                            !remainder.includes("/")
                        ) {

                            result.push({
                                name:
                                    remainder,
                                kind:
                                    "file",
                                path:
                                    filePath
                            });
                        }
                    }
                }
            );

            return result;
        }

        try {

            const directory =
                await getDirectoryHandle(
                    normalized,
                    false
                );

            const result = [];

            for await (
                const [
                    name,
                    handle
                ]
                of directory.entries()
            ) {

                result.push({
                    name,
                    kind:
                        handle.kind,
                    path:
                        joinPath(
                            normalized,
                            name
                        )
                });
            }

            result.sort(
                (a, b) => {

                    if (
                        a.kind !==
                        b.kind
                    ) {

                        return a.kind ===
                            "directory"
                            ? -1
                            : 1;
                    }

                    return a.name.localeCompare(
                        b.name
                    );
                }
            );

            return result;

        } catch (error) {

            emit("error", error);

            throw error;
        }
    }

    /* =====================================================
       IMPORT LOCAL FILE
    ===================================================== */

    async function importLocalFile(
        file
    ) {

        if (!file) {
            return null;
        }

        const content =
            await file.text();

        const path =
            "/" + file.name;

        await writeFile(
            path,
            content
        );

        return {
            name:
                file.name,
            path,
            content
        };
    }

    /* =====================================================
       EXPORT FILE
    ===================================================== */

    async function exportFile(
        path,
        content
    ) {

        const text =
            String(content ?? "");

        if (
            supportsFileSave()
        ) {

            try {

                const handle =
                    await window.showSaveFilePicker({
                        suggestedName:
                            getFileName(path)
                    });

                const writable =
                    await handle.createWritable();

                await writable.write(text);

                await writable.close();

                return true;

            } catch (error) {

                if (
                    error &&
                    error.name ===
                    "AbortError"
                ) {
                    return false;
                }

                throw error;
            }
        }

        const blob =
            new Blob(
                [text],
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
            getFileName(path);

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();

        URL.revokeObjectURL(
            url
        );

        return true;
    }

    /* =====================================================
       PROJECT INFO
    ===================================================== */

    function getProjectName() {

        if (
            projectDirectory
        ) {
            return projectDirectory.name;
        }

        return "GCODE";
    }

    function hasRealProject() {
        return !!projectDirectory;
    }

    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.GCODEFileSystem = {

        version:
            GCODE_FS_VERSION,

        on,

        openProject,

        readFile,

        writeFile,

        createDirectory,

        deletePath,

        renameFile,

        listDirectory,

        importLocalFile,

        exportFile,

        getProjectName,

        hasRealProject,

        supportsFileSystemAccess,

        supportsFileSave,

        normalizePath,

        getFileName,

        getParentPath,

        joinPath
    };

    console.log(
        `GCODE File System ${GCODE_FS_VERSION} chargé.`
    );

})();
