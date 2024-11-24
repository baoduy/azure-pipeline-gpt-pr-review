#!/bin/bash

# Path to your task.json file
TASK_JSON_PATH="./task.json"

# Read the current Patch version using grep and awk
CURRENT_PATCH=$(grep '"Patch":' "$TASK_JSON_PATH" | awk -F'"' '{print $4}')

# Increment the Patch version
NEW_PATCH=$((CURRENT_PATCH + 1))

# Update the task.json with the new Patch version using sed
sed -i.bak "s/\"Patch\": \"$CURRENT_PATCH\"/\"Patch\": \"$NEW_PATCH\"/" "$TASK_JSON_PATH"

# Clean up the backup file created by sed
rm "${TASK_JSON_PATH}.bak"

echo "Patch version updated to $NEW_PATCH"
