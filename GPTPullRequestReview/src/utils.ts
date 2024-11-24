import * as tl from "azure-pipelines-task-lib/task.js";

export function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex === -1) {
    return "";
  }
  return fileName.slice(lastDotIndex + 1).toLowerCase();
}

export function getTargetBranchName(): string | undefined {
  let targetBranchName = tl.getVariable("System.PullRequest.TargetBranchName");

  if (!targetBranchName) {
    targetBranchName = tl
      .getVariable("System.PullRequest.TargetBranch")
      ?.replace("refs/heads/", "");
  }

  if (!targetBranchName) {
    tl.warning("Target branch name not found.");
    return undefined;
  }

  const fullTargetBranchName = `origin/${targetBranchName}`;
  tl.debug(`Target branch name: ${fullTargetBranchName}`);
  return fullTargetBranchName;
}
