# IXpence

Canonical GitHub repository: https://github.com/andreimihai-designam/IXpense---Expense-Mangement

The user requests that every future application change also be committed and pushed to this same repository. Do not create replacement repositories for subsequent changes. Preserve origin as the canonical GitHub repository and preserve the existing Sites remote and identity in .openai/hosting.json.

Application assets are served from dist/. GitHub Pages deployment is defined in .github/workflows/deploy-pages.yml and runs on pushes to main, after npm run check and npm test succeed. Do not claim a deployment succeeded before checking its actual status.

Never commit local financial data, credentials, tokens, or work/ files. Data remain local to each browser and origin. Hosting on a new domain does not transfer browser storage from the previous origin.
