# CORTEGE Hackathon — Claude Instructions

## Available Skills

### athena
**Path:** `.claude/skills/athena/SKILL.md`
**Trigger:** ALL work — every feature, bug fix, task, or change regardless of size. Always invoke ATHENA first. No exceptions.

### daisy
**Path:** `.claude/skills/daisy/SKILL.md`
**Trigger:** Any UI/UX work — building screens, components, themes, or converting existing UI in this Vite + React project. Invoke when working with Tailwind CSS, DaisyUI, or any visual component work.

### verification-before-completion
**Path:** `.claude/skills/verification-before-completion/SKILL.md`
**Trigger:** Before claiming any work is complete, fixed, passing, or done. Run verification commands and confirm output before making any success claim. Apply to every session.

### peas
**Path:** `.claude/skills/peas/SKILL.md`
**Trigger:** Specifying or auditing any AI agent task environment in this project — CORTEGE companion agents, guardian agents, or any AI workflow. Use when defining agent behavior, success metrics, or adding PEAS sections to PRD/AGENTS.md.

### skill-creator
**Path:** `.claude/skills/skill-creator/SKILL.md`
**Trigger:** Creating or updating a project-specific skill — building a new SKILL.md, modifying an existing skill, or packaging a workflow for reuse during the hackathon.

## Superpowers Skills

All superpowers skills are copied to `.claude/skills/superpowers/` and the plugin is enabled in `.claude/settings.json`. Invoke via the Skill tool as `superpowers:<name>`.

### superpowers:using-superpowers
**Path:** `.claude/skills/superpowers/using-superpowers/SKILL.md`
**Trigger:** Start of every conversation — establishes how to find and use skills.

### superpowers:brainstorming
**Path:** `.claude/skills/superpowers/brainstorming/SKILL.md`
**Trigger:** Before any creative work — creating features, building components, adding functionality, or modifying behavior. Use before entering plan mode.

### superpowers:writing-plans
**Path:** `.claude/skills/superpowers/writing-plans/SKILL.md`
**Trigger:** When you have a spec or requirements for a multi-step task, before touching code.

### superpowers:executing-plans
**Path:** `.claude/skills/superpowers/executing-plans/SKILL.md`
**Trigger:** When executing a written implementation plan with review checkpoints.

### superpowers:systematic-debugging
**Path:** `.claude/skills/superpowers/systematic-debugging/SKILL.md`
**Trigger:** Any bug, test failure, or unexpected behavior — before proposing fixes.

### superpowers:test-driven-development
**Path:** `.claude/skills/superpowers/test-driven-development/SKILL.md`
**Trigger:** Implementing any feature or bugfix — before writing implementation code.

### superpowers:dispatching-parallel-agents
**Path:** `.claude/skills/superpowers/dispatching-parallel-agents/SKILL.md`
**Trigger:** When facing 2+ independent tasks that can be parallelized.

### superpowers:subagent-driven-development
**Path:** `.claude/skills/superpowers/subagent-driven-development/SKILL.md`
**Trigger:** Executing implementation plans with independent tasks in the current session.

### superpowers:requesting-code-review
**Path:** `.claude/skills/superpowers/requesting-code-review/SKILL.md`
**Trigger:** After completing tasks, implementing major features, or before merging.

### superpowers:receiving-code-review
**Path:** `.claude/skills/superpowers/receiving-code-review/SKILL.md`
**Trigger:** When receiving code review feedback, before implementing suggestions.

### superpowers:finishing-a-development-branch
**Path:** `.claude/skills/superpowers/finishing-a-development-branch/SKILL.md`
**Trigger:** When implementation is complete and you need to decide how to integrate the work.

### superpowers:using-git-worktrees
**Path:** `.claude/skills/superpowers/using-git-worktrees/SKILL.md`
**Trigger:** Starting feature work that needs isolation, or before executing implementation plans.

### superpowers:verification-before-completion
**Path:** `.claude/skills/superpowers/verification-before-completion/SKILL.md`
**Trigger:** Before claiming any work is complete, fixed, or passing.

### superpowers:writing-skills
**Path:** `.claude/skills/superpowers/writing-skills/SKILL.md`
**Trigger:** Creating new skills, editing existing skills, or verifying skills before deployment.
