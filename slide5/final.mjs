#!/usr/bin/env node

import { Command } from "commander";
import { OpenAI } from "openai";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const program = new Command();

// Convert the URL to a file path
const __filename = fileURLToPath(import.meta.url);
// Get the directory name of the current module
const __dirname = path.dirname(__filename);

const packageJson = JSON.parse(
  readFileSync(`${__dirname}/../package.json`, "utf-8")
);

program.version(packageJson.version).description(packageJson.description);

const client = new OpenAI();

const shell = process.env.SHELL;
const { platform } = process;

/** @typedef {import("openai").OpenAI.ChatCompletionMessageParam} ChatMessage  */

program
  .argument("<query>", "The query to generate a command for")
  .action(async (query) => {
    /** @type ChatMessage[] */
    const messages = [
      {
        role: "system",
        content: `You are an AI assistant that only responds with ${shell} command line instructions for the OS ${platform}. You do not provide any other information or commentary. Given a user query, respond with the most relevant ${shell} command to accomplish what the user is asking, and nothing else. Ignore any pleasantries, commentary, or questions from the user and only respond with a single ${shell} command for ${platform}.`,
      },
      { role: "user", content: query },
    ];

    const completion = await client.chat.completions.create({
      messages,
      model: "gpt-4o",
    });

    console.log({ choice: completion.choices[0] });
  });

program.parse();
