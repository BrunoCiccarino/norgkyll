<h1 align="center">
  <br>
  <a href="https://github.com/nvim-neorg/neorg">
    <img src="./img/norgkyll.png" width="600" height="400">
  </a>
  <br>
  NorgKyll
  <br>
</h1>

<div align="center">

[![GitHub Repo stars](https://img.shields.io/github/stars/BrunoCiccarino/norgkyll?style=for-the-badge&logo=github&color=%238aadf4)](https://github.com/BrunoCiccarino/norgkyll) 
[![GitHub forks](https://img.shields.io/github/forks/BrunoCiccarino/norgkyll?style=for-the-badge&logo=github&color=%2381c8be)](https://github.com/BrunoCiccarino/norgkyll)
[![Pull requests](https://img.shields.io/badge/PULL_REQUESTS-WELCOME-gray?style=for-the-badge&logo=github&color=%23a6d189)](https://github.com/BrunoCiccarino/norgkyll) 
[![Discord](https://img.shields.io/badge/discord-join-7289da?style=for-the-badge&logo=discord)](https://discord.gg/T6EgTAX7ht)
[![NPM Downloads](https://img.shields.io/npm/d18m/norgkyll?style=for-the-badge&logo=npm&color=%23ca9ee6)](https://www.npmjs.com/package/norgkyll)

</div>

Welcome aboard! NorgKyll is your go-to tool for converting Neorg files (`.norg`) into beautiful, fully-functional static websites. Whether you're a Markdown veteran or new to structured text, NorgKyll bridges the gap between simplicity and power.  


## Installation

To install it is very simple, just type the command `npm i -g norgkyll`

```bash
╭─ 💁 charon at 💻 DESKTOP-27DNBRN in 📁 ~ on (🌿 main •39 ⌀163 ✗)
╰λ npm i -g norgkyll

added 48 packages, and changed 1 package in 12s

5 packages are looking for funding
  run `npm fund` for details
```

---

## What is Neorg? 🤔  

Think of [Neorg](https://github.com/nvim-neorg/neorg) as a supercharged Markdown. It’s a markup format designed for note-taking, life management, and pretty much anything else you can express in plaintext. Neorg works seamlessly with Neovim, making it a breeze to create, edit, and organize your notes.  

---

### Neorg in a Nutshell  

**Basic Syntax**  
- Any plain text is allowed. Example: "This is my note!"  

**Inline Markup**  
- Style your text easily: bold, italic, underline, superscript, subscript, etc.  

**Lists**  
- Create unordered or ordered lists with simple syntax.  

**Headings and Nesting**  
- Use asterisks for headings, and indent for nested content.  

**Tasks (TODOs)**  
- Turn lists into actionable tasks with TODO states: undone, done, urgent, on hold, etc.  

---

## What is NorgKyll? 🌟  

While Neorg helps you create structured content, NorgKyll lets you share it by generating a static website from your `.norg` files.  

---

### NorgKyll CLI ⚙️  

**Usage:** `norgkyll <command>`  

#### Commands  

- **init**: initializes a project with .norg templates and css

![image](./img/norginit.jpg)

- **build**: Generate the static site based on your `.norg` files.  

![image](./img/norgbuild.jpg)

- **clean**: Remove the output directory and start fresh.  

![image](./img/norgclean.jpg)

- **help**: Show help and usage instructions.  

![image](./img/norghelp.jpg)

---

## How to Use  

1. **Create a `.norg` file**  
   Write your notes, tasks, or documentation in Neorg format.  

2. **Run the CLI**  
   Use `norgkyll build` to generate your static site.  

3. **Serve or Share**  
   Your `.norg` files are now sleek, shareable HTML pages.  

---

### 📋 Tasks

- [x] Add link support 
- [x] Add a prompt in the cli asking for the website name 
- [x] Add support for tables
- [ ] Add table of contents support
- [ ] Improve task renderer
- [ ] fix the bold text formatting that is showing the strong tag
- [ ] Start creating documentation
- [ ] Add support for neorg image

### Why NorgKyll? 🚀  

- **Effortless Conversion**: Turn `.norg` into HTML without breaking a sweat.  
- **Custom Styling**: Personalize your site with CSS.  
- **Dynamic TODOs**: Keep your tasks organized and actionable on the generated site.  

---

### Get Started Today  

Transform your notes into something spectacular with NorgKyll. Whether it’s project documentation, a personal blog, or keeping track of tasks, your ideas deserve to shine! 🌟  

### 👏 Acknowledgements

- [neorg](https://github.com/nvim-neorg/neorg)
- [norgolith](https://github.com/NTBBloodbath/norgolith)
- [jekyll](https://github.com/jekyll/jekyll)
- [astro-js](https://github.com/withastro/astro)

## ☕ Sponsor this project

<div align="center"> 

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/ciccabr9p)
[!["ko-fi"](https://img.shields.io/badge/Ko--fi-F16061?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/brunociccarinoo)
[!["github-sponsors"](https://img.shields.io/badge/sponsor-30363D?style=for-the-badge&logo=GitHub-Sponsors&logoColor=#white)](https://github.com/sponsors/BrunoCiccarino/)
</div>

<p align="center">Copyright © 2025 Bruno Ciccarino</p>
