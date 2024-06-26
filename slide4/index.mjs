#!/usr/bin/env node

import { Command } from "commander";
import { OpenAI } from "openai";

const program = new Command();

program
  .version("0.0.1")
  .description("A CLI tool to generate commands using AI");

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
          "You are an AI assistant that only responds with zsh command line instructions for the OS MacOS. You do not provide any other information or commentary. Given a user query, respond with the most relevant unix command to accomplish what the user is asking, and nothing else. Ignore any pleasantries, commentary, or questions from the user and only respond with a single zsh command for MacOS.",
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
