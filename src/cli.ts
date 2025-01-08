#!/usr/bin/env node

import { promises as fs } from "fs";
import { join, resolve } from "path";
import { renderPage } from "./render";
import { execSync } from "child_process";
import inquirer from "inquirer";
import os from "os";

const INPUT_DIR = join(__dirname, "../src/pages");
const OUTPUT_DIR = join(__dirname, "../dist");
const STATIC_DIR = join(__dirname, "../static");

async function copyTemplatesAndStatic(destination: string) {
    const TEMPLATES_DIR = join(__dirname, "../src/pages");

    try {
        console.log("📂 Copying templates and static files...");

        const pagesDest = join(destination, "src/pages");
        const staticDest = join(destination, "static");

        await fs.mkdir(pagesDest, { recursive: true });
        await fs.mkdir(staticDest, { recursive: true });

        const templates = await fs.readdir(TEMPLATES_DIR);
        for (const template of templates) {
            const sourcePath = join(TEMPLATES_DIR, template);
            const destPath = join(pagesDest, template);
            await fs.copyFile(sourcePath, destPath);
            console.log(`✔ Copied template: ${template}`);
        }

        const staticFiles = await fs.readdir(STATIC_DIR);
        for (const staticFile of staticFiles) {
            const sourcePath = join(STATIC_DIR, staticFile);
            const destPath = join(staticDest, staticFile);
            await fs.copyFile(sourcePath, destPath);
            console.log(`✔ Copied static file: ${staticFile}`);
        }

        console.log("🎉 Templates and static files copied successfully!");
    } catch (err) {
        if (err instanceof Error) {
            console.error("✖ Error copying templates or static files:", err.message);
        } else {
            console.error("✖ Unknown error occurred.");
        }
    }
}

function expandHomePath(path: string): string {
    if (path.startsWith("~/")) {
        return join(os.homedir(), path.slice(2));
    }
    return resolve(path);
}

async function promptUserForProjectDetails(): Promise<{ projectName: string; gitInit: boolean; projectPath: string }> {
    const answers = await inquirer.prompt([
        {
            type: "input",
            name: "projectName",
            message: "What is the name of your project?",
            validate: (input: string) => (input ? true : "Project name cannot be empty."),
        },
        {
            type: "confirm",
            name: "gitInit",
            message: "Do you want to initialize an empty Git repository in the project?",
            default: true,
        },
        {
            type: "input",
            name: "projectPath",
            message: "Where do you want to create the project? (use . for the current directory)",
            default: ".",
        },
    ]);

    return {
        projectName: answers.projectName.trim(),
        gitInit: answers.gitInit,
        projectPath: expandHomePath(answers.projectPath.trim()),
    };
}

async function copyStaticAssets(outputDir: string): Promise<void> {
    const assets = [
        { source: join(STATIC_DIR, "style.css"), destination: join(outputDir, "style.css") },
        { source: join(STATIC_DIR, "highlight.css"), destination: join(outputDir, "highlight.css") },
    ];

    try {
        for (const asset of assets) {
            await fs.copyFile(asset.source, asset.destination);
            console.log(`✔ Copied: ${asset.destination}`);
        }
    } catch (err: any) {
        console.error("✖ Error copying static assets:", err.message);
    }
}

async function generateSite(destination: string = process.cwd()): Promise<void> {
    try {
        console.log("🔄 Generating site...");
        const files = await fs.readdir(INPUT_DIR);

        const outputDir = join(destination, "dist");

        await fs.mkdir(outputDir, { recursive: true });

        for (const file of files) {
            if (file.endsWith(".norg")) {
                const filePath = join(INPUT_DIR, file);
                const content = await fs.readFile(filePath, "utf-8");

                const title = file.replace(".norg", "");
                const rendered = renderPage(content, title);

                const outputFilePath = join(outputDir, file.replace(".norg", ".html"));
                await fs.writeFile(outputFilePath, rendered, "utf-8");
                console.log(`✔ Generated: ${outputFilePath}`);
            }
        }

        await copyStaticAssets(outputDir);

        console.log("🎉 Site generation complete!");
    } catch (err: any) {
        console.error("✖ Error generating site:", err.message);
    }
}

async function cleanOutputDir() {
    try {
        console.log("🧹 Cleaning output directory...");
        await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
        console.log("✔ Output directory cleaned.");
    } catch (err: any) {
        console.error("✖ Error cleaning output directory:", err.message);
    }
}

async function createProjectStructure(projectName: string, projectPath: string) {
    try {
        await fs.mkdir(projectPath, { recursive: true });
        console.log(`✔ Created project directory at: ${projectPath}`);
        await copyTemplatesAndStatic(projectPath);
        const packageJsonPath = join(projectPath, "package.json");
        const packageJsonContent = {
            name: projectName,
            version: "1.0.0",
            private: true,
        };
        await fs.writeFile(packageJsonPath, JSON.stringify(packageJsonContent, null, 2), "utf-8");
        console.log("✔ Initialized package.json");
    } catch (err: any) {
        console.error("✖ Error creating project structure:", err.message);
    }
}

async function initProject() {
    const { projectName, gitInit, projectPath } = await promptUserForProjectDetails();

    await createProjectStructure(projectName, projectPath);

    if (gitInit) {
        try {
            execSync("git init", { cwd: projectPath, stdio: ["ignore", "ignore", "ignore"] });
            console.log("✔ Initialized empty Git repository.");
        } catch (err: any) {
            console.error("✖ Failed to initialize Git repository:", err.message);
        }
    }

    console.log("\n🎉 Project setup complete!");
    console.log(`Project Name: ${projectName}`);
    console.log(`Project Path: ${projectPath}`);
}

function showHelp() {
    console.log(`
Usage: norgkyll <command>

Commands:
  build       Generate the static site.
  clean       Remove the output directory.
  init        Create a new project with prompts.
  help        Show this help message.
`);
}

async function main() {
    const command = process.argv[2];
    const destination = process.argv[3] ? resolve(process.argv[3]) : process.cwd();

    switch (command) {
        case "build":
            await generateSite(destination);
            break;
        case "clean":
            await cleanOutputDir();
            break;
        case "init":
            await initProject();
            break;
        case "help":
        default:
            showHelp();
            break;
    }
}


main().catch((err) => console.error("✖ Unexpected error:", err.message));
