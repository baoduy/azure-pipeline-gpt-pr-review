import * as tl from "azure-pipelines-task-lib/task.js";
import { ClientOptions, OpenAI } from "openai";
import { deleteExistingComments } from "./pr.js";
import { reviewFile } from "./review.js";
import { getTargetBranchName } from "./utils.js";
import { getChangedFiles } from "./git.js";

 // Function to check if a file should be included
 const shouldIncludeFile = (fileName: string,{includeExtensions,excludeExtensions}:{includeExtensions:Array<string>,excludeExtensions:Array<string>}) => {
   const fileExt = fileName.split('.').pop()?.toLowerCase();
   
   // If includeExts is specified, only include files with those extensions
   if (includeExtensions.length > 0) {
     return includeExtensions.includes(fileExt!);
   }

   // If excludeExts is specified, exclude files with those extensions
   if (excludeExtensions.length > 0) {
     return !excludeExtensions.includes(fileExt!);
   }

   // If no include or exclude extensions are specified, include all files
   return true;
 };

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
    const includeExts = tl.getInput("includes");
    const excludeExts = tl.getInput("excludes");

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

    const includeExtensions = includeExts ? includeExts.split(',').map(ext => ext.trim()) : [];
    const excludeExtensions = excludeExts ? excludeExts.split(',').map(ext => ext.trim()) : [];

    // Filter the files based on the include and exclude rules
    const filteredFileNames = filesNames.filter(f=>shouldIncludeFile(f,{includeExtensions,excludeExtensions}));

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
