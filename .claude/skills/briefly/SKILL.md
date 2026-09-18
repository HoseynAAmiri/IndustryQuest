---
name: briefly
description: Answer the user's question in as few words as possible. Use when the user says briefly, /briefly, or asks for a short answer.
disable-model-invocation: true
---

# Briefly

Answer the user's question only with as few words as possible. Be short and concise. You may use an example if it helps to explain your answer.

## Instructions

When this skill is invoked:

1. Answer **only** what was asked — no preamble, no recap, no "great question."
2. **Default length:** 1–3 sentences, or a tight bullet list (max 5 bullets) if the question has multiple parts.
3. **No extras:** no follow-up offers, no caveats unless the question is wrong without them, no links unless essential.
4. **Still be accurate.** Short does not mean vague or wrong. If the premise is mistaken, correct it in one line.
5. **Do not** restate the previous message (that is the `bro` skill). Do not start new work.

## Examples

**User:** "What does section 5 say about stiffness?"  
**Good:** "Not that stiffer cells are protected — it hypothesizes higher contractile tension may push cortices closer to rupture, so stiffer could mean _more_ susceptible. Hypothesis only, from internal blebbing, not your compression assay."

**Bad:** "That's a great question! Section 5 is really interesting because it connects to several themes in your paper. Let me walk you through..."
