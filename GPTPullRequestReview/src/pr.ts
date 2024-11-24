import * as tl from "azure-pipelines-task-lib/task.js";

const getDevOpsUrl = ({
  threadId,
  commentId,
}: { threadId?: string; commentId?: string } = {}) => {
  const teamUrl = tl.getVariable("SYSTEM.TEAMFOUNDATIONCOLLECTIONURI");
  const projectId = tl.getVariable("SYSTEM.TEAMPROJECTID");
  const repoName = tl.getVariable("Build.Repository.ID");
  const prId = tl.getVariable("System.PullRequest.PullRequestId");

  let prUrl = `${teamUrl}${projectId}/_apis/git/repositories/${repoName}/pullRequests/${prId}/threads`;

  if (threadId) {
    prUrl = `${prUrl}/${threadId}/comments`;
    if (commentId) prUrl = `${prUrl}/${commentId}`;
  }

  console.log("getDevOpsUrl:", prUrl);
  return `${prUrl}?api-version=7.1`;
};

export async function addCommentToPR(fileName: string, comment: string) {
  const body = {
    comments: [
      {
        parentCommentId: 0,
        content: comment,
        commentType: 1,
      },
    ],
    status: 1,
    threadContext: {
      filePath: fileName,
    },
  };

  const prUrl = getDevOpsUrl();

  await fetch(prUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tl.getVariable("SYSTEM.ACCESSTOKEN")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }).then(async (rs) => {
    if (!rs.ok) {
      const errorText = await rs.text();
      throw new Error(errorText);
    }
    return rs;
  });

  console.log(`New comment added`);
}

export async function deleteExistingComments() {
  console.log("Start deleting existing comments added by the previous Job ...");

  const threadsUrl = getDevOpsUrl();
  const threadsResponse = await fetch(threadsUrl, {
    headers: {
      Authorization: `Bearer ${tl.getVariable("SYSTEM.ACCESSTOKEN")}`,
    },
  }).then(async (rs) => {
    if (!rs.ok) {
      const errorText = await rs.text();
      throw new Error(errorText);
    }
    return rs;
  });

  const threads = (await threadsResponse.json()) as { value: [] };
  const threadsWithContext = threads.value.filter(
    (thread: any) => thread.threadContext !== null,
  );

  const collectionUri = tl.getVariable(
    "SYSTEM.TEAMFOUNDATIONCOLLECTIONURI",
  ) as string;
  const collectionName = getCollectionName(collectionUri);
  const buildServiceName = `${tl.getVariable("SYSTEM.TEAMPROJECT")} Build Service (${collectionName})`;

  for (const thread of threadsWithContext as any[]) {
    const commentsUrl = getDevOpsUrl({ threadId: thread.id });
    const commentsResponse = await fetch(commentsUrl, {
      headers: {
        Authorization: `Bearer ${tl.getVariable("SYSTEM.ACCESSTOKEN")}`,
      },
    }).then(async (rs) => {
      if (!rs.ok) {
        const errorText = await rs.text();
        throw new Error(errorText);
      }
      return rs;
    });

    const comments = (await commentsResponse.json()) as { value: [] };

    for (const comment of comments.value.filter(
      (comment: any) => comment.author.displayName === buildServiceName,
    ) as any[]) {
      const removeCommentUrl = getDevOpsUrl({
        threadId: thread.id,
        commentId: comment.id,
      });

      await fetch(removeCommentUrl, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${tl.getVariable("SYSTEM.ACCESSTOKEN")}`,
        },
      }).then(async (rs) => {
        if (!rs.ok) {
          const errorText = await rs.text();
          throw new Error(errorText);
        }
        return rs;
      });
    }
  }

  console.log("Existing comments deleted.");
}

function getCollectionName(collectionUri: string) {
  const collectionUriWithoutProtocol = collectionUri!
    .replace("https://", "")
    .replace("http://", "");

  if (collectionUriWithoutProtocol.includes(".visualstudio.")) {
    return collectionUriWithoutProtocol.split(".visualstudio.")[0];
  } else {
    return collectionUriWithoutProtocol.split("/")[1];
  }
}
