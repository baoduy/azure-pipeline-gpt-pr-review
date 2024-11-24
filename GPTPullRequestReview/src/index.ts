import * as tl from "azure-pipelines-task-lib/task.js";
import { ClientOptions, OpenAI } from "openai";
import { deleteExistingComments } from "./pr.js";
import { reviewFile } from "./review.js";
import { getTargetBranchName } from "./utils.js";
import { getChangedFiles } from "./git.js";

type FileFilterOptions = {
  includeExtensions: string[];
  excludeExtensions: string[];
};

// Function to check if a file should be included
const shouldIncludeFile = (
  fileName: string,
  { includeExtensions, excludeExtensions }: FileFilterOptions,
): boolean => {
  const fileExt = fileName.split(".").pop()?.toLowerCase() || "";
  if (includeExtensions.length > 0) return includeExtensions.includes(fileExt);
  if (excludeExtensions.length > 0) return !excludeExtensions.includes(fileExt);
  return true;
};

const readConfiguration = (): {
  apiKey: string;
  baseURL?: string;
  includeExts: string[];
  excludeExts: string[];
} => {
  const apiKey = tl.getInput("api_key", true);
  const baseURL = tl.getInput("base_url");
  const includeExts =
    tl
      .getInput("includes")
      ?.split(",")
      .map((ext) => ext.trim()) ?? [];
  const excludeExts =
    tl
      .getInput("excludes")
      ?.split(",")
      .map((ext) => ext.trim()) ?? [];

  if (!apiKey) throw new Error("No API Key provided!");

  return { apiKey, baseURL, includeExts, excludeExts };
};

const filterFiles = (
  files: string[],
  filterOptions: FileFilterOptions,
): string[] => {
  return files.filter((fileName) => shouldIncludeFile(fileName, filterOptions));
};

const reviewFiles = async (
  files: string[],
  targetBranch: string,
  openai: OpenAI,
): Promise<void> => {
  for (const fileName of files) {
    await reviewFile(targetBranch, fileName, openai);
  }
};

const main = async () => {
  if (tl.getVariable("Build.Reason") !== "PullRequest") {
    tl.setResult(
      tl.TaskResult.Skipped,
      "This task should be run only when the build is triggered from a Pull Request.",
    );
    return;
  }

  try {
    const { apiKey, baseURL, includeExts, excludeExts } = readConfiguration();
    const openAiConfiguration: ClientOptions = { apiKey, baseURL };
    const openai = new OpenAI(openAiConfiguration);

    const targetBranch = getTargetBranchName();
    if (!targetBranch) throw new Error("No target branch found!");

    const fileNames = await getChangedFiles(targetBranch);
    const filteredFileNames = filterFiles(fileNames, {
      includeExtensions: includeExts,
      excludeExtensions: excludeExts,
    });

    await deleteExistingComments();
    await reviewFiles(filteredFileNames, targetBranch, openai);

    tl.setResult(tl.TaskResult.Succeeded, "Pull Request reviewed.");
  } catch (error: any) {
    tl.setResult(
      tl.TaskResult.Failed,
      error.message || "An unknown error occurred",
    );
  }
};

main().finally(() => console.log("Pipeline review task completed."));
