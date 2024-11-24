import * as tl from "azure-pipelines-task-lib/task.js";
import { ClientOptions, OpenAI } from "openai";
import { deleteExistingComments } from "./pr.js";
import { reviewFile } from "./review.js";
import { getTargetBranchName } from "./utils.js";
import { getChangedFiles } from "./git.js";

async function run() {
  try {
    if (tl.getVariable("Build.Reason") !== "PullRequest") {
      tl.setResult(
        tl.TaskResult.Skipped,
        "This task should be run only when the build is triggered from a Pull Request.",
      );
      return;
    }

    const apiKey = tl.getInput("api_key", true);
    const baseURL = tl.getInput("base_url");

    if (apiKey == undefined) {
      tl.setResult(tl.TaskResult.Failed, "No Api Key provided!");
      return;
    }

    const openAiConfiguration: ClientOptions = {
      apiKey,
      baseURL,
    };

    const openai = new OpenAI(openAiConfiguration);
    const targetBranch = getTargetBranchName();

    if (!targetBranch) {
      tl.setResult(tl.TaskResult.Failed, "No target branch found!");
      return;
    }

    const filesNames = await getChangedFiles(targetBranch);

    await deleteExistingComments();

    for (const fileName of filesNames) {
      await reviewFile(targetBranch, fileName, openai);
    }

    tl.setResult(tl.TaskResult.Succeeded, "Pull Request reviewed.");
  } catch (err: any) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

run().finally();
