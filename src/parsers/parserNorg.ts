import hljs from "highlight.js";

type TaskState = "( )" | "(x)" | "(-)" | "(=)" | "(_)" | "(!)" | "(?)" | "(+)";
type InlineMarkup = "*" | "/" | "_" | "^" | ",";

export function parseNorgToHtml(norgContent: string): string {
    const lines = norgContent.split("\n");
    let inCodeBlock = false;
    let codeBlockLanguage = "";
    let codeBlockContent = "";
    let inMetadataBlock = false;
    let metadataContent = "";

    let html = "";
    const stack: string[] = [];

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
            html += `<li>${escapeHtml(line.trim().slice(2))}</li>\n`;
            continue;
        }

        if (line.trim() === "" && stack.length > 0) {
            while (stack.length > 0) {
                const tag = stack.pop();
                html += `</${tag}>\n`;
            }
            continue;
        }

        console.log(`Processing line: "${line}"`);
        if (line.trim().startsWith("@code")) {
            const parts = line.trim().split(" ");
            const language = parts.length > 1 ? parts[1] : "plaintext";
            console.log(`Starting code block with language: ${language}`);

            inCodeBlock = true;
            codeBlockLanguage = language;
            codeBlockContent = "";
            continue;
        }

        if (line.trim() === "@end" && inCodeBlock) {
            console.log(`Code block content before highlighting:\n${codeBlockContent}`);
            const highlightedCode = hljs.highlight(codeBlockLanguage, codeBlockContent.trim(), true).value;
            html += `<pre><code class="language-${escapeHtml(codeBlockLanguage)}">${highlightedCode}</code></pre>\n`;
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
                const state = line.slice(2, taskStateEnd + 1) as TaskState;
                const taskText = line.slice(taskStateEnd + 2).trim();
                const stateClass = getTaskStateClass(state);
                html += `<div class="task ${stateClass}">${escapeHtml(taskText)}</div>\n`;
                continue;
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

function processMetadata(metadataContent: string): string {
    const lines = metadataContent.split("\n");
    let html = '<div class="metadata">\n';

    for (const line of lines) {
        const colonIndex = line.indexOf(":");
        if (colonIndex !== -1) {
            const key = line.slice(0, colonIndex).trim();
            const value = line.slice(colonIndex + 1).trim();
            html += `<meta name="${escapeHtml(key.toLowerCase())}" content="${escapeHtml(value)}">\n`;
        }
    }

    html += "</div>\n";
    return html;
}

function escapeHtml(text: string): string {
    return text.split("&").join("&amp;")
        .split("<").join("&lt;")
        .split(">").join("&gt;")
        .split('"').join("&quot;")
        .split("'").join("&#039;");
}

function processInlineMarkup(text: string): string {
    let result = text;
    result = replaceMarkup(result, "*", "strong");
    result = replaceMarkup(result, "/", "em");
    result = replaceMarkup(result, "_", "u");
    result = replaceMarkup(result, "^", "sup");
    result = replaceMarkup(result, ",", "sub");
    return result;
}

function replaceMarkup(text: string, symbol: string, tag: string): string {
    while (true) {
        const start = text.indexOf(symbol);
        if (start === -1) break;
        const end = text.indexOf(symbol, start + 1);
        if (end === -1) break;
        const content = text.slice(start + 1, end);
        text = text.slice(0, start) + `<${tag}>${content}</${tag}>` + text.slice(end + 1);
    }
    return text;
}

function getTaskStateClass(state: TaskState): string {
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

function countLeadingChars(text: string, char: string): number {
    let count = 0;
    while (count < text.length && text[count] === char) count++;
    return count;
}
