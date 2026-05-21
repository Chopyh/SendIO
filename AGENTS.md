# SendIO Essential Operating Procedures

## Project Summary
- **What this project is:** SendIO is a modular product built around backend services, frontend applications, and operational tooling, with documentation as a first-class artifact.
- **What the app is about:** SendIO is primarily a drag-and-drop email builder and campaign platform, allowing teams to design emails visually and send them in bulk to managed contact lists.
- **Main product scope:** The app includes an editor experience for composing email layouts, contact and audience management, mass sending workflows, and backend/API capabilities for campaign execution and tracking.
- **Workspace model:** The product follows an account-to-workspace model similar to Notion: users belong to an account, accounts can have one or more workspaces, and collaboration and resources are scoped by workspace.
- **Main objectives:** Deliver reliable features, keep architecture maintainable, enforce i18n support (`en` and `es` as priorities), and preserve operational consistency through Docker-based workflows.
- **Target outcomes:** Improve delivery speed, reduce operational friction, and maintain a predictable engineering workflow through clear standards, test coverage, and living documentation.
- **Intended structure:** Organize the repository by clear domains (business, architecture, backend, frontend, devops, workflow, tasks, and design), and evolve this structure as the product grows.

## Core Rules
- **English Only:** All code and comments MUST be in English.
- **i18n Required:** The product MUST support multiple languages, with priority support for English (`en`) and Spanish (`es`).
- **Docker Only:** Execute ALL PHP/Laravel commands via Docker (no local PHP).
- **Documentation First:** All implementations must be documented in `docs/`.
- **Documentation Before Decisions:** Before making any implementation decision by default, review the relevant documentation in `docs/` and follow it.
- **Notion Fallback:** If required guidance is not found in `docs/`, review the project Notion before making assumptions.
- **Dual Documentation Required:** Every change and decision must be recorded in both `docs/` and Notion.
- **Frontend Styling Standard:** Use TailwindCSS utilities for UI styles by default. If reuse is needed, group utilities with `@apply` in CSS. Keep animations in plain CSS.
- **Task-Driven:** All implementation tasks MUST be defined and tracked in `docs/tasks/`.
- **TDD Mandatory:** All features must pass tests. Follow TDD: start with generic tests and progressively specify more detailed ones.
- **Stack-Bound Implementation:** Do not introduce new runtimes, languages, frameworks, or top-level source trees unless the active task/spec explicitly requires them. SendIO's current implementation stack is Laravel/PHP for backend, Angular/TypeScript for frontend, Docker for operations, and Markdown for documentation.

## Essential Commands
- **Windows:** `.\sendio.ps1 [up|down|artisan|composer|migrate|logs|sh]`
- **Linux/WSL:** `./sendio.sh [up|down|artisan|composer|migrate|logs|sh]`

## Documentation Index
- **Indexing Required:** Every new document created under `docs/` MUST be added to this index (or the corresponding section index) as part of the same change.
- **Directory Flexibility:** It is allowed to create any new directories under `docs/` when needed to keep documentation organized and scalable.
- **[Main Documentation Root](docs/README.md)** (Index by Scope)
- **[Implementation Tasks](docs/tasks/)**
- **[Design Assets](docs/design/)**
- [Business Overview](docs/business/overview.md)
- [Architecture & Infrastructure](docs/architecture/infrastructure.md)
- [Backend Setup](docs/backend/laravel_setup.md)
- [Frontend Setup](docs/frontend/angular_setup.md)
- [UI Reorganization Guide](docs/frontend/ui-reorganization.md)
- [DevOps Guide](docs/devops/docker_setup.md)
- [Workflow Standards](docs/workflow/standards.md)
