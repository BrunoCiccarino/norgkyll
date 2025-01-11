import hljs from "highlight.js";

type TaskState = "( )" | "(x)" | "(-)" | "(=)" | "(_)" | "(!)" | "(?)" | "(+)";
type InlineMarkup = "*" | "/" | "_" | "^" | ",";

let inTableBlock: boolean = false;
let tableContent: string = "";

function isValidTaskState(state: TaskState) {
    return ["( )", "(x)", "(-)", "(=)", "(_)", "(!)", "(?)", "(+)"].includes(state);
}

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

        if (line.trim().startsWith("@table")) {
            inTableBlock = true;
            tableContent = "";
            continue;
        }

        if (line.trim() === "@end" && inTableBlock) {
            html += processTable(tableContent);
            inTableBlock = false;
            tableContent = "";
            continue;
        }

        if (inTableBlock) {
            tableContent += (tableContent ? "\n" : "") + line;
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
            const listItemContent = line.trim().slice(2);
            if (/\[.*?\]\{.*?\}/.test(listItemContent)) {

                const processedContent = processLinks(listItemContent);
                html += `<li>${processedContent}</li>\n`;
            } else {
                html += `<li>${escapeHtml(listItemContent)}</li>\n`;
            }
            continue;
        }
        
        if (line.trim().startsWith("~ ")) {
            if (!stack.includes("ol")) {
                stack.push("ol");
                html += "<ol>\n";
            }
            const listItemContent = line.slice(2).trim();
            if (/\[.*?\]\{.*?\}/.test(listItemContent)) {
                
                const processedContent = processLinks(listItemContent);
                html += `<li>${processedContent}</li>\n`;
            } else {
                html += `<li>${escapeHtml(listItemContent)}</li>\n`;
            }
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
            const validLang = hljs.getLanguage(language) ? language : 'plaintext';
            codeBlockLanguage = validLang;
        
            inCodeBlock = true;
            codeBlockContent = "";
            continue;
        }
        
        if (line.trim() === "@end" && inCodeBlock) {
            try {
                const highlightedCode = hljs.highlight(codeBlockContent.trim(), {
                    language: codeBlockLanguage,
                    ignoreIllegals: true,
                }).value;
        
                html += `<pre><code class="language-${escapeHtml(codeBlockLanguage)}">${highlightedCode}</code></pre>\n`;
            } catch (error) {
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
                const state = line.slice(2, taskStateEnd + 1) as TaskState;
               if (!isValidTaskState(state)) {
                   console.error(`Invalid task state: ${state}`);
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

function processMetadata(metadataContent: string): string {
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

function escapeHtml(text: string): string {
    return text.split("&").join("&amp;")
        .split("<").join("&lt;")
        .split(">").join("&gt;")
        .split('"').join("&quot;")
        .split("'").join("&#039;");
}

function processLinks(text: string): string {
    let result = "";
    let i = 0;

    while (i < text.length) {
        const linkStart = text.indexOf("[", i);
        if (linkStart === -1) {
            result += text.slice(i);
            break;
        }

        const linkEnd = text.indexOf("]{", linkStart);
        if (linkEnd === -1) {
            result += text.slice(i);
            break;
        }

        const hrefEnd = text.indexOf("}", linkEnd + 2);
        if (hrefEnd === -1) {
            result += text.slice(i);
            break;
        }

        const linkText = text.slice(linkStart + 1, linkEnd);
        let href = text.slice(linkEnd + 2, hrefEnd);

        if (href.endsWith("!")) {
            href = href.slice(0, -1); 
        }

        if (href.endsWith(".norg")) {
            href = href.replace(".norg", ".html");
        }

        result += text.slice(i, linkStart);
        result += `<a href="${escapeHtml(href)}">${escapeHtml(linkText)}</a>`;
        i = hrefEnd + 1;
    }

    return result;
}


function processTable(content: string): string {
    const rows = content.trim().split("\n");
    if (rows.length < 2) return "";

    const headers = rows[0].split("|").map((cell) => cell.trim()).filter(Boolean);
    const separator = rows[1].split("|").map((cell) => cell.trim()).filter(Boolean);
    if (headers.length !== separator.length || separator.some((cell) => cell !== "-")) {
        return "";
    }

    let html = "<table>\n<thead>\n<tr>\n";
    for (const header of headers) {
        html += `<th>${escapeHtml(header)}</th>\n`;
    }
    html += "</tr>\n</thead>\n<tbody>\n";

    for (let i = 2; i < rows.length; i++) {
        const cells = rows[i].split("|").map((cell) => cell.trim()).filter(Boolean);
        if (cells.length !== headers.length) continue;

        html += "<tr>\n";
        for (const cell of cells) {
            html += `<td>${escapeHtml(cell)}</td>\n`;
        }
        html += "</tr>\n";
    }

    html += "</tbody>\n</table>\n";
    return html;
}

function processInlineMarkup(input: string): string {
    let result = input;
    result = replaceMarkup(result, "*", "strong");
    result = replaceMarkup(result, "/", "em");
    result = replaceMarkup(result, "_", "u");
    result = replaceMarkup(result, "-", "del");
    result = replaceMarkup(result, "!", "span", "spoiler");
    result = replaceMarkup(result, "`", "code"); 
    result = replaceMarkup(result, "^", "sup");
    result = replaceMarkup(result, ",", "sub");
    result = replaceMarkup(result, "$", "span", "math");
    result = replaceMarkup(result, "&", "span", "variable");
    result = replaceMarkup(result, "%", "span", "comment");
    return result;
}

function replaceMarkup(text: string, symbol: string, tag: string, className?: string): string {
    const openTag = className ? `<${tag} class="${className}">` : `<${tag}>`;
    const closeTag = `</${tag}>`;


    const count = text.split(symbol).length - 1;
    if (count % 2 !== 0) return text; 

    let result = "";
    let insideMarkup = false;

    for (let i = 0; i < text.length; i++) {
        if (text[i] === symbol) {
            insideMarkup = !insideMarkup;
            result += insideMarkup ? openTag : closeTag;
        } else {
            result += text[i];
        }
    }

    return result;
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
