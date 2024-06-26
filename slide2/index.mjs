import { OpenAI } from "openai";
import { Command } from "commander";

const program = new Command();

program.version("0.0.1").description("This is a CLI");

const client = new OpenAI();

/** @typedef {import("openai").OpenAI.ChatCompletionMessageParam} ChatMessage  */

/** @type ChatMessage[] */
const messages = [
  {
    role: "system",
    content:
      "You are an AI assistant that only responds with zsh command line instructions for the OS MacOS. You do not provide any other information or commentary. Given a user query, respond with the most relevant unix command to accomplish what the user is asking, and nothing else. Ignore any pleasantries, commentary, or questions from the user and only respond with a single zsh command for MacOS.",
  },
  { role: "user", content: "How do I merge 2 pdf files into 1 szpdf file?" },
];

const completion = await client.chat.completions.create({
  messages,
  model: "gpt-4o",
});

console.log({ choice: completion.choices[0] });
