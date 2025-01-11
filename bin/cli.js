#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const render_1 = require("./render");
const child_process_1 = require("child_process");
const glob_1 = require("glob");
const inquirer_1 = __importDefault(require("inquirer"));
const os_1 = __importDefault(require("os"));
let PATH_DIR;
const STATIC_DIR = (0, path_1.join)(__dirname, "../static");
function copyTemplatesAndStatic(destination) {
    return __awaiter(this, void 0, void 0, function* () {
        const TEMPLATES_DIR = (0, path_1.join)(__dirname, "../src/pages");
        try {
            console.log("📂 Copying templates and static files...");
            const pagesDest = (0, path_1.join)(destination, "src/pages");
            const staticDest = (0, path_1.join)(destination, "static");
            yield fs_1.promises.mkdir(pagesDest, { recursive: true });
            yield fs_1.promises.mkdir(staticDest, { recursive: true });
            const templates = yield fs_1.promises.readdir(TEMPLATES_DIR);
            for (const template of templates) {
                const sourcePath = (0, path_1.join)(TEMPLATES_DIR, template);
                const destPath = (0, path_1.join)(pagesDest, template);
                yield fs_1.promises.copyFile(sourcePath, destPath);
                console.log(`✔ Copied template: ${template}`);
            }
            const staticFiles = yield fs_1.promises.readdir(STATIC_DIR);
            for (const staticFile of staticFiles) {
                const sourcePath = (0, path_1.join)(STATIC_DIR, staticFile);
                const destPath = (0, path_1.join)(staticDest, staticFile);
                yield fs_1.promises.copyFile(sourcePath, destPath);
                console.log(`✔ Copied static file: ${staticFile}`);
            }
            console.log("🎉 Templates and static files copied successfully!");
        }
        catch (err) {
            if (err instanceof Error) {
                console.error("✖ Error copying templates or static files:", err.message);
            }
            else {
                console.error("✖ Unknown error occurred.");
            }
        }
    });
}
function expandHomePath(path) {
    if (path.startsWith("~/")) {
        return (0, path_1.join)(os_1.default.homedir(), path.slice(2));
    }
    return (0, path_1.resolve)(path);
}
function promptUserForProjectDetails() {
    return __awaiter(this, void 0, void 0, function* () {
        const answers = yield inquirer_1.default.prompt([
            {
                type: "input",
                name: "projectName",
                message: "What is the name of your project?",
                validate: (input) => (input ? true : "Project name cannot be empty."),
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
    });
}
function generateSite() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("🔍 Searching for directories with .norg files...");
            const filePaths = yield (0, glob_1.glob)("**/*.norg", { cwd: process.cwd(), absolute: true });
            const directoriesWithNorg = Array.from(new Set(filePaths.map((filePath) => (0, path_1.join)(filePath, ".."))));
            if (directoriesWithNorg.length === 0) {
                console.log("⚠ No directories with .norg files found.");
                return;
            }
            const rootOutputDir = (0, path_1.join)(process.cwd(), "dist");
            yield fs_1.promises.mkdir(rootOutputDir, { recursive: true });
            for (const dir of directoriesWithNorg) {
                console.log(`🔄 Generating site for directory: ${dir}`);
                const files = (yield fs_1.promises.readdir(dir)).filter((file) => file.endsWith(".norg"));
                for (const file of files) {
                    const filePath = (0, path_1.join)(dir, file);
                    const content = yield fs_1.promises.readFile(filePath, "utf-8");
                    const title = file.replace(".norg", "");
                    const rendered = (0, render_1.renderPage)(content, title);
                    const outputFilePath = (0, path_1.join)(rootOutputDir, `${title}.html`);
                    yield fs_1.promises.writeFile(outputFilePath, rendered, "utf-8");
                    console.log(`✔ Generated: ${outputFilePath}`);
                }
            }
            yield copyStaticAssets(rootOutputDir);
            console.log("🎉 Site generation complete for all directories!");
        }
        catch (err) {
            if (err instanceof Error) {
                console.error("✖ Error generating site:", err.message);
            }
        }
    });
}
function copyStaticAssets(outputDir) {
    return __awaiter(this, void 0, void 0, function* () {
        const assets = [
            { source: (0, path_1.join)(STATIC_DIR, "style.css"), destination: (0, path_1.join)(outputDir, "style.css") },
            { source: (0, path_1.join)(STATIC_DIR, "highlight.css"), destination: (0, path_1.join)(outputDir, "highlight.css") },
        ];
        try {
            for (const asset of assets) {
                yield fs_1.promises.copyFile(asset.source, asset.destination);
                console.log(`✔ Copied: ${asset.destination}`);
            }
        }
        catch (err) {
            if (err instanceof Error) {
                console.error("✖ Error copying static assets:", err.message);
            }
        }
    });
}
function cleanOutputDir() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("🧹 Cleaning output directory...");
            yield fs_1.promises.rm((0, path_1.join)(process.cwd(), "dist"), { recursive: true, force: true });
            console.log("✔ Output directory cleaned.");
        }
        catch (err) {
            if (err instanceof Error) {
                console.error("✖ Error cleaning output directory:", err.message);
            }
        }
    });
}
function createProjectStructure(projectName, projectPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield fs_1.promises.mkdir(projectPath, { recursive: true });
            console.log(`✔ Created project directory at: ${projectPath}`);
            yield copyTemplatesAndStatic(projectPath);
            const packageJsonPath = (0, path_1.join)(projectPath, "package.json");
            const packageJsonContent = {
                name: projectName,
                version: "1.0.0",
                private: true,
            };
            yield fs_1.promises.writeFile(packageJsonPath, JSON.stringify(packageJsonContent, null, 2), "utf-8");
            console.log("✔ Initialized package.json");
        }
        catch (err) {
            if (err instanceof Error) {
                console.error("✖ Error creating project structure:", err.message);
            }
        }
    });
}
function initProject() {
    return __awaiter(this, void 0, void 0, function* () {
        const { projectName, gitInit, projectPath } = yield promptUserForProjectDetails();
        yield createProjectStructure(projectName, projectPath);
        if (gitInit) {
            try {
                (0, child_process_1.execSync)("git init", { cwd: projectPath, stdio: ["ignore", "ignore", "ignore"] });
                console.log("✔ Initialized empty Git repository.");
            }
            catch (err) {
                if (err instanceof Error) {
                    console.error("✖ Failed to initialize Git repository:", err.message);
                }
            }
        }
        console.log("\n🎉 Project setup complete!");
        console.log(`Project Name: ${projectName}`);
        console.log(`Project Path: ${projectPath}`);
    });
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
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const command = process.argv[2];
        const destination = process.argv[3] ? (0, path_1.resolve)(process.argv[3]) : process.cwd();
        switch (command) {
            case "build":
                yield generateSite();
                break;
            case "clean":
                yield cleanOutputDir();
                break;
            case "init":
                yield initProject();
                break;
            case "help":
            default:
                showHelp();
                break;
        }
    });
}
main().catch((err) => {
    if (err instanceof Error) {
        console.error("✖ Unexpected error:", err.message);
    }
    else {
        console.error("✖ Unknown error occurred.");
    }
});
