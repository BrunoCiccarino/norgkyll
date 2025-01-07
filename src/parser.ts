import hljs from "highlight.js";

type TaskState = "( )" | "(x)" | "(-)" | "(=)" | "(_)" | "(!)" | "(?)" | "(+)";
type InlineMarkup = "*" | "/" | "_" | "^" | ",";

export function parseNorgToHtml(norgContent: string): string {
    const lines = norgContent.split("\n");
    let inCodeBlock = false;
    let codeBlockLanguage = "";
    let codeBlockContent = "";

    let html = "";
    const stack: string[] = []; 

    for (const line of lines) {
        if (line.startsWith("*")) {
            const level = line.match(/^\*+/)?.[0]?.length || 1;
            const headingText = line.substring(level).trim();
            html += `<h${level}>${escapeHtml(headingText)}</h${level}>\n`;
            continue;
        }
    
        if (line.trim().startsWith("- ")) {
            if (!stack.includes("ul")) {
                stack.push("ul");
                html += "<ul>\n";
            }
            html += `<li>${escapeHtml(line.trim().substring(2))}</li>\n`;
            continue;
        }
    
        if (line.trim().startsWith("~ ")) {
            if (!stack.includes("ol")) {
                stack.push("ol");
                html += "<ol>\n";
            }
            html += `<li>${escapeHtml(line.trim().substring(2))}</li>\n`;
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
            const [, language] = line.trim().match(/^@code\s+(\w+)/) || [];
            inCodeBlock = true;
            codeBlockLanguage = language || "plaintext";
            codeBlockContent = ""; 
            continue;
        }
        
        if (line.trim().startsWith("@end") && inCodeBlock) {
            const highlightedCode = hljs.highlight(codeBlockLanguage, codeBlockContent.trim(), true).value;
            html += `<pre><code class="language-${escapeHtml(codeBlockLanguage)}">${highlightedCode}</code></pre>\n`;
            inCodeBlock = false;
            codeBlockLanguage = "";
            codeBlockContent = "";
            continue;
        }
        
        if (inCodeBlock) {
            codeBlockContent += (codeBlockContent ? "\n" : "") + line; 
            continue;
        }
        
        const taskMatch = line.trim().match(/^-\s\(([\sx\-=!+?_])\)\s(.+)/);
        if (taskMatch) {
            const [, state, taskText] = taskMatch;
            const stateClass = getTaskStateClass(state as TaskState);
            html += `<div class="task ${stateClass}">${escapeHtml(taskText)}</div>\n`;
            continue;
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

function escapeHtml(text: string): string {
    return text.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function processInlineMarkup(text: string): string {
    return text
        .replace(/\*(.+?)\*/g, "<strong>$1</strong>") // Bold
        .replace(/\/(.+?)\//g, "<em>$1</em>")       // Italic
        .replace(/_(.+?)_/g, "<u>$1</u>")           // Underline
        .replace(/\^(.+?)\^/g, "<sup>$1</sup>")     // Superscript
        .replace(/,(.+?),/g, "<sub>$1</sub>");      // Subscript
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

