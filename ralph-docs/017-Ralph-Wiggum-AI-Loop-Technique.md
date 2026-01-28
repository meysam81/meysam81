[Skip to main content](https://awesomeclaude.ai/ralph-wiggum#main-content)

## RALPH WIGGUMAI LOOP TECHNIQUE

Official Claude Code plugin for iterative, self-referential AI development loops. Ship code overnight with persistent iteration.

## What is Ralph Wiggum?

### "Ralph is a Bash loop"

The Ralph Wiggum technique is an iterative AI development methodology. In its purest form, it's a simple while loop that repeatedly feeds an AI agent a prompt until completion. Named after The Simpsons character, it embodies the philosophy of persistent iteration despite setbacks.

#### Iteration > Perfection

Don't aim for perfect on first try. Let the loop refine the work.

#### Failures Are Data

Deterministically bad means failures are predictable and informative.

#### Operator Skill Matters

Success depends on writing good prompts, not just having a good model.

#### Persistence Wins

Keep trying until success. The loop handles retry logic automatically.

```
while :; do cat PROMPT.md | claude ; done
```

## Quick Start

1

### Install the Plugin

Add Ralph Wiggum plugin from the official Claude plugins marketplace

```
/plugin install ralph-loop@claude-plugins-official
```

2

### Start a Loop

Run your first Ralph loop with a simple task

```
/ralph-loop:ralph-loop "Build a hello world API" --completion-promise "DONE" --max-iterations 10
```

3

### Watch It Work

Claude iterates, the stop hook prevents exit, progress accumulates

```
Claude will:
1. Work on the task
2. Try to exit
3. Stop hook blocks exit
4. Same prompt fed back
5. Repeat until DONE
```

## Commands Reference

`/ralph-loop:ralph-loop "<prompt>"`Start a Ralph loop with the given prompt

`/ralph-loop:cancel-ralph`Cancel the active Ralph loop

`/ralph-loop:help`Explain Ralph Wiggum technique and available commands

### Command Options

`--max-iterations <n>`

Stop after N iterations (recommended safety net)

Default: unlimited

`--completion-promise "<text>"`

Phrase that signals completion (exact match)

e.g., "COMPLETE", "DONE"

## Prompt Writing Best Practices

### The Critical Skill

Success with Ralph depends on writing good prompts, not just having a good model. LLMs are mirrors of operator skill.

### 1\. Clear Completion Criteria

Bad

`Build a todo API and make it good.`

Good

```
Build a REST API for todos.

When complete:
- All CRUD endpoints working
- Input validation in place
- Tests passing (coverage > 80%)
- README with API docs
- Output: <promise>COMPLETE</promise>
```

### 2\. Incremental Goals

Bad

`Create a complete e-commerce platform.`

Good

```
Phase 1: User authentication (JWT, tests)
Phase 2: Product catalog (list/search, tests)
Phase 3: Shopping cart (add/remove, tests)

Output <promise>COMPLETE</promise> when all phases done.
```

### 3\. Self-Correction Pattern

Bad

`Write code for feature X.`

Good

```
Implement feature X following TDD:
1. Write failing tests
2. Implement feature
3. Run tests
4. If any fail, debug and fix
5. Refactor if needed
6. Repeat until all green
7. Output: <promise>COMPLETE</promise>
```

### Escape Hatches

Always use --max-iterations: Prevents infinite loops on impossible tasks

Include stuck handling: Document what to do after N failed iterations

Note: --completion-promise uses exact string matching, rely on --max-iterations as primary safety

## When to Use Ralph

### Good For

- Well-defined tasks with clear success criteria
- Tasks requiring iteration and refinement (e.g., getting tests to pass)
- Greenfield projects where you can walk away
- Tasks with automatic verification (tests, linters)
- Overnight/weekend automated development

### Not Good For

- Tasks requiring human judgment or design decisions
- One-shot operations that need immediate results
- Tasks with unclear or subjective success criteria
- Production debugging (use targeted debugging instead)
- Tasks requiring external approvals or human-in-the-loop

## Real-World Results

6 repos

### Y Combinator Hackathon

Successfully generated 6 repositories overnight at Y Combinator hackathon testing

$297

### $50k Contract Delivered

One contract worth $50k USD was completed, tested, and reviewed for just $297 in API costs

3 months

### CURSED Language

Created an entire programming language called CURSED over 3 months using this approach

## Ready-to-Use Prompt Templates

### Feature Implementation

Build a complete feature with tests

```
/ralph-loop:ralph-loop "Implement [FEATURE_NAME].

Requirements:
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

Success criteria:
- All requirements implemented
- Tests passing with >80% coverage
- No linter errors
- Documentation updated

Output <promise>COMPLETE</promise> when done." --max-iterations 30 --completion-promise "COMPLETE"
```

### TDD Development

Test-driven development loop

```
/ralph-loop:ralph-loop "Implement [FEATURE] using TDD.

Process:
1. Write failing test for next requirement
2. Implement minimal code to pass
3. Run tests
4. If failing, fix and retry
5. Refactor if needed
6. Repeat for all requirements

Requirements: [LIST]

Output <promise>DONE</promise> when all tests green." --max-iterations 50 --completion-promise "DONE"
```

### Bug Fixing

Iterative bug resolution

```
/ralph-loop:ralph-loop "Fix bug: [DESCRIPTION]

Steps:
1. Reproduce the bug
2. Identify root cause
3. Implement fix
4. Write regression test
5. Verify fix works
6. Check no new issues introduced

After 15 iterations if not fixed:
- Document blocking issues
- List attempted approaches
- Suggest alternatives

Output <promise>FIXED</promise> when resolved." --max-iterations 20 --completion-promise "FIXED"
```

### Refactoring

Safe code refactoring loop

```
/ralph-loop:ralph-loop "Refactor [COMPONENT] for [GOAL].

Constraints:
- All existing tests must pass
- No behavior changes
- Incremental commits

Checklist:
- [ ] Tests passing before start
- [ ] Apply refactoring step
- [ ] Tests still passing
- [ ] Repeat until done

Output <promise>REFACTORED</promise> when complete." --max-iterations 25 --completion-promise "REFACTORED"
```

## Advanced Patterns

### Combining with Git Worktrees

Run multiple Ralph loops in parallel on different branches

```
# Create isolated worktrees for parallel development
git worktree add ../project-feature1 -b feature/auth
git worktree add ../project-feature2 -b feature/api

# Terminal 1: Auth feature
cd ../project-feature1
/ralph-loop:ralph-loop "Implement authentication..." --max-iterations 30

# Terminal 2: API feature (simultaneously)
cd ../project-feature2
/ralph-loop:ralph-loop "Build REST API..." --max-iterations 30
```

### Multi-Phase Development

Chain multiple Ralph loops for complex projects

```
# Phase 1: Core implementation
/ralph-loop:ralph-loop "Phase 1: Build core data models and database schema.
Output <promise>PHASE1_DONE</promise>" --max-iterations 20

# Phase 2: API layer
/ralph-loop:ralph-loop "Phase 2: Build API endpoints for existing models.
Output <promise>PHASE2_DONE</promise>" --max-iterations 25

# Phase 3: Frontend
/ralph-loop:ralph-loop "Phase 3: Build UI components.
Output <promise>PHASE3_DONE</promise>" --max-iterations 30
```

### Overnight Batch Processing

Queue up work to run while you sleep

```
# Create a batch script
cat << 'EOF' > overnight-work.sh
#!/bin/bash
cd /path/to/project1
claude -p "/ralph-loop:ralph-loop 'Task 1...' --max-iterations 50"

cd /path/to/project2
claude -p "/ralph-loop:ralph-loop 'Task 2...' --max-iterations 50"
EOF

# Run before bed
chmod +x overnight-work.sh
./overnight-work.sh
```

### Prompt Tuning Technique

Start with no guardrails: Let Ralph build the playground first

Add signs when Ralph fails: When Ralph falls off the slide, add a sign saying "SLIDE DOWN, DON'T JUMP"

Iterate on failures: Each failure teaches you what guardrails to add

Eventually get a new Ralph: Once prompts are tuned, the defects disappear

## Related Resources
