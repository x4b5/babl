# /commit — Conventional Commit

Create a conventional commit for staged changes.

## Instructions

1. Run `git status` and `git diff --cached` to see staged changes.
2. If nothing is staged, inform the user and stop.
3. Analyze the changes and determine the commit type:
   - `feat` — new feature
   - `fix` — bug fix
   - `refactor` — code refactoring
   - `docs` — documentation only
   - `style` — formatting, no code change
   - `test` — adding or updating tests
   - `chore` — maintenance, dependencies, config
4. Draft a commit message in the format: `type: short description`
   - Keep the subject line under 72 characters.
   - Use imperative mood ("add", "fix", "update", not "added", "fixes").
5. Show the proposed commit message to the user and ask for confirmation.
6. On approval, run the commit. Do NOT use `--no-verify`.
7. Show the result of `git log --oneline -1` to confirm.
