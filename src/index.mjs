import { Command } from 'commander';
import { exec } from 'child_process';
import OpenAI from 'openai';
import ora from 'ora';
import inquirer from 'inquirer';
import Conf from 'conf';
import fs from 'fs';
import { generateMainMessage } from './message.mjs';
import { fileURLToPath } from 'url';
import path from 'path';

export const cli = () => {

  // Convert the URL to a file path
  const __filename = fileURLToPath(import.meta.url);
  // Get the directory name of the current module
  const __dirname = path.dirname(__filename);

  // Correctly construct the path to package.json
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  const config = new Conf({ projectName: 'how' });

  const program = new Command();

  /** @typedef {import("openai").OpenAI.ChatCompletionMessageParam} ChatCompletionMessageParam */

  program
    .version(packageJson.version)
    .description(packageJson.description)

  program
    .option("-d, --debug", "log debug data")
    .option("-c, --config", "configure API key")
    .argument('[query]', "Enter your query in plain text. This will be used to generate a CLI command.")
    .action(async () => {
      const options = program.opts();

      if (options.debug) {
        return console.log({ shell: process.env.SHELL, platform: process.platform })
      }

      /**@type {string|undefined} */
      // @ts-ignore - Run-time type assertion is overkill.
      const configKey = config.get('apiKey')

      /**@type {string|undefined} */
      let apiKey = configKey ?? process.env.OPENAI_API_KEY

      let response
      if (!apiKey || options.config) {
        const MESSAGE = `${apiKey ? '' : "Missing OpenAI API Key. "}You can create or find your OpenAI API key at https://platform.openai.com/account/api-keys.`
        console.log(MESSAGE)
        response = await inquirer.prompt([{
          type: 'input',
          name: 'apiKey',
          message: 'Paste your API key here:'
        }]);

        try {
          const testClient = new OpenAI({ apiKey: response.apiKey })

          /** @type ChatCompletionMessageParam[] */
          const messages = [{ role: 'user', content: 'Respond with pong. Ping' }]

          await testClient.chat.completions.create({
            messages,
            model: 'gpt-4o',
          });
        } catch (error) {
          if (error instanceof Error) console.log(error.message)
          return;
        }

        config.set('apiKey', response.apiKey)
        apiKey = response.apiKey

        if (options.config) {
          return console.log('API key saved to config.')
        }
      }

      const openai = new OpenAI({ apiKey });

      const query = process.argv.slice(1, process.argv.length).join(" ");
      if (!query) {
        console.error("error: missing required argument 'query'")
      }
      const messages = generateMainMessage(query);

      const spinner = ora('Executing Magic ✨').start();

      let completion;
      try {
        completion = await openai.chat.completions.create({
          messages,
          model: 'gpt-4o',
          response_format: { type: "json_object" },
        });
      } catch (error) {
        console.error(error);
      }

      spinner.stop();

      if (!completion) return;

      messages.push(completion.choices[0].message);
      const { message } = completion.choices[0];

      /** @typedef {Object} Output 
       *  @property {string} command 
       *  @property {string} explanation 
       */
      /** @type {Output} */
      const output = JSON.parse(message.content);

      console.log(`By running: "\x1b[1m${output.command}\x1b[0m"`);
      console.log(output.explanation);

      let userResponse;
      do {
        const response = await inquirer.prompt([{
          type: 'list',
          name: 'userResponse',
          message: 'Do you wanna run this command?',
          choices: ['Yes', 'No']
        }]);
        userResponse = response.userResponse;

        if (userResponse === 'Yes') {
          exec(output.command, (error, stdout, stderr) => {
            if (error) {
              return console.error(error.message);
            }
            if (stderr) {
              return console.error(stderr);
            }
            console.log(stdout);
          });
        }
      } while (userResponse === 'Explain');
    });

  program.parse();
}
