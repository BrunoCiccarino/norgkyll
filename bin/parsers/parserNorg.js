"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseNorgToHtml = parseNorgToHtml;
const highlight_js_1 = __importDefault(require("highlight.js"));
function isValidTaskState(state) {
    return ["( )", "(x)", "(-)", "(=)", "(_)", "(!)", "(?)", "(+)"].includes(state);
}
function parseNorgToHtml(norgContent) {
    const lines = norgContent.split("\n");
    let inCodeBlock = false;
    let codeBlockLanguage = "";
    let codeBlockContent = "";
    let inMetadataBlock = false;
    let metadataContent = "";
    let html = "";
    const stack = [];
    for (const line of lines) {
        if (line.trim().startsWith("@document.meta")) {
            inMetadataBlock = true;
            metadataContent = "";
            continue;
        }
        if (line.trim().startsWith("@end") && inMetadataBlock) {
            const metadataHtml = processMetadata(metadataContent);
            html += metadataHtml;
            inMetadataBlock = false;
            metadataContent = "";
            continue;
        }
        if (inMetadataBlock) {
            metadataContent += (metadataContent ? "\n" : "") + line.trim();
            continue;
        }
        if (line.startsWith("*")) {
            const level = countLeadingChars(line, "*");
            const headingText = line.slice(level).trim();
            html += `<h${level}>${escapeHtml(headingText)}</h${level}>\n`;
            continue;
        }
        if (line.trim().startsWith("- ")) {
            if (!stack.includes("ul")) {
                stack.push("ul");
                html += "<ul>\n";
            }
            html += `<li>${escapeHtml(line.trim().slice(2))}</li>\n`;
            continue;
        }
        if (line.trim().startsWith("~ ")) {
            if (!stack.includes("ol")) {
                stack.push("ol");
                html += "<ol>\n";
            }
            html += `<li>${escapeHtml(line.slice(2).trim())}</li>\n`;
            continue;
        }
        if (line.trim() === "" && stack.length > 0) {
            while (stack.length > 0) {
                const tag = stack.pop();
                html += `</${tag}>\n`;
            }
            continue;
        }
        if (line.trim().startsWith("@code")) {
            const parts = line.trim().split(" ");
            const language = parts.length > 1 ? parts[1] : "plaintext";
            const validLang = highlight_js_1.default.getLanguage(language) ? language : 'plaintext';
            codeBlockLanguage = validLang;
            inCodeBlock = true;
            codeBlockContent = "";
            continue;
        }
        if (line.trim() === "@end" && inCodeBlock) {
            try {
                const highlightedCode = highlight_js_1.default.highlight(codeBlockContent.trim(), {
                    language: codeBlockLanguage,
                    ignoreIllegals: true,
                }).value;
                html += `<pre><code class="language-${escapeHtml(codeBlockLanguage)}">${highlightedCode}</code></pre>\n`;
            }
            catch (error) {
                console.error(`Error highlighting code block with language "${codeBlockLanguage}":`, error);
                html += `<pre><code class="language-${escapeHtml(codeBlockLanguage)}">${escapeHtml(codeBlockContent.trim())}</code></pre>\n`;
            }
            inCodeBlock = false;
            codeBlockLanguage = "";
            codeBlockContent = "";
            continue;
        }
        if (inCodeBlock) {
            codeBlockContent += `${line}\n`;
            continue;
        }
        if (line.trim().startsWith("- (")) {
            const taskStateEnd = line.indexOf(")");
            if (taskStateEnd !== -1) {
                const state = line.slice(2, taskStateEnd + 1);
                if (!isValidTaskState(state)) {
                    //    console.warn(`Invalid task state: ${state}`);
                    continue;
                }
                const taskText = line.slice(taskStateEnd + 2).trim();
            }
        }
        const inlineMarkup = processInlineMarkup(line);
        if (inlineMarkup !== line) {
            html += `<p>${inlineMarkup}</p>\n`;
            continue;
        }
        if (line.trim() !== "") {
            html += `<p>${escapeHtml(line.trim())}</p>\n`;
        }
    }
    while (stack.length > 0) {
        const tag = stack.pop();
        html += `</${tag}>\n`;
    }
    return html;
}
function processMetadata(metadataContent) {
    const lines = metadataContent.split("\n");
    let html = '<div class="metadata">\n';
    for (const line of lines) {
        const colonIndex = line.indexOf(":");
        if (colonIndex !== -1) {
            const [key, value] = line.split(":", 2).map((part) => part.trim());
            html += `<meta name="${escapeHtml(key.toLowerCase())}" content="${escapeHtml(value)}">\n`;
        }
    }
    html += "</div>\n";
    return html;
}
function escapeHtml(text) {
    return text.split("&").join("&amp;")
        .split("<").join("&lt;")
        .split(">").join("&gt;")
        .split('"').join("&quot;")
        .split("'").join("&#039;");
}
function processInlineMarkup(text) {
    let result = text;
    result = replaceMarkup(result, "*", "strong");
    result = replaceMarkup(result, "/", "em");
    result = replaceMarkup(result, "_", "u");
    result = replaceMarkup(result, "^", "sup");
    result = replaceMarkup(result, ",", "sub");
    return result;
}
function replaceMarkup(text, symbol, tag) {
    while (true) {
        const start = text.indexOf(symbol);
        if (start === -1)
            break;
        const end = text.indexOf(symbol, start + 1);
        if (end === -1)
            break;
        const content = text.slice(start + 1, end);
        text = text.slice(0, start) + `<${tag}>${content}</${tag}>` + text.slice(end + 1);
    }
    return text;
}
function getTaskStateClass(state) {
    switch (state) {
        case "( )": return "todo-undone";
        case "(x)": return "todo-done";
        case "(-)": return "todo-pending";
        case "(=)": return "todo-onhold";
        case "(_)": return "todo-cancelled";
        case "(!)": return "todo-urgent";
        case "(?)": return "todo-ambiguous";
        case "(+)": return "todo-recurring";
        default: return "todo-unknown";
    }
}
function countLeadingChars(text, char) {
    let count = 0;
    while (count < text.length && text[count] === char)
        count++;
    return count;
}