# /review — Code Review

Review staged or recent changes and provide feedback.

## Instructions

1. Run `git diff --cached` to see staged changes. If nothing is staged, run `git diff` for unstaged changes.
2. If no changes are found, inform the user and stop.
3. Review the changes for:
   - **Correctness** — logic errors, off-by-one, null handling
   - **Security** — exposed secrets, injection risks, unsafe inputs
   - **Style** — naming conventions, formatting (per `.claude/rules/code-standards.md`)
   - **Simplicity** — unnecessary complexity, dead code, over-engineering
   - **Types** — missing or incorrect TypeScript types
4. For each issue found, report:
   - File and line number
   - Severity: `error`, `warning`, or `suggestion`
   - Description of the issue
   - Suggested fix (if applicable)
5. End with a summary: total issues by severity and an overall assessment.
