(() => {
    "use strict";

    /*
    ============================================================
    GCODE - TERMINAL RUNTIME BRIDGE V4
    ============================================================

    Rôle :
    - Fournir une API runtime à script.js
    - Préparer l'exécution réelle de Node / npm / npx
    - Détecter un éventuel runtime natif
    - Ne pas simuler silencieusement une vraie exécution
    - Fonctionner dans le navigateur sans provoquer d'erreur

    API principale :

        window.GCODERuntime

    Méthodes :

        canRun()
        getStatus()
        connect()
        disconnect()
        run()
        execute()
        version()

    ============================================================
    */

    const VERSION = "4.0.0";

    const state = {
        connected: false,
        provider: "browser",
        runtime: "none",
        version: VERSION
    };


    /* =========================================================
       UTILITAIRES
    ========================================================= */

    function safeString(value) {
        if (value === undefined || value === null) {
            return "";
        }

        return String(value);
    }


    function createResult(ok, output, extra = {}) {
        return {
            ok: Boolean(ok),
            output: safeString(output),
            provider: state.provider,
            runtime: state.runtime,
            ...extra
        };
    }


    function emit(name, detail = {}) {
        try {
            window.dispatchEvent(
                new CustomEvent(`gcode-runtime:${name}`, {
                    detail
                })
            );
        } catch (error) {
            // Ignore event errors.
        }
    }


    /* =========================================================
       DETECTION DES RUNTIMES
    ========================================================= */

    function detectElectron() {
        return Boolean(
            window.electronAPI ||
            window.electron ||
            window.require
        );
    }


    function detectTauri() {
        return Boolean(
            window.__TAURI__ ||
            window.__TAURI_INTERNALS__
        );
    }


    function detectNativeBridge() {
        return Boolean(
            window.gcodeNativeBridge &&
            typeof window.gcodeNativeBridge.run === "function"
        );
    }


    function detectRuntime() {

        if (detectNativeBridge()) {
            return {
                provider: "gcode-native",
                runtime: "native"
            };
        }


        if (detectElectron()) {
            return {
                provider: "electron",
                runtime: "electron"
            };
        }


        if (detectTauri()) {
            return {
                provider: "tauri",
                runtime: "tauri"
            };
        }


        return {
            provider: "browser",
            runtime: "none"
        };
    }


    function refreshRuntimeState() {

        const detected = detectRuntime();

        state.provider = detected.provider;
        state.runtime = detected.runtime;

        state.connected =
            detected.runtime !== "none";

        return state;
    }


    /* =========================================================
       STATUT
    ========================================================= */

    function canRun() {

        refreshRuntimeState();

        return state.connected;
    }


    function getStatus() {

        refreshRuntimeState();

        return {
            connected: state.connected,
            provider: state.provider,
            runtime: state.runtime,
            version: state.version,
            browser: true,
            realRuntime: state.connected
        };
    }


    function version() {

        return VERSION;
    }


    /* =========================================================
       CONNEXION
    ========================================================= */

    async function connect() {

        refreshRuntimeState();

        if (state.connected) {

            emit("connected", {
                provider: state.provider,
                runtime: state.runtime
            });

            return createResult(
                true,
                `[GCODE] Runtime connecté : ${state.provider}`
            );
        }


        return createResult(
            false,
            "[GCODE] Aucun runtime Node/natif disponible dans ce navigateur."
        );
    }


    async function disconnect() {

        state.connected = false;

        state.provider = "browser";
        state.runtime = "none";

        emit("disconnected");

        return createResult(
            true,
            "[GCODE] Runtime déconnecté."
        );
    }


    /* =========================================================
       EXÉCUTION NATIVE
    ========================================================= */

    async function run(command, args = [], options = {}) {

        command = safeString(command).trim();

        if (!command) {

            return createResult(
                false,
                "[GCODE] Commande vide."
            );
        }


        refreshRuntimeState();


        /*
        --------------------------------------------------------
        GCODE NATIVE BRIDGE
        --------------------------------------------------------
        */

        if (
            window.gcodeNativeBridge &&
            typeof window.gcodeNativeBridge.run === "function"
        ) {

            try {

                const result =
                    await window.gcodeNativeBridge.run({
                        command,
                        args,
                        cwd: options.cwd || null,
                        env: options.env || {}
                    });


                return createResult(
                    result?.ok !== false,
                    result?.output ?? result?.stdout ?? "",
                    {
                        stderr: result?.stderr || "",
                        exitCode:
                            typeof result?.exitCode === "number"
                                ? result.exitCode
                                : 0
                    }
                );

            } catch (error) {

                return createResult(
                    false,
                    `[GCODE] Erreur runtime : ${error.message}`
                );
            }
        }


        /*
        --------------------------------------------------------
        ELECTRON
        --------------------------------------------------------
        */

        if (
            window.electronAPI &&
            typeof window.electronAPI.runCommand === "function"
        ) {

            try {

                const result =
                    await window.electronAPI.runCommand({
                        command,
                        args,
                        cwd: options.cwd || null,
                        env: options.env || {}
                    });


                return createResult(
                    result?.ok !== false,
                    result?.output ?? result?.stdout ?? "",
                    {
                        stderr: result?.stderr || "",
                        exitCode:
                            typeof result?.exitCode === "number"
                                ? result.exitCode
                                : 0
                    }
                );

            } catch (error) {

                return createResult(
                    false,
                    `[GCODE] Erreur Electron : ${error.message}`
                );
            }
        }


        /*
        --------------------------------------------------------
        TAURI
        --------------------------------------------------------
        */

        if (
            window.__TAURI__ &&
            window.__TAURI__.shell &&
            typeof window.__TAURI__.shell.Command === "function"
        ) {

            try {

                const Command =
                    window.__TAURI__.shell.Command;


                const child =
                    await Command.create(
                        command,
                        args
                    ).execute();


                return createResult(
                    child.code === 0,
                    child.stdout || child.stderr || "",
                    {
                        stderr: child.stderr || "",
                        exitCode: child.code
                    }
                );

            } catch (error) {

                return createResult(
                    false,
                    `[GCODE] Erreur Tauri : ${error.message}`
                );
            }
        }


        /*
        --------------------------------------------------------
        NAVIGATEUR
        --------------------------------------------------------
        */

        return createResult(
            false,
            [
                `[GCODE] Impossible d'exécuter "${command}" directement dans le navigateur.`,
                "",
                "[GCODE] Aucun runtime Node.js natif n'est connecté.",
                "[GCODE] Le terminal GCODE reste disponible pour les commandes intégrées."
            ].join("\n")
        );
    }


    /* =========================================================
       ALIAS EXECUTE
    ========================================================= */

    async function execute(command, args = [], options = {}) {

        return run(
            command,
            args,
            options
        );
    }


    /* =========================================================
       NODE
    ========================================================= */

    async function node(code = "", options = {}) {

        code = safeString(code);

        return run(
            "node",
            code ? ["-e", code] : [],
            options
        );
    }


    /* =========================================================
       NPM
    ========================================================= */

    async function npm(args = [], options = {}) {

        if (!Array.isArray(args)) {
            args = safeString(args)
                .split(/\s+/)
                .filter(Boolean);
        }

        return run(
            "npm",
            args,
            options
        );
    }


    /* =========================================================
       NPX
    ========================================================= */

    async function npx(args = [], options = {}) {

        if (!Array.isArray(args)) {
            args = safeString(args)
                .split(/\s+/)
                .filter(Boolean);
        }

        return run(
            "npx",
            args,
            options
        );
    }


    /* =========================================================
       GIT
    ========================================================= */

    async function git(args = [], options = {}) {

        if (!Array.isArray(args)) {
            args = safeString(args)
                .split(/\s+/)
                .filter(Boolean);
        }

        return run(
            "git",
            args,
            options
        );
    }


    /* =========================================================
       TERMINAL ENVIRONMENT
    ========================================================= */

    function getEnvironment() {

        return {
            GCODE_VERSION: VERSION,
            GCODE_RUNTIME: state.runtime,
            GCODE_PROVIDER: state.provider,
            GCODE_CONNECTED: String(state.connected),
            PLATFORM:
                typeof navigator !== "undefined"
                    ? navigator.platform
                    : "unknown",
            USER_AGENT:
                typeof navigator !== "undefined"
                    ? navigator.userAgent
                    : "unknown"
        };
    }


    /* =========================================================
       INITIALISATION
    ========================================================= */

    function initialize() {

        refreshRuntimeState();

        emit(
            "ready",
            getStatus()
        );
    }


    /* =========================================================
       API PUBLIQUE
    ========================================================= */

    window.GCODERuntime = {

        version,

        canRun,

        getStatus,

        connect,

        disconnect,

        run,

        execute,

        node,

        npm,

        npx,

        git,

        getEnvironment

    };


    /*
    ============================================================
    ÉVÉNEMENTS
    ============================================================
    */

    window.addEventListener(
        "gcode-runtime:connect",
        () => {
            connect();
        }
    );


    /*
    ============================================================
    READY
    ============================================================
    */

    if (
        document.readyState === "loading"
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
