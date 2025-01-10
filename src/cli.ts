#!/usr/bin/env node

import { promises as fs } from "fs";
import { join, resolve } from "path";
import { renderPage } from "./render";
import { execSync } from "child_process";
import { glob } from "glob";
import inquirer from "inquirer";
import os from "os";

let PATH_DIR: string;
const STATIC_DIR = join(__dirname, "../static");

async function copyTemplatesAndStatic(destination: string): Promise<void> {
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

async function generateSite(): Promise<void> {
    try {
        console.log("🔍 Searching for directories with .norg files...");
        
        const filePaths = await glob("**/*.norg", { cwd: process.cwd(), absolute: true }) as string[];
        const directoriesWithNorg = Array.from(new Set(
            filePaths.map((filePath: string) => join(filePath, "..")) 
        ));

        if (directoriesWithNorg.length === 0) {
            console.log("⚠ No directories with .norg files found.");
            return;
        }

        for (const dir of directoriesWithNorg) {
            console.log(`🔄 Generating site for directory: ${dir}`);
            
            const outputDir = join(dir, "dist"); 
            await fs.mkdir(outputDir, { recursive: true });

            
            const files = (await fs.readdir(dir)).filter((file) => file.endsWith(".norg"));

            for (const file of files) {
                const filePath = join(dir, file);
                const content = await fs.readFile(filePath, "utf-8");

                const title = file.replace(".norg", ""); 
                const rendered = renderPage(content, title);

                const outputFilePath = join(outputDir, `${title}.html`);
                await fs.writeFile(outputFilePath, rendered, "utf-8");
                console.log(`✔ Generated: ${outputFilePath}`);
            }

            await copyStaticAssets(outputDir);
        }

        console.log("🎉 Site generation complete for all directories!");
    } catch (err) {
        if (err instanceof Error) {
            console.error("✖ Error generating site:", err.message);
        }
    }
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
    } catch (err) {
        if (err instanceof Error) {
            console.error("✖ Error copying static assets:", err.message);
        }
    }
}

async function cleanOutputDir(): Promise<void> {
    try {
        console.log("🧹 Cleaning output directory...");
        await fs.rm(join(process.cwd(), "dist"), { recursive: true, force: true });
        console.log("✔ Output directory cleaned.");
    } catch (err) {
        if (err instanceof Error) {
            console.error("✖ Error cleaning output directory:", err.message);
        }
    }
}

async function createProjectStructure(projectName: string, projectPath: string): Promise<void> {
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
    } catch (err) {
        if (err instanceof Error) {
            console.error("✖ Error creating project structure:", err.message);
        }
    }
}

async function initProject(): Promise<void> {
    const { projectName, gitInit, projectPath } = await promptUserForProjectDetails();

    await createProjectStructure(projectName, projectPath);

    if (gitInit) {
        try {
            execSync("git init", { cwd: projectPath, stdio: ["ignore", "ignore", "ignore"] });
            console.log("✔ Initialized empty Git repository.");
        } catch (err) {
            if (err instanceof Error) {
                console.error("✖ Failed to initialize Git repository:", err.message);
            }
        }
    }

    console.log("\n🎉 Project setup complete!");
    console.log(`Project Name: ${projectName}`);
    console.log(`Project Path: ${projectPath}`);
}

function showHelp(): void {
    console.log(`
Usage: norgkyll <command>

Commands:
  build       Generate the static site.
  clean       Remove the output directory.
  init        Create a new project with prompts.
  help        Show this help message.
`);
}

async function main(): Promise<void> {
    const command = process.argv[2];
    const destination = process.argv[3] ? resolve(process.argv[3]) : process.cwd();

    switch (command) {
        case "build":
            await generateSite();            
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

main().catch((err: unknown) => {
    if (err instanceof Error) {
        console.error("✖ Unexpected error:", err.message);
    } else {
        console.error("✖ Unknown error occurred.");
    }
});
