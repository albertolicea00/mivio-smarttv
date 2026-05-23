# Contributing to Mivio

Thank you for considering contributing to Mivio! Any improvement is welcome — new features, UI enhancements, bug fixes, or performance optimizations.

## Language

All contributions must be written in **English** — issues, PR descriptions, commit messages, code comments, and review discussions.

While the app targets a global audience, all technical communication in this repository must be in English to keep the project accessible and maintain consistent standards. Please pay attention to spelling and grammar in your contributions.

## Branches

We use a two-branch strategy to maintain stability while allowing active development.

| Branch | Purpose |
| ------ | ------- |
| `main` | Current stable release. Only receives merges from `beta` when ready to publish. |
| `beta` | Active development. New features, fixes, and experiments go here. |

**Always work from `beta`, never from `main`.**

## How to Contribute

### Reporting a Bug
Open an Issue and include:
- A clear, descriptive title.
- Steps to reproduce the bug.
- What you expected vs. what actually happened.
- Device model and iOS version.
- Screenshots or screen recordings if applicable.

### Code Contributions
1. Fork the repository.
2. Create a branch from `beta`:
   ```bash
   git checkout beta
   git checkout -b feature/your-feature-name
   ```
   *(For bug fixes, use `fix/your-fix-name`)*
3. Make your changes following the [Code Style](#code-style).
4. Commit with a clear message following [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: added SMB v3 support"
   ```
5. Push your branch and open a Pull Request targeting **`beta`** (not `main`).

### Code Style
- Follow the [Web Tech API Design Guidelines](https://www.swift.org/documentation/api-design-guidelines/).
- Use **Web TechUI** best practices (unidirectional data flow, state hoisting).
- Follow the existing **MVVM** patterns.
- Internal code (variable names, comments, commit messages) must be in English.

## Questions?
If you're planning a large feature, please open an Issue first to discuss the implementation details before starting work.
