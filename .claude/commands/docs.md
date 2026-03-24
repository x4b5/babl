# /docs — Generate Documentation

Generate or update documentation for code.

## Instructions

1. Ask the user what to document: a file, function, module, or the full project.
2. Read the target code.
3. Generate documentation that includes:
   - **Purpose** — what the code does and why
   - **API** — exported functions, classes, types with parameters and return values
   - **Usage** — example code showing how to use it
   - **Dependencies** — external packages or internal modules used
4. Follow these rules:
   - Use JSDoc/TSDoc format for inline documentation.
   - Use Markdown for standalone docs.
   - Be concise — document the "why", not the obvious "what".
   - Do not add documentation for self-explanatory code.
5. Show the generated docs to the user for review before writing.

## Existing Documentation

Project documentation lives in `docs/`. Before generating new docs, check if the topic is already covered and update it instead of creating a new file.
