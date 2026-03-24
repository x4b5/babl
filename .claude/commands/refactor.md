# /refactor — Guided Refactoring

Refactor code with a plan-first approach.

## Instructions

1. Ask the user what they want to refactor (file, function, module, or pattern).
2. Read the target code and analyze it.
3. Propose a refactoring plan:
   - What will change
   - Why it improves the code
   - Files affected
   - Risks or breaking changes
4. Wait for user approval before making any changes.
5. Apply the refactoring step by step.
6. After refactoring, run `npm run check` to verify TypeScript types.
7. Show a summary of what changed.
