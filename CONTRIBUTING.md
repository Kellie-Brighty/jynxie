# Contributing to RenewdLauncher Telegram Bot

Thank you for your interest in contributing to RenewdLauncher! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Firebase CLI
- Git
- A Telegram Bot Token (for testing)
- Basic knowledge of JavaScript/Node.js

### Setup Development Environment

1. **Fork the repository**

   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/yourusername/renewdlauncher-bot.git
   cd renewdlauncher-bot
   ```

2. **Install dependencies**

   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

3. **Set up environment**

   ```bash
   # Copy environment template
   cp .env.example .env
   # Fill in your test values
   ```

4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📝 Development Guidelines

### Code Style

- Use ES6+ features where appropriate
- Follow consistent naming conventions
- Add comments for complex logic
- Keep functions small and focused
- Use meaningful variable names

### File Organization

- Place bot logic in `src/bot/`
- Database operations in `src/services/database.js`
- Blockchain interactions in `src/services/blockchain.js`
- UI components in `src/bot/interface.js`
- Firebase Functions in `functions/`

### Environment Variables

- Never commit actual API keys or private keys
- Add new environment variables to `.env.example`
- Document new variables in README.md
- Use the config.js system for accessing environment variables

## 🧪 Testing

### Local Testing

```bash
# Start development server
npm run dev

# Test with your Telegram bot
# Use /start command to test basic functionality
```

### Firebase Testing

```bash
# Test functions locally
firebase functions:shell

# Deploy to development project
firebase use dev-project-id
npm run deploy:functions
```

### Contract Testing

```bash
# Test on Sepolia testnet only
# Ensure you have test ETH
# Test token launches with small amounts
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment Details**

   - Node.js version
   - Operating system
   - Firebase project setup

2. **Steps to Reproduce**

   - Clear, numbered steps
   - Expected vs actual behavior
   - Screenshots if applicable

3. **Error Messages**

   - Complete error logs
   - Function logs from Firebase
   - Console output

4. **Additional Context**
   - Recent changes made
   - Configuration details (without sensitive data)

## ✨ Feature Requests

Before requesting features:

1. Check existing issues and pull requests
2. Consider if it fits the project scope
3. Provide clear use cases and benefits
4. Consider implementation complexity

## 📋 Pull Request Process

### Before Submitting

1. **Test your changes thoroughly**

   - Test bot commands
   - Verify Firebase deployment
   - Check error handling

2. **Update documentation**

   - Update README.md if needed
   - Add comments to complex code
   - Update environment variable examples

3. **Follow commit conventions**
   ```bash
   feat: add new token validation feature
   fix: resolve webhook timeout issue
   docs: update deployment instructions
   refactor: improve database query efficiency
   ```

### Pull Request Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing

- [ ] Local testing completed
- [ ] Firebase deployment tested
- [ ] Bot commands verified

## Checklist

- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No sensitive data committed
```

## 🔐 Security Considerations

### Sensitive Data

- Never commit private keys, API keys, or tokens
- Use environment variables for all secrets
- Be careful with console.log statements in production
- Review changes for accidental data exposure

### Smart Contracts

- Only deploy to testnets during development
- Test thoroughly before mainnet deployment
- Be aware of gas costs and optimization
- Consider security implications of contract changes

### Firebase Security

- Follow Firebase security rules best practices
- Test authentication and authorization
- Verify user data access patterns
- Monitor for unusual activity

## 📚 Resources

### Documentation

- [Node.js Documentation](https://nodejs.org/docs/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Ethers.js Documentation](https://docs.ethers.org/)

### Learning Resources

- [Firebase Functions Tutorial](https://firebase.google.com/docs/functions/get-started)
- [Telegram Bot Development](https://core.telegram.org/bots/tutorial)
- [Ethereum Development](https://ethereum.org/developers/)

## 🤝 Community

### Communication

- Use GitHub issues for bug reports and feature requests
- Be respectful and constructive in discussions
- Help other contributors when possible
- Follow project code of conduct

### Recognition

Contributors will be:

- Added to the contributors list
- Recognized in release notes
- Mentioned in project documentation

## ❓ Questions

If you have questions:

1. Check existing documentation
2. Search through issues
3. Create a new issue with the "question" label
4. Provide context and specific details

Thank you for contributing! 🚀
