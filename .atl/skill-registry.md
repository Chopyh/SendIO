# Skill Registry — SendIO

<!-- Auto-generated during sdd-init bootstrap. -->

Last updated: 2026-05-17

## Sources scanned

- .agents\skills
- C:\Users\javie\.config\opencode\skills

## Contract

**Delegator use only.** This registry is an index, not a summary. Any agent that launches subagents reads it to select relevant skills, then passes exact `SKILL.md` paths for the subagent to read before work.

`SKILL.md` remains the source of truth. Do not inject generated summaries or compact rules by default; pass paths so subagents load the full runtime contract and preserve author intent.

## Skills

| Skill | Trigger / description | Scope | Path |
| --- | --- | --- | --- |
| `brainstorming` | You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. | project | `C:\Users\javie\Documents\Repos\SendIO\.agents\skills\brainstorming\SKILL.md` |
| `branch-pr` | Create Gentle AI pull requests with issue-first checks. | user | `C:\Users\javie\.config\opencode\skills\branch-pr\SKILL.md` |
| `chained-pr` | Split oversized changes into chained PR slices. | user | `C:\Users\javie\.config\opencode\skills\chained-pr\SKILL.md` |
| `cognitive-doc-design` | Design docs that reduce cognitive load. | user | `C:\Users\javie\.config\opencode\skills\cognitive-doc-design\SKILL.md` |
| `comment-writer` | Write collaboration comments and replies. | user | `C:\Users\javie\.config\opencode\skills\comment-writer\SKILL.md` |
| `customize-opencode` | Edit opencode configuration, skills, agents, or MCP definitions. | project | `C:\Users\javie\Documents\Repos\SendIO\<built-in>` |
| `go-testing` | Focused Go testing patterns and coverage. | user | `C:\Users\javie\.config\opencode\skills\go-testing\SKILL.md` |
| `issue-creation` | Create structured GitHub issues. | user | `C:\Users\javie\.config\opencode\skills\issue-creation\SKILL.md` |
| `judgment-day` | Blind dual adversarial review workflow. | user | `C:\Users\javie\.config\opencode\skills\judgment-day\SKILL.md` |
| `sdd-apply` | Implement SDD tasks from specs and design. | user | `C:\Users\javie\.config\opencode\skills\sdd-apply\SKILL.md` |
| `sdd-archive` | Archive completed SDD change artifacts. | user | `C:\Users\javie\.config\opencode\skills\sdd-archive\SKILL.md` |
| `sdd-design` | Create technical design for SDD changes. | user | `C:\Users\javie\.config\opencode\skills\sdd-design\SKILL.md` |
| `sdd-explore` | Explore ideas before proposing a change. | user | `C:\Users\javie\.config\opencode\skills\sdd-explore\SKILL.md` |
| `sdd-init` | Initialize SDD context and persistence. | user | `C:\Users\javie\.config\opencode\skills\sdd-init\SKILL.md` |
| `sdd-onboard` | Guided end-to-end SDD workflow walkthrough. | user | `C:\Users\javie\.config\opencode\skills\sdd-onboard\SKILL.md` |
| `sdd-propose` | Produce SDD change proposals. | user | `C:\Users\javie\.config\opencode\skills\sdd-propose\SKILL.md` |
| `sdd-spec` | Write SDD delta specifications. | user | `C:\Users\javie\.config\opencode\skills\sdd-spec\SKILL.md` |
| `sdd-tasks` | Break SDD specs/design into tasks. | user | `C:\Users\javie\.config\opencode\skills\sdd-tasks\SKILL.md` |
| `sdd-verify` | Verify implementation against SDD artifacts. | user | `C:\Users\javie\.config\opencode\skills\sdd-verify\SKILL.md` |
| `skill-creator` | Create new skills with valid frontmatter. | user | `C:\Users\javie\.config\opencode\skills\skill-creator\SKILL.md` |
| `skill-improver` | Audit/refactor existing skills. | user | `C:\Users\javie\.config\opencode\skills\skill-improver\SKILL.md` |
| `skill-registry` | Refresh and index available skills. | user | `C:\Users\javie\.config\opencode\skills\skill-registry\SKILL.md` |
| `work-unit-commits` | Plan reviewable implementation commits. | user | `C:\Users\javie\.config\opencode\skills\work-unit-commits\SKILL.md` |

## Loading protocol

1. Match task context and target files against the `Trigger / description` column.
2. Pass only the matching `Path` values to the subagent under `## Skills to load before work`.
3. Instruct the subagent to read those exact `SKILL.md` files before reading, writing, reviewing, testing, or creating artifacts.
4. If no matching skill exists, proceed without project skill injection and report `skill_resolution: none`.
