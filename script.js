/* =========================================================
   GCODE
   INTERFACE CONTROLLER
========================================================= */


/* =========================================================
   ELEMENTS
========================================================= */

const sidebar = document.getElementById("sidebar");
const editorTabs = document.getElementById("editorTabs");
const codeDisplay = document.getElementById("codeDisplay");
const breadcrumbFile = document.getElementById("breadcrumbFile");
const lineNumbers = document.getElementById("lineNumbers");
const language = document.getElementById("language");
const cursorPosition = document.getElementById("cursorPosition");
const terminalInput = document.querySelector(".terminal-input");


/* =========================================================
   FILE CONTENT
========================================================= */

const files = {

    "style.css": {
        language: "CSS",

        html: `
<span class="comment">/* GCODE Editor */</span>

<span class="selector">body</span> {
    <span class="property">margin</span>: <span class="value">0</span>;
    <span class="property">padding</span>: <span class="value">0</span>;
    <span class="property">background</span>: <span class="value">#1e1e1e</span>;
    <span class="property">color</span>: <span class="value">#cccccc</span>;
}

<span class="selector">.editor</span> {
    <span class="property">display</span>: <span class="value">flex</span>;
    <span class="property">height</span>: <span class="value">100vh</span>;
}

<span class="comment">/* Terminal */</span>

<span class="selector">.terminal</span> {
    <span class="property">height</span>: <span class="value">240px</span>;
}

<span class="comment">/* End */</span>
        `
    },


    "index.html": {
        language: "HTML",

        html: `
<span class="comment">&lt;!-- GCODE --&gt;</span>

<span class="selector">&lt;!DOCTYPE html&gt;</span>

<span class="selector">&lt;html</span> <span class="property">lang</span>=<span class="value">"fr"</span><span class="selector">&gt;</span>

    <span class="selector">&lt;head&gt;</span>

        <span class="selector">&lt;meta</span>
            <span class="property">charset</span>=<span class="value">"UTF-8"</span>
        <span class="selector">/&gt;</span>

        <span class="selector">&lt;title&gt;</span>
            GCODE
        <span class="selector">&lt;/title&gt;</span>

    <span class="selector">&lt;/head&gt;</span>

    <span class="selector">&lt;body&gt;</span>

        <span class="selector">&lt;div</span> <span class="property">id</span>=<span class="value">"app"</span><span class="selector">&gt;</span>

            GCODE Editor

        <span class="selector">&lt;/div&gt;</span>

    <span class="selector">&lt;/body&gt;</span>

<span class="selector">&lt;/html&gt;</span>
        `
    },


    "script.js": {
        language: "JavaScript",

        html: `
<span class="comment">// GCODE JavaScript</span>

<span class="selector">const</span> app = {

    <span class="property">name</span>:
        <span class="value">"GCODE"</span>,

    <span class="property">version</span>:
        <span class="value">"3.0.0"</span>,

    <span class="property">start</span>() {

        <span class="selector">console</span>.<span class="property">log</span>(
            <span class="value">"GCODE started"</span>
        );

    }

};

app.<span class="property">start</span>();
        `
    }

};


/* =========================================================
   OPEN FILE
========================================================= */

function openFile(fileName) {

    if (!files[fileName]) {
        return;
    }

    const file = files[fileName];

    codeDisplay.innerHTML = file.html;

    breadcrumbFile.textContent = fileName;

    language.textContent = file.language;

    updateLineNumbers();

    updateActiveTab(fileName);

}


/* =========================================================
   UPDATE TABS
========================================================= */

function updateActiveTab(fileName) {

    document.querySelectorAll(".editor-tab").forEach(tab => {

        tab.classList.remove("active");

        if (tab.dataset.file === fileName) {
            tab.classList.add("active");
        }

    });

}


/* =========================================================
   LINE NUMBERS
========================================================= */

function updateLineNumbers() {

    const text = codeDisplay.innerText || "";

    const lines = text.split("\n").length;

    lineNumbers.innerHTML = "";

    for (let i = 1; i <= Math.max(lines, 20); i++) {

        const span = document.createElement("span");

        span.textContent = i;

        lineNumbers.appendChild(span);

    }

}


/* =========================================================
   FILE TREE
========================================================= */

document.querySelectorAll(".tree-item.file").forEach(item => {

    item.addEventListener("click", () => {

        const fileName = item.dataset.file;

        if (!fileName) {
            return;
        }

        document.querySelectorAll(".tree-item.file").forEach(file => {
            file.classList.remove("selected");
        });

        item.classList.add("selected");

        openFile(fileName);

    });

});


/* =========================================================
   EDITOR TABS
========================================================= */

document.querySelectorAll(".editor-tab").forEach(tab => {

    tab.addEventListener("click", event => {

        if (event.target.classList.contains("tab-close")) {
            return;
        }

        const fileName = tab.dataset.file;

        openFile(fileName);

    });

});


/* =========================================================
   CLOSE TAB
========================================================= */

document.querySelectorAll(".tab-close").forEach(closeButton => {

    closeButton.addEventListener("click", event => {

        event.stopPropagation();

        const tab = closeButton.closest(".editor-tab");

        const fileName = tab.dataset.file;

        tab.remove();

        const remainingTab =
            document.querySelector(".editor-tab");

        if (remainingTab) {

            openFile(
                remainingTab.dataset.file
            );

        } else {

            codeDisplay.innerHTML = "";

            breadcrumbFile.textContent = "";

        }

    });

});


/* =========================================================
   FOLDERS
========================================================= */

document.querySelectorAll(".tree-item.folder").forEach(folder => {

    folder.addEventListener("click", () => {

        const arrow = folder.querySelector(".arrow");

        if (!arrow) {
            return;
        }

        if (arrow.textContent === "›") {

            arrow.textContent = "⌄";

        } else {

            arrow.textContent = "›";

        }

    });

});


/* =========================================================
   ACTIVITY BAR
========================================================= */

document.querySelectorAll(".activity-item").forEach(item => {

    item.addEventListener("click", () => {

        document
            .querySelectorAll(".activity-item")
            .forEach(button => {
                button.classList.remove("active");
            });

        item.classList.add("active");

        const panel = item.dataset.panel;

        if (panel === "explorer") {

            sidebar.style.display = "flex";

        }

        if (
            panel === "search" ||
            panel === "source" ||
            panel === "run" ||
            panel === "extensions"
        ) {

            showTemporaryPanel(panel);

        }

    });

});


/* =========================================================
   TEMPORARY SIDEBAR PANELS
========================================================= */

function showTemporaryPanel(type) {

    const titles = {

        search: "SEARCH",

        source: "SOURCE CONTROL",

        run: "RUN AND DEBUG",

        extensions: "EXTENSIONS"

    };

    if (!titles[type]) {
        return;
    }

    sidebar.innerHTML = `

        <div class="sidebar-header">

            <span>${titles[type]}</span>

            <button class="sidebar-more">
                •••
            </button>

        </div>

        <div style="
            padding:20px;
            color:#888;
            font-size:12px;
        ">

            ${

                type === "search"

                ? "Search files and symbols"

                : type === "source"

                ? "No source control changes"

                : type === "run"

                ? "Run and Debug"

                : "Browse Extensions"

            }

        </div>

    `;

}


/* =========================================================
   COMMAND SEARCH
========================================================= */

const commandSearch =
    document.querySelector(".command-search");

commandSearch.addEventListener("click", () => {

    const command = prompt(
        "GCODE — Command Palette"
    );

    if (!command) {
        return;
    }

    if (
        command.toLowerCase().includes("terminal")
    ) {

        document
            .getElementById("terminal")
            .scrollIntoView();

    }

});


/* =========================================================
   TERMINAL
========================================================= */

terminalInput.addEventListener("keydown", event => {

    if (event.key !== "Enter") {
        return;
    }

    event.preventDefault();

    const command =
        terminalInput.innerText.trim();

    if (!command) {
        return;
    }

    executeTerminalCommand(command);

    terminalInput.innerText = "";

});


/* =========================================================
   TERMINAL COMMANDS
========================================================= */

function executeTerminalCommand(command) {

    const terminal =
        document.getElementById("terminal");

    const line =
        document.createElement("div");

    line.style.marginTop = "8px";

    line.innerHTML = `

        <span style="color:#569cd6;">
            PS
        </span>

        <span style="margin-left:7px;">
            D:\\GCODE&gt;
        </span>

        <span style="margin-left:5px;">
            ${escapeHtml(command)}
        </span>

    `;

    terminal.insertBefore(
        line,
        terminal.querySelector(".terminal-line")
    );


    const response =
        document.createElement("div");

    response.style.marginTop = "3px";

    if (command === "help") {

        response.textContent =
            "Available commands: help, clear, ls, pwd, version";

    } else if (command === "clear") {

        terminal.innerHTML = `
            <div class="terminal-line">

                <span class="terminal-prompt">
                    PS
                </span>

                <span class="terminal-path">
                    D:\\GCODE&gt;
                </span>

                <span
                    class="terminal-input"
                    contenteditable="true"
                    spellcheck="false"
                ></span>

                <span class="terminal-cursor">
                    █
                </span>

            </div>
        `;

        reconnectTerminal();

        return;

    } else if (command === "ls") {

        response.textContent =
            ".github  src  assets  index.html  style.css  script.js";

    } else if (command === "pwd") {

        response.textContent =
            "D:\\GCODE";

    } else if (command === "version") {

        response.textContent =
            "GCODE 3.0.0";

    } else {

        response.textContent =
            `'${command}' is not recognized as a GCODE command.`;

    }

    terminal.insertBefore(
        response,
        terminal.querySelector(".terminal-line")
    );

}


/* =========================================================
   TERMINAL RECONNECT
========================================================= */

function reconnectTerminal() {

    const input =
        document.querySelector(".terminal-input");

    if (!input) {
        return;
    }

    input.addEventListener("keydown", event => {

        if (event.key === "Enter") {

            event.preventDefault();

            const command =
                input.innerText.trim();

            if (command) {
                executeTerminalCommand(command);
            }

            input.innerText = "";

        }

    });

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   CURSOR POSITION
========================================================= */

document
    .getElementById("codeEditor")
    .addEventListener("click", () => {

        cursorPosition.textContent =
            "Ln 1, Col 1";

    });


/* =========================================================
   BACK / FORWARD
========================================================= */

document
    .getElementById("backBtn")
    .addEventListener("click", () => {

        console.log("Back");

    });


document
    .getElementById("forwardBtn")
    .addEventListener("click", () => {

        console.log("Forward");

    });


/* =========================================================
   WINDOW CLOSE
========================================================= */

document
    .getElementById("closeWindow")
    .addEventListener("click", () => {

        const confirmation =
            confirm("Fermer GCODE ?");

        if (confirmation) {

            document.body.innerHTML = "";

        }

    });


/* =========================================================
   INITIALIZATION
========================================================= */

updateLineNumbers();

openFile("style.css");

console.log(
    "%cGCODE 3.0.0",
    "color:#4daafc;font-size:20px;font-weight:bold;"
);

console.log(
    "GCODE Editor initialized."
);
