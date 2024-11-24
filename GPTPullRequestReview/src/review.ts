import { git } from "./git.js";
import { OpenAI } from "openai";
import { addCommentToPR } from "./pr.js";
import * as tl from "azure-pipelines-task-lib/task.js";

const defaultOpenAIModel = "gpt-3.5-turbo";

const instructions = `
Act as a code reviewer of a Pull Request, providing feedback on possible bugs and clean code issues.
You are provided with the Pull Request changes in a patch format.
Each patch entry has the commit message in the Subject line followed by the code changes (diffs) in a unidiff format.

As a code reviewer, your task is:
- Review only added, edited or deleted lines.
- If there's no bugs and the changes are correct, write only 'No feedback.'
- If there's a bug or incorrect code changes, don't write 'No feedback.'
`;

export async function reviewFile(
  targetBranch: string,
  fileName: string,
  openai: OpenAI,
): Promise<void> {
  try {
    tl.debug(`Start reviewing ${fileName}...`);

    const patch = await git.diff([targetBranch, "--", fileName]);
    const model = tl.getInput("model") || defaultOpenAIModel;

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: instructions },
        { role: "user", content: patch },
      ],
      max_tokens: 2000,
    });

    const review = response.choices[0]?.message?.content?.trim() || "";

    if (review !== "No feedback.") {
      await addCommentToPR(fileName, review);
    }

    tl.debug(`Review of ${fileName} completed.`);
  } catch (error: any) {
    handleError(error, fileName);
  }
}

const handleError = (error: any, fileName: string): void => {
  if (error.response) {
    tl.error(`Error response for ${fileName}: ${error.response.status}`);
    tl.error(JSON.stringify(error.response.data));
  } else {
    tl.error(`Error for ${fileName}: ${error.message}`);
  }
};
