"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseNorgToHtml = parseNorgToHtml;
const highlight_js_1 = __importDefault(require("highlight.js"));
let inTableBlock = false;
let tableContent = "";
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
            }
            else {
                html += `<li>${escapeHtml(listItemContent)}</li>\n`;
            }
            continue;
        }
        const imageProcessed = processImages(line);
        if (imageProcessed !== line) {
            html += imageProcessed + "\n";
            continue;
        }
        const styledContent = processInlineStyles(line);
        if (styledContent !== line) {
            html += styledContent + "\n";
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
            }
            else {
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
function processLinks(text) {
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
function processTable(content) {
    const rows = content.trim().split("\n");
    if (rows.length < 2)
        return "";
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
        if (cells.length !== headers.length)
            continue;
        html += "<tr>\n";
        for (const cell of cells) {
            html += `<td>${escapeHtml(cell)}</td>\n`;
        }
        html += "</tr>\n";
    }
    html += "</tbody>\n</table>\n";
    return html;
}
function processInlineMarkup(input) {
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
function replaceMarkup(text, symbol, tag, className) {
    const openTag = className ? `<${tag} class="${className}">` : `<${tag}>`;
    const closeTag = `</${tag}>`;
    const count = text.split(symbol).length - 1;
    if (count % 2 !== 0)
        return text;
    let result = "";
    let insideMarkup = false;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === symbol) {
            insideMarkup = !insideMarkup;
            result += insideMarkup ? openTag : closeTag;
        }
        else {
            result += text[i];
        }
    }
    return result;
}
function isDarkColor(hexColor) {
    if (hexColor.startsWith("#")) {
        hexColor = hexColor.slice(1);
    }
    if (hexColor.length === 3) {
        hexColor = hexColor.split("").map(c => c + c).join("");
    }
    const r = parseInt(hexColor.slice(0, 2), 16);
    const g = parseInt(hexColor.slice(2, 4), 16);
    const b = parseInt(hexColor.slice(4, 6), 16);
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return brightness < 0.5;
}
function processImages(input) {
    const imageRegex = /@image\s+(png|svg|jpeg|jfif|exif)\n([\s\S]+?)\n@end/g;
    const externalMediaRegex = /\.image\s+(https?:\/\/[^\s]+)((?:\s+\+width\s+\"[\d]+px\"|\s+\+height\s+\"[\d]+px\")*)/g;
    const localImageRegex = /\.image\s+([^\s]+)((?:\s+\+width\s+\"[\d]+px\"|\s+\+height\s+\"[\d]+px\")*)/g;
    let result = input;
    result = result.replace(imageRegex, (_, format, base64Data) => {
        return `<img src="data:image/${format};base64,${base64Data.trim()}" alt="Embedded image" />`;
    });
    result = result.replace(externalMediaRegex, (_, url, styles) => {
        let styleAttributes = "";
        if (styles) {
            const sizeRegex = /\+(width|height)\s+\"(\d+px)\"/g;
            let match;
            while ((match = sizeRegex.exec(styles)) !== null) {
                styleAttributes += `${match[1]}: ${match[2]}; `;
            }
        }
        if (/\.(mp4|webm|ogg)$/.test(url)) {
            return `<video controls style="${styleAttributes.trim()}"><source src="${url}" type="video/${url.split('.').pop()}">Your browser does not support the video tag.</video>`;
        }
        else if (/\.(png|jpg|jpeg|svg|gif)$/.test(url)) {
            return `<img src="${url}" alt="External media" style="${styleAttributes.trim()}" />`;
        }
        return "";
    });
    result = result.replace(localImageRegex, (_, path, styles) => {
        let styleAttributes = "";
        if (styles) {
            const sizeRegex = /\+(width|height)\s+\"(\d+px)\"/g;
            let match;
            while ((match = sizeRegex.exec(styles)) !== null) {
                styleAttributes += `${match[1]}: ${match[2]}; `;
            }
        }
        return `<img src="${path}" alt="Local image" style="${styleAttributes.trim()}" />`;
    });
    return result;
}
function processInlineStyles(input) {
    const styleRegex = /\+([a-z_]+)(?:\s+([a-fA-F0-9#]+|[a-z]+))?/g;
    let globalStyles = [];
    let inlineStyles = [];
    let result = input;
    result = result.replace(styleRegex, (_, styleKey, value) => {
        switch (styleKey) {
            case "center":
                globalStyles.push(`
                    body {
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                    }
                    main {
                        flex: 1; 
                    }
                `);
                return "";
            case "background_color":
                if (value) {
                    const darkBackground = isDarkColor(value);
                    globalStyles.push(`body { background-color: ${value}; }`);
                    if (darkBackground) {
                        globalStyles.push(`body { color: #FFFFFF; }`);
                        globalStyles.push(`
                            h1, h2, h3, h4, h5, h6 {
                                color: #FFFFFF;
                            }
                            footer {
                                color: #FFFFFF;
                            }
                            a:link {
                                color: #50fa7b;
                            }
                            a:visited {
                                color: #7dcfff;
                            }
                            table {
                                background-color: ${value};
                                color: #FFFFFF;
                            }
                            table th {
                                background-color: ${value}; 
                                font-weight: bold; 
                            }
                            table tr:nth-child(odd) {
                                background-color: ${value};
                                color: #FFFFFF;
                            }
                            table tr:nth-child(even) {
                                background-color: ${value};
                                color: #FFFFFF;
                            }                            
                        `);
                    }
                    else {
                        globalStyles.push(`
                            table {
                                background-color: ${value};
                                color: #000000;
                            }
                            table tr:nth-child(odd) {
                                background-color: #DDDDDD;
                                color: #000000;
                            }
                            table tr:nth-child(even) {
                                background-color: #EEEEEE;
                                color: #000000;
                            }
                        `);
                    }
                }
                return "";
            case "align_items":
                if (value) {
                    const alignments = {
                        left: "flex-start",
                        right: "flex-end",
                        up: "flex-start",
                        down: "flex-end",
                        center: "center",
                    };
                    const cssValue = alignments[value] || value;
                    globalStyles.push(`body { align-items: ${cssValue}; }`);
                }
                return "";
            default:
                if (value) {
                    inlineStyles.push(`${styleKey}: ${value};`);
                }
                return "";
        }
    });
    result = result.replace(/<title>.*?<\/title>/g, "");
    if (globalStyles.length > 0) {
        const globalStyleBlock = `<style>${globalStyles.join("\n")}</style>\n`;
        result = globalStyleBlock + result;
    }
    if (inlineStyles.length > 0) {
        const inlineStyleBlock = inlineStyles.join(" ");
        result = `<div style="${inlineStyleBlock}">${result}</div>`;
    }
    return result;
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
