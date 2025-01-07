import { promises as fs } from "fs";
import { join } from "path";
import { renderPage } from "./render";
import { execSync } from "child_process";

const INPUT_DIR = join(__dirname, "../src/pages");
const OUTPUT_DIR = join(__dirname, "../dist");
const STATIC_DIR = join(__dirname, "../static");

async function copyStaticAssets() {
    const assets = [
        { source: join(STATIC_DIR, "style.css"), destination: join(OUTPUT_DIR, "style.css") },
        { source: join(STATIC_DIR, "highlight.css"), destination: join(OUTPUT_DIR, "highlight.css") },
    ];

    try {
        await fs.mkdir(OUTPUT_DIR, { recursive: true });

        for (const asset of assets) {
            await fs.copyFile(asset.source, asset.destination);
            console.log(`✔ Copied: ${asset.destination}`);
        }
    } catch (err) {
        console.error("✖ Error copying static assets:", err.message);
    }
}

async function generateSite() {
    try {
        console.log("🔄 Generating site...");
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
                console.log(`✔ Generated: ${outputFilePath}`);
            }
        }

        await copyStaticAssets();
        console.log("🎉 Site generation complete!");
    } catch (err) {
        console.error("✖ Error generating site:", err.message);
    }
}

async function cleanOutputDir() {
    try {
        console.log("🧹 Cleaning output directory...");
        await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
        console.log("✔ Output directory cleaned.");
    } catch (err) {
        console.error("✖ Error cleaning output directory:", err.message);
    }
}

function showHelp() {
    console.log(`
Usage: norgkyll <command>

Commands:
  build       Generate the static site.
  clean       Remove the output directory.
  help        Show this help message.
`);
}

async function main() {
    const command = process.argv[2];

    switch (command) {
        case "build":
            await generateSite();
            break;
        case "clean":
            await cleanOutputDir();
            break;
        case "help":
        default:
            showHelp();
            break;
    }
}

main().catch((err) => console.error("✖ Unexpected error:", err.message));
