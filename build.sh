# npm install -g tfx-cli

npm --prefix ./GPTPullRequestReview run build
npm --prefix ./GPTPullRequestReview run version-up
tfx extension create --manifest-globs vss-extension.json --env mode=production --rev-version