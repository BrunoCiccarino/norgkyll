import { promises as fs } from "fs";
import { join } from "path";
import { renderPage } from "./render";

const INPUT_DIR = join(__dirname, "../src/pages");
const OUTPUT_DIR = join(__dirname, "../dist");
const STATIC_DIR = join(__dirname, "../static");

async function copyStaticAssets() {
    const cssSource = join(STATIC_DIR, "style.css");
    const cssDestination = join(OUTPUT_DIR, "style.css");

    try {
        await fs.mkdir(OUTPUT_DIR, { recursive: true });
        await fs.copyFile(cssSource, cssDestination);
        console.log(`Copied: ${cssDestination}`);
    } catch (err) {
        console.error("Error copying static assets:", err);
    }
}

async function generateSite() {
    try {
        const files = await fs.readdir(INPUT_DIR);

        await fs.mkdir(OUTPUT_DIR, { recursive: true });

        for (const file of files) {
            if (file.endsWith(".norg")) {
                const filePath = join(INPUT_DIR, file);
                const content = await fs.readFile(filePath, "utf-8");

                const title = file.replace(".norg", "");
                const rendered = renderPage(content, title);

                const outputFilePath = join(OUTPUT_DIR, file.replace(".norg", ".html"));
                await fs.writeFile(outputFilePath, rendered, "utf-8");
                console.log(`Generated: ${outputFilePath}`);
            }
        }

        await copyStaticAssets();
    } catch (err) {
        console.error("Error generating site:", err);
    }
}

generateSite().catch((err) => console.error("Error generating site:", err));
