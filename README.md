# GPT Pull Request Review Task for Azure DevOps

A task for Azure DevOps build pipelines to add GPT as a Pull Request reviewer.

---

## Table of Contents

- [GPT Pull Request Review Task for Azure DevOps](#gpt-pull-request-review-task-for-azure-devops)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Setup](#setup)
    - [Give permission to the build service agent](#give-permission-to-the-build-service-agent)
    - [Allow Task to access the system token](#allow-task-to-access-the-system-token)
      - [YAML pipelines](#yaml-pipelines)
    - [Azure Open AI service](#azure-open-ai-service)
    - [OpenAI Models](#openai-models)
  - [How to Use](#how-to-use)
    - [Install the extension](#install-the-extension)
    - [Add the task to the build pipeline](#add-the-task-to-the-build-pipeline)
    - [Configure the task](#configure-the-task)
    - [Review Pull Requests](#review-pull-requests)
  - [License](#license)

---

## Installation

Installation can be done using the Visual Studio MarketPlace.

- **Visual Studio MarketPlace**: [GPT Pull Request Review](https://marketplace.visualstudio.com/items?itemName=baoduy2412.GPTPullRequestReviewDrunk)

---

## Setup

Add the GPT Pull Request Review task to your Azure DevOps build definition.

### Give permission to the build service agent

To use the GPT Pull Request Review task, you need to ensure the build service agent has the necessary permissions to contribute to pull requests in your repository. Follow these steps:

1. **Navigate to Project Settings**:
   - Go to your Azure DevOps project and click on "Project Settings" at the bottom of the left navigation panel.

2. **Manage Security**:
   - Under "Pipelines", click on "Security".

3. **Add Build Service Account**:
   - Click on "Add" to add a new user or group.
   - Search for and select the build service account (e.g., `ProjectName Build Service (OrganizationName)`).
    ![Build service account](/images/build_service_account.png?raw=true)

4. **Assign Permissions**:
   - Add the build service account to the `Build Administrators` group or grant it the specific permission "Contribute to pull requests".
  
    ![Contribute to PR](/images/contribute_to_pr.png?raw=true)

5. **Verify Permissions**:
   - Ensure the build service account has the required permissions by checking the permissions list.

By following these steps, you ensure that the build service agent can interact with pull requests, allowing the GPT Pull Request Review task to work correctly.

### Allow Task to access the system token

#### YAML pipelines

Add a checkout section with `persistCredentials` set to `true`.

```yaml
steps:
- checkout: self
  persistCredentials: true
```

### Azure Open AI service

If you choose to use the Azure Open AI service, you must fill in the endpoint and API key of Azure OpenAI. The format of the endpoint is as follows:

```
https://{XXXXXXXX}.openai.azure.com/openai/deployments/{MODEL_NAME}/chat/completions?api-version={API_VERSION}
```

### OpenAI Models

In case you don't use Azure Open AI Service, you can choose which model to use. The supported models are:

- `gpt-4`
- `gpt-3.5-turbo`
- `gpt-3.5-turbo-16k`

If no model is selected, `gpt-3.5-turbo` is used by default.

---

## How to Use

### Install the extension

To use the GPT Pull Request Review Task, first install the extension in your Azure DevOps organization.

1. Go to the Visual Studio MarketPlace.
2. Search for "GPT Pull Request Review".
3. Click on "Get it free" and follow the prompts to install it.
4. Authorize the extension to access your Azure DevOps account if prompted.

### Add the task to the build pipeline

After installing the extension, add the task to your build pipeline.

1. Go to your build pipeline.
2. Click on the "+" icon to add a new task.
3. Search for "Review PullRequest by GPT".
4. Select it and add it to your pipeline.

### Configure the task

Once you have added the task to your pipeline, configure it.

1. Provide your API key for OpenAI API. You can create an API key at [OpenAI API Keys](https://platform.openai.com/account/api-keys).
2. Optionally, configure the model to use (default is `gpt-3.5-turbo`).

### Review Pull Requests

When the build is triggered from a Pull Request, the task will review it. If there is feedback on the changed code, the task will add comments to the Pull Request. If the build is triggered manually, the task will be skipped.

## License

This project is licensed under the MIT License. See the [LICENSE]
