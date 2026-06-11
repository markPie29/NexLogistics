#!/usr/bin/env node

import chalk from "chalk";
import ora from "ora";
import readline from "readline";
import fs from "fs";
import path from "path";

// ─── Config ───────────────────────────────────────────────────────────────────

const CONFIG = {
  ollamaUrl: "http://localhost:11434",
  model: "qwen2.5-coder:7b",
  // File extensions to read when using --context
  contextExtensions: [".js", ".jsx", ".ts", ".tsx", ".css", ".json", ".md", ".env.example", ".sql"],
  // Directories to skip when scanning project
  ignoreDirs: ["node_modules", ".git", "dist", "build", ".next", "coverage", ".vite"],
  maxFileSize: 50 * 1024, // 50kb per file max
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getArgs() {
  const args = process.argv.slice(2);
  const flags = {
    files: [],       // --file path/to/file.jsx
    context: false,  // --context  (scan whole project)
    model: CONFIG.model,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--file" || args[i] === "-f") {
      flags.files.push(args[++i]);
    } else if (args[i] === "--context" || args[i] === "-c") {
      flags.context = true;
    } else if (args[i] === "--model" || args[i] === "-m") {
      flags.model = args[++i];
    } else if (args[i] === "--help" || args[i] === "-h") {
      flags.help = true;
    }
  }

  return flags;
}

function printHelp() {
  console.log(`
${chalk.cyan.bold("ai.js")} — Local Ollama coding assistant

${chalk.yellow("Usage:")}
  node ai.js [options]

${chalk.yellow("Options:")}
  ${chalk.green("--file, -f")}     <path>   Load a specific file into context (repeatable)
  ${chalk.green("--context, -c")}           Auto-scan project files for context
  ${chalk.green("--model, -m")}    <name>   Ollama model to use (default: ${CONFIG.model})
  ${chalk.green("--help, -h")}              Show this help message

${chalk.yellow("Examples:")}
  node ai.js
  node ai.js --file src/App.jsx --file src/components/Hero.jsx
  node ai.js --context
  node ai.js --context --model qwen2.5-coder:14b

${chalk.yellow("In-chat commands:")}
  ${chalk.green("/file <path>")}    Add a file to context mid-conversation
  ${chalk.green("/clear")}          Clear conversation history
  ${chalk.green("/context")}        Show currently loaded files
  ${chalk.green("/model <name>")}   Switch model mid-session
  ${chalk.green("/exit")}           Exit
`);
}

function readFile(filePath) {
  try {
    const resolved = path.resolve(filePath);
    const stat = fs.statSync(resolved);
    if (stat.size > CONFIG.maxFileSize) {
      return { path: filePath, content: null, error: `File too large (${Math.round(stat.size / 1024)}kb > 50kb limit)` };
    }
    const content = fs.readFileSync(resolved, "utf-8");
    return { path: filePath, content, error: null };
  } catch (err) {
    return { path: filePath, content: null, error: err.message };
  }
}

function scanProject(rootDir = process.cwd()) {
  const results = [];

  function walk(dir, depth = 0) {
    if (depth > 6) return; // max depth
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (CONFIG.ignoreDirs.includes(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, depth + 1);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (CONFIG.contextExtensions.includes(ext)) {
          results.push(fullPath);
        }
      }
    }
  }

  walk(rootDir);
  return results;
}

function buildSystemPrompt(loadedFiles) {
  const cwd = process.cwd();
  const projectName = path.basename(cwd);

  let system = `You are an expert coding assistant embedded in a web development project called "${projectName}".
You specialize in React, TypeScript, Tailwind CSS, Supabase, PostgreSQL, shadcn/ui, Framer Motion, and modern frontend development.

When generating or editing code:
- Match the existing code style and conventions in the project
- Use TypeScript types where applicable
- Prefer functional components and hooks
- Output only the relevant code block unless asked for explanation
- If editing a file, output the full updated file content`;

  if (loadedFiles.length > 0) {
    system += `\n\n─── PROJECT CONTEXT (${loadedFiles.length} files) ───\n`;
    for (const f of loadedFiles) {
      if (f.content) {
        const rel = path.relative(cwd, path.resolve(f.path));
        system += `\n### ${rel}\n\`\`\`\n${f.content}\n\`\`\`\n`;
      }
    }
  }

  return system;
}

async function checkOllama(model) {
  try {
    const res = await fetch(`${CONFIG.ollamaUrl}/api/tags`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const models = data.models?.map((m) => m.name) ?? [];
    const found = models.some((m) => m.startsWith(model.split(":")[0]));
    return { running: true, hasModel: found, models };
  } catch {
    return { running: false, hasModel: false, models: [] };
  }
}

async function streamChat(messages, systemPrompt, model, onChunk) {
  const response = await fetch(`${CONFIG.ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n").filter(Boolean);

    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        if (json.message?.content) {
          fullContent += json.message.content;
          onChunk(json.message.content);
        }
      } catch {
        // skip malformed lines
      }
    }
  }

  return fullContent;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const flags = getArgs();

  if (flags.help) {
    printHelp();
    process.exit(0);
  }

  console.log(chalk.cyan.bold("\n⚡ Ollama CLI — Local AI Assistant\n"));

  // 1. Check Ollama is running
  const spinner = ora("Connecting to Ollama...").start();
  const status = await checkOllama(flags.model);

  if (!status.running) {
    spinner.fail(chalk.red("Ollama is not running. Start it with: ") + chalk.yellow("ollama serve"));
    process.exit(1);
  }

  if (!status.hasModel) {
    spinner.warn(chalk.yellow(`Model "${flags.model}" not found locally.`));
    console.log(chalk.gray(`  Available: ${status.models.join(", ") || "none"}`));
    console.log(chalk.gray(`  Pull it with: `) + chalk.cyan(`ollama pull ${flags.model}`));
    process.exit(1);
  }

  spinner.succeed(`Connected — using ${chalk.cyan(flags.model)}`);

  // 2. Load files
  let loadedFiles = [];

  if (flags.context) {
    const scanSpinner = ora("Scanning project files...").start();
    const filePaths = scanProject();
    loadedFiles = filePaths.map(readFile).filter((f) => f.content !== null);
    scanSpinner.succeed(`Loaded ${chalk.green(loadedFiles.length)} project files into context`);
  } else if (flags.files.length > 0) {
    loadedFiles = flags.files.map(readFile);
    const ok = loadedFiles.filter((f) => f.content !== null);
    const fail = loadedFiles.filter((f) => f.error !== null);
    if (ok.length) console.log(chalk.green(`✓ Loaded ${ok.length} file(s)`));
    if (fail.length) fail.forEach((f) => console.log(chalk.red(`✗ ${f.path}: ${f.error}`)));
    loadedFiles = ok;
  }

  if (loadedFiles.length > 0) {
    console.log(chalk.gray("  Files: " + loadedFiles.map((f) => path.relative(process.cwd(), path.resolve(f.path))).join(", ")));
  } else {
    console.log(chalk.gray("  No files loaded. Use --file or --context to add project context."));
  }

  console.log(chalk.gray('\n  Type /help for commands, /exit to quit\n'));
  console.log(chalk.gray("─".repeat(50)));

  // 3. Chat loop
  let model = flags.model;
  const history = [];
  let lastResponse = null;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.cyan("\n You › "),
  });

  rl.prompt();

  rl.on("line", async (input) => {
    const line = input.trim();
    if (!line) { rl.prompt(); return; }

    // Handle slash commands
    if (line.startsWith("/")) {
      const [cmd, ...rest] = line.split(" ");
      const arg = rest.join(" ").trim();

      switch (cmd) {
        case "/exit":
        case "/quit":
          console.log(chalk.gray("\nBye!\n"));
          process.exit(0);

        case "/clear":
          history.length = 0;
          console.log(chalk.gray("  Conversation cleared."));
          break;

        case "/context":
          if (loadedFiles.length === 0) {
            console.log(chalk.gray("  No files loaded."));
          } else {
            console.log(chalk.yellow("  Loaded files:"));
            loadedFiles.forEach((f) => console.log(chalk.gray(`    • ${f.path}`)));
          }
          break;

        case "/file":
          if (!arg) { console.log(chalk.red("  Usage: /file <path>")); break; }
          const loaded = readFile(arg);
          if (loaded.error) {
            console.log(chalk.red(`  ✗ ${loaded.error}`));
          } else {
            loadedFiles.push(loaded);
            console.log(chalk.green(`  ✓ Added ${arg} to context`));
          }
          break;

        case "/model":
          if (!arg) { console.log(chalk.red("  Usage: /model <name>")); break; }
          model = arg;
          console.log(chalk.green(`  Switched to ${model}`));
          break;

        case "/save": {
          if (!arg) { console.log(chalk.red("  Usage: /save <path>")); break; }
          if (!lastResponse) { console.log(chalk.red("  No AI response to save yet.")); break; }

          // Extract code block if the response contains one, otherwise save raw
          const codeBlockMatch = lastResponse.match(/```(?:\w+)?\n([\s\S]*?)```/);
          const contentToSave = codeBlockMatch ? codeBlockMatch[1] : lastResponse;

          try {
            const savePath = path.resolve(arg);
            const saveDir = path.dirname(savePath);
            fs.mkdirSync(saveDir, { recursive: true });
            fs.writeFileSync(savePath, contentToSave, "utf-8");
            console.log(chalk.green(`  ✓ Saved to ${arg}`));

            // Update loaded context if this file was already in it
            const existingIdx = loadedFiles.findIndex(
              (f) => path.resolve(f.path) === savePath
            );
            if (existingIdx !== -1) {
              loadedFiles[existingIdx] = { path: arg, content: contentToSave, error: null };
              console.log(chalk.gray("  ↻ Context updated with new file contents"));
            }
          } catch (err) {
            console.log(chalk.red(`  ✗ Could not save: ${err.message}`));
          }
          break;
        }

        case "/help":
          console.log(chalk.yellow("\n  Commands:"));
          console.log(chalk.gray("    /file <path>   — Add a file to context"));
          console.log(chalk.gray("    /save <path>   — Save last AI response to a file"));
          console.log(chalk.gray("    /clear         — Clear conversation history"));
          console.log(chalk.gray("    /context       — List loaded files"));
          console.log(chalk.gray("    /model <name>  — Switch Ollama model"));
          console.log(chalk.gray("    /exit          — Quit\n"));
          break;

        default:
          console.log(chalk.red(`  Unknown command: ${cmd}. Type /help for options.`));
      }

      rl.prompt();
      return;
    }

    // Regular chat message
    history.push({ role: "user", content: line });
    const systemPrompt = buildSystemPrompt(loadedFiles);

    console.log(chalk.magenta("\n AI › "));

    try {
      const fullResponse = await streamChat(history, systemPrompt, model, (chunk) => {
        process.stdout.write(chalk.white(chunk));
      });

      lastResponse = fullResponse;
      history.push({ role: "assistant", content: fullResponse });
      console.log("\n" + chalk.gray("─".repeat(50)));
    } catch (err) {
      console.log(chalk.red(`\n  Error: ${err.message}`));
    }

    rl.prompt();
  });

  rl.on("close", () => {
    console.log(chalk.gray("\nBye!\n"));
    process.exit(0);
  });
}

main();