<<<<<<< HEAD
# Contributing to Sensible Analytics

First off, thank you for considering contributing to Sensible Analytics! It's people like you that make our tools better for everyone.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Workflow](#development-workflow)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## 🚀 Getting Started

### Prerequisites

- Git
- Node.js (for JavaScript/TypeScript projects)
- Python 3.x (for Python projects)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/REPO_NAME.git
cd REPO_NAME
```

3. Add the upstream repository:

```bash
git remote add upstream https://github.com/Sensible-Analytics/REPO_NAME.git
```

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to see if the problem has already been reported. When you are creating a bug report, please include as many details as possible:

- **Use the bug report template** - it includes helpful prompts
- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce**
- **Provide specific examples** - include links, screenshots, or code snippets
- **Describe the behavior you observed** and what behavior you expected
- **Include your environment details** - OS, browser, Node.js version, etc.

### Suggesting Features

Feature requests are tracked as GitHub issues. When creating a feature request:

- **Use the feature request template**
- **Use a clear and descriptive title**
- **Provide a step-by-step description** of the suggested enhancement
- **Provide specific examples** to demonstrate the feature
- **Explain why this enhancement would be useful**

### Pull Requests

1. Fill in the required template
2. Do not include issue numbers in the PR title
3. Include screenshots and animated GIFs in your pull request whenever possible
4. Follow our [style guidelines](#style-guidelines)
5. Document new code based on our documentation standards
6. End all files with a newline

## 💻 Development Workflow

### Setting Up Your Environment

```bash
# Install dependencies
npm install  # or yarn install, pip install -r requirements.txt

# Run tests to ensure everything works
npm test     # or pytest

# Start development server (if applicable)
npm run dev  # or similar
```

### Creating a Branch

```bash
# Fetch latest changes from upstream
git fetch upstream

# Create a new branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### Making Changes

1. Make your changes in your branch
2. Add or update tests as necessary
3. Update documentation to reflect your changes
4. Run the test suite to ensure nothing is broken

### Keeping Your Branch Updated

```bash
git fetch upstream
git rebase upstream/main  # or upstream/master
```

## 🎨 Style Guidelines

### JavaScript/TypeScript

- We use ESLint and Prettier for code formatting
- Run `npm run lint` before committing
- Follow the existing code style in the project

### Python

- Follow PEP 8 style guide
- Use meaningful variable names
- Add docstrings to functions and classes

### Documentation

- Use clear and concise language
- Include code examples where helpful
- Keep README files up to date

## 📝 Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Code change that improves performance
- **test**: Adding or correcting tests
- **chore**: Changes to build process or auxiliary tools

Examples:
```
feat(auth): add OAuth2 login support

fix(api): resolve null pointer exception in user service

docs(readme): update installation instructions
```

## 🔄 Pull Request Process

1. **Update the README.md** with details of changes to the interface, if applicable
2. **Update documentation** with details of any changes to the API or behavior
3. **Ensure all tests pass**
4. **Request review** from maintainers
5. **Address review feedback** promptly
6. **Squash commits** if requested

### Review Process

- All submissions require review before being merged
- We aim to review PRs within 48-72 hours
- Be responsive to feedback and make requested changes
- Maintainers may request changes or provide feedback

### After Your Pull Request is Merged

You can safely delete your branch and pull the changes from upstream:

```bash
git checkout main
git pull upstream main
```

## 🆘 Getting Help

- Check our [FAQ](https://github.com/orgs/Sensible-Analytics/discussions/categories/q-a) in Discussions
- Ask questions in [GitHub Discussions](https://github.com/orgs/Sensible-Analytics/discussions)
- Join our community chat (if available)

## 🙏 Recognition

Contributors will be recognized in our README files and release notes.

Thank you for contributing! 🎉
=======
# Contributing to CardScannerApp

Thank you for considering contributing to CardScannerApp! Please read this guide to understand our development process and how you can contribute effectively.

## How to Contribute

### Reporting Bugs

- Use the GitHub Issues tracker
- Include steps to reproduce, expected behavior, and actual behavior
- Add screenshots if applicable
- Label as "bug"

### Suggesting Features

- Use the GitHub Issues tracker
- Label as "enhancement"
- Describe the feature and its benefits
- Consider if it aligns with the project roadmap

### Submitting Changes

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests to ensure nothing is broken
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js v18 or later
- npm or yarn
- Xcode (for iOS)
- Android Studio (for Android)
- Git

### Installation

```bash
git clone https://github.com/Sensible-Analytics/CardScannerApp.git
cd CardScannerApp
npm install
cd ios && pod install && cd ..
```

## Release Process

### Versioning

We use Semantic Versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Incompatible API changes or major redesigns
- **MINOR**: New features in backward-compatible manner
- **PATCH**: Bug fixes and minor improvements

### Release Workflow

1. **Update Version Numbers**
   - Update `package.json` version
   - Update `app.json` version
   - Update `ios/` and `android/` version if needed

2. **Prepare Release Notes**
   - Document changes in release notes
   - Update CHANGELOG.md if maintained

3. **Generate Release Artifacts**
   ```bash
   # Build iOS release (requires Xcode)
   npm run release:ios
   
   # Build Android release
   npm run release:android
   
   # Verify artifacts
   npm run release:verify
   ```

4. **Create Git Tag and Release**
   ```bash
   git tag -a v1.0.0 -m "Version 1.0.0"
   git push origin v1.0.0
   ```

5. **Submit to App Stores**
   - Upload to App Store Connect (iOS)
   - Upload to Google Play Console (Android)
   - Complete store listings
   - Submit for review

### Store Listing Preparation

See `app-store-listing.md` for detailed store listing requirements and guidelines.

Required assets:
- Screenshots for all required device sizes
- App icons in various sizes
- Privacy policy URL
- Store descriptions and keywords
- Feature graphics

Assets should be placed in the `store-assets/` directory structure.

### CI/CD Release Pipeline

Our CI/CD pipeline includes:
- **CI Workflow**: Runs tests on every push and pull request
- **Android Build**: Builds and tests Android app
- **iOS Build**: Builds and tests iOS app
- **Release Workflow**: Creates GitHub releases with artifacts when tags are pushed

To trigger a release:
1. Ensure all tests pass on main branch
2. Create and push a version tag: `git tag -a v1.0.0 -m "Version 1.0.0"`
3. Push tag: `git push origin v1.0.0`
4. GitHub Actions will automatically build and create a release

### Running Tests

```bash
# Unit tests
npm test

# E2E tests (iOS)
npm run detox:test -- --configuration ios.sim

# E2E tests (Android)
npm run detox:test -- --configuration android.emu

# Linting
npm run lint

# TypeScript
npm run tsc --noEmit
```

## Coding Standards

### TypeScript

- Use strict mode (enabled in tsconfig.json)
- Prefer interfaces over types for object shapes
- Use functional components with hooks
- Export interfaces/types when they're public

### React Native

- Use StyleSheet.create() for styles
- Always provide accessibilityLabel for interactive elements
- Use Platform.OS for platform-specific code when needed
- Use FlatList for long lists of data

### Testing

- Write unit tests for utility functions
- Write E2E tests for user flows
- Follow AAA pattern: Arrange, Act, Assert
- Mock external dependencies appropriately

### Git

- Write clear, descriptive commit messages
- Reference issue numbers when applicable (e.g., "Fixes #123")
- Keep commits focused on single changes
- Use conventional commit format when possible

## Code Review Process

1. All PRs require at least one approval
2. CI must pass (tests, lint, build)
3. No breaking changes without discussion
4. Documentation updated when needed
5. Squash and merge preferred for feature branches

## Community

Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms.

## Getting Help

If you need help:

- Check existing issues for similar problems
- Ask in the GitHub Discussions
- Refer to the documentation in /docs
- As a last resort, open a new issue

Thank you for contributing to CardScannerApp!
>>>>>>> origin/main
