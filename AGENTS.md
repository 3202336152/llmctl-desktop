# Repository Guidelines

## Project Structure & Module Organization
LLMctl ships a Spring Boot backend alongside an Electron desktop client. Backend code resides in `src/main/java/com/llmctl`, with mapper XML in `src/main/resources/mapper` and configuration in `src/main/resources/application.yml`. Tests mirror packages under `src/test/java`. Electron sources live in `electron-app/src`, with webpack output in `electron-app/dist`. Deployment manifests live in `deploy/`, docs in `docs/`, and automation helpers in `scripts/notifications`.

## Build, Test, and Development Commands
- Backend: run `mvn spring-boot:run` from the repository root, and `mvn clean install` to build `target/app.jar`.
- Backend tests: execute `mvn test` for JUnit + Spring Boot coverage; reports land in `target/surefire-reports`.
- Electron: in `electron-app`, run `npm install`, start dev with `npm run dev`, and package with `npm run dist:win` (or the platform variants).

## Coding Style & Naming Conventions
Use Java 17 with four-space indentation. Classes stay UpperCamelCase, methods and fields lowerCamelCase, and constants SCREAMING_SNAKE_CASE. Prefer constructor injection and Lombok annotations already present in the codebase. For the desktop client, follow the existing TypeScript configuration and keep React components in PascalCase files. Lint UI code with `npx eslint src --ext .ts,.tsx` before opening a pull request.

## Testing Guidelines
Keep unit and slice tests adjacent to the classes they verify in `src/test/java`, naming them `<ClassName>Test`. Use Spring Boot test slices for MVC and repository layers, and mock external services to keep runs deterministic. New features should guard security and permission paths while preserving coverage tracked by Surefire. Electron updates need manual smoke checks of launch, terminal sessions, and provider switching until automated coverage exists.

## Commit & Pull Request Guidelines
Follow the conventional `type(scope): summary` format (for example, `feat(app): 实现暗色主题`). Keep the scope aligned with the touched module and use concise, present-tense summaries. Pull requests should explain the change, list validation (`mvn test`, `npm run dev`), and link issues. Provide screenshots for UI adjustments and call out configuration edits touching `application.yml` or `electron-app/.env`.

## Configuration & Secrets
Keep secrets out of version control. Backend credentials belong in external config or Jasypt-encrypted values (`JASYPT_ENCRYPTOR_PASSWORD`). Electron variables live in `electron-app/.env`; update `.env.example` and document new keys in the PR description.
