import { SimpleGitOptions, SimpleGit, simpleGit } from "simple-git";
import * as tl from "azure-pipelines-task-lib/task.js";
import binaryExtensions from "binary-extensions";
import { getFileExtension } from "./utils.js";

// Constants
const DEFAULT_WORKING_DIR = tl.getVariable("System.DefaultWorkingDirectory");

// Function to configure and return SimpleGit
const initializeGit = (): SimpleGit => {
  if (!DEFAULT_WORKING_DIR) {
    throw new Error("System.DefaultWorkingDirectory is not set.");
  }

  const gitOptions: Partial<SimpleGitOptions> = {
    baseDir: DEFAULT_WORKING_DIR,
    binary: "git",
  };

  return simpleGit(gitOptions);
};

export const git: SimpleGit = initializeGit();

// Function to configure git settings
const configureGit = async (git: SimpleGit): Promise<void> => {
  try {
    await git.addConfig("core.pager", "cat");
    await git.addConfig("core.quotepath", "false");
  } catch (err) {
    tl.error(`Failed to configure git: ${(err as Error).message}`);
    throw err;
  }
};

// Function to fetch changes from remote
const fetchGitChanges = async (git: SimpleGit): Promise<void> => {
  try {
    await git.fetch();
  } catch (err) {
    tl.error(`Failed to fetch git changes: ${(err as Error).message}`);
    throw err;
  }
};

// Function to get the list of changed files
const getDiffFiles = async (
  git: SimpleGit,
  targetBranch: string,
): Promise<string[]> => {
  try {
    const diffs = await git.diff([
      targetBranch,
      "--name-only",
      "--diff-filter=AM",
    ]);
    return diffs
      .split("\n")
      .map((fileName) => fileName.trim())
      .filter((fileName) => fileName.length > 0);
  } catch (err) {
    tl.error(`Failed to get diff files: ${(err as Error).message}`);
    throw err;
  }
};

// Function to filter out binary files
const filterNonBinaryFiles = (files: string[]): string[] => {
  return files.filter((file) => {
    const ext = getFileExtension(file);
    return !binaryExtensions.includes(ext);
  });
};

// Main function to get changed files excluding binary files
export async function getChangedFiles(targetBranch: string): Promise<string[]> {
  try {
    await configureGit(git);
    await fetchGitChanges(git);

    const files = await getDiffFiles(git, targetBranch);
    const nonBinaryFiles = filterNonBinaryFiles(files);

    tl.debug(
      `Changed Files (excluding binary files): \n${nonBinaryFiles.join("\n")}`,
    );
    return nonBinaryFiles;
  } catch (err) {
    tl.error(`Error in getChangedFiles: ${(err as Error).message}`);
    throw err;
  }
}
