import { OpenAI } from "openai"

const client = new OpenAI();

/** @typedef {import("openai").OpenAI.ChatCompletionMessageParam} ChatMessage  */

/** @type ChatMessage[] */
const messages = [{ role: "system", content: "You are a Japanese teacher called SenseiGPT. Answer questions about Japan" }, { role: "user", content: "What are the character systems of Japanese" }]

const completion = await client.chat.completions.create({
  messages,
  model: 'gpt-3.5-turbo-0125',
});

console.log({ choice: completion.choices[0] })