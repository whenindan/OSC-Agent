## Steps to Create an npm Automation Token and Add It to GitHub Actions

1. **Log in to npm**
   - Go to [https://www.npmjs.com](https://www.npmjs.com).
   - Sign in with your npm account.

2. **Navigate to Access Tokens**
   - Click your profile picture in the top right.
   - Select **Access Tokens** from the dropdown menu.

3. **Generate a New Token**
   - Click **Generate New Token**.
   - Choose **Automation** as the token type (best for CI/CD).
   - Enter a descriptive **name** (e.g., `github-actions-publish`).
   - Confirm and copy the token (you will only see it once).

4. **Add the Token to GitHub Secrets**
   - Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**.
   - Click **New repository secret**.
   - Name the secret: `NPM_TOKEN`.
   - Paste the token value you copied from npm.

5. **Reference the Token in Your Workflow**
   - In your GitHub Actions workflow file (e.g., `publish.yml`), add:
     ```yaml
     env:
       NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
     ```
   - Example usage:
     ```yaml
     - run: npm publish
       env:
         NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
     ```

6. **Install the GitHub Actions VS Code Extension**
   - For easier workflow authoring and validation, install the **GitHub Actions extension** (`github.vscode-github-actions`) in VS Code.
   - This provides syntax highlighting, schema validation, and workflow run management directly inside your editor.

---
