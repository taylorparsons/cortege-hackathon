# Security Policy

## Reporting a Vulnerability

We take the security of Cortege seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please report security vulnerabilities via GitHub's [private vulnerability reporting](https://github.com/YOUR-ORG/cortege-hackathon/security/advisories/new).

### What to Include

When reporting a vulnerability, please include:

1. **Description** - Clear description of the vulnerability
2. **Impact** - Potential impact and severity assessment
3. **Steps to Reproduce** - Detailed steps to reproduce the issue
4. **Proof of Concept** - Code or screenshots demonstrating the issue
5. **Suggested Fix** - If you have recommendations for fixing the issue

### Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Within 7 days
- **Fix Timeline:** Depends on severity

---

## Security Best Practices for Contributors

### Before Committing Code

1. **Run Security Scan**
   ```bash
   python3 .kiro/skills/git-workflow-automation/scripts/scan_for_secrets.py
   ```

2. **Check for Vulnerabilities**
   ```bash
   python3 .kiro/skills/git-workflow-automation/scripts/audit_repository_security.py
   ```

3. **Never Commit Secrets**
   - No API keys, passwords, tokens
   - Use environment variables (`.env` file)
   - Real `.env` is gitignored, `.env.example` shows structure

### Code Security Guidelines

#### ✅ DO

- Use parameterized queries (prevent SQL injection)
- Validate and sanitize all inputs
- Use HTTPS for all external communications
- Keep dependencies up to date
- Enable MFA/2FA on your GitHub account

#### ❌ DON'T

- Hardcode secrets or credentials
- Use `eval()` or similar dangerous functions
- Trust user input without validation
- Commit `.env` files with real secrets
- Use deprecated or unmaintained dependencies

---

## Security Checklist for PRs

Before submitting a pull request, verify:

- [ ] No secrets or credentials in code
- [ ] All inputs are validated
- [ ] Dependencies are up to date
- [ ] Security tests pass
- [ ] Pre-commit hooks pass

---

**Last Updated:** March 2026
