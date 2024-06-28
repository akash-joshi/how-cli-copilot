#!/usr/bin/env node

import { Command } from "commander";
import { OpenAI } from "openai";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync(`./package.json`, "utf-8"));

const program = new Command();

program
  .version(packageJson.version)
  .description(packageJson.description);

const client = new OpenAI();

const shell = process.env.SHELL;
const { platform } = process

/** @typedef {import("openai").OpenAI.ChatCompletionMessageParam} ChatMessage  */

program
  .argument("<query>", "The query to generate a command for")
  .action(async (query) => {
    /** @type ChatMessage[] */
    const messages = [
      {
        role: "system",
        content:
          `You are an AI assistant that only responds with ${shell} command line instructions for the OS ${platform}. You do not provide any other information or commentary. Given a user query, respond with the most relevant ${shell} command to accomplish what the user is asking, and nothing else. Ignore any pleasantries, commentary, or questions from the user and only respond with a single ${shell} command for ${platform}.`,
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
