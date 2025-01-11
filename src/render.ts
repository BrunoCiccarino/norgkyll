import { parseNorgToHtml } from "./parsers/parserNorg";

const TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="highlight.css">
</head>
<body>
    <main>
        {{{content}}}
    </main>
    <footer>
        <p>Generated by <strong>NorgKyll</strong> - A Neorg to HTML renderer</p>
    </footer>
</body>
</html>
`;

/**
 * Renders the Norg content as a complete HTML page.
 * @param norgContent The content in Neorg format.
 * @param title The title of the page.
 * @returns The complete HTML as a string.
 */
export function renderPage(norgContent: string, title: string = "Neorg Page"): string {
    
    const htmlContent = parseNorgToHtml(norgContent);
    const safeTitle = escapeHtml(title);

    return TEMPLATE
        .replace(/{{title}}/g, safeTitle)
        .replace(/{{{content}}}/g, htmlContent); 
}

/**
 * Escapes dangerous HTML characters to prevent XSS attacks.
 * @param text The text to be escaped.
 * @returns The escaped text.
 */
function escapeHtml(text: string): string {
    return text.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
