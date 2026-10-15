# Application versioning

- Read the application version from `package.json`; do not hard-code a second
  version in the UI.
- When completing a batch of major application changes (new features, workflow
  changes, or access-control changes), increment the major version once using
  `npm run version:major`. Do not increment it separately for each file or build.
- For small fixes, use `npm version patch --no-git-tag-version`.
- Keep the application version in `package-lock.json` synchronized with
  `package.json`. Include the resulting version in the completion message.
