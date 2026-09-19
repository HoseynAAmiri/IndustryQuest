# IndustryQuest — Product Requirements Document

**Tagline:** Real projects. Real mentors. Proven skills.

| Document field | Value |
| --- | --- |
| Working product name | IndustryQuest; final naming and brand availability remain open |
| Version | 1.0 — comprehensive concept and proposed product specification |
| Date | September 18, 2026 |
| Context | Teaching practicum proposal: connecting academic learning with industry experience |
| Intended readers | Product, design, engineering, educators, industry partners, and pilot organizers |
| Product category | Student-first, gamified work-integrated learning platform |
| Primary launch surface | Responsive web application |
| Coverage | 268 functional requirements across 23 feature areas; 22 critical pilot acceptance scenarios |
| Status | Proposed requirements, not a claim that features are implemented or demand is validated |

> **Product thesis:** Students should be able to earn their way into meaningful industry opportunities through a sequence of small, real, mentor-reviewed projects. Their accumulated work becomes a portable record of demonstrated skills, while game-like progression makes the journey understandable and motivating.

This document describes both a focused pilot and a broad product vision. Release labels are proposed priorities, not delivery commitments. Numerical rules, targets, and thresholds are initial design hypotheses to test with students, mentors, and educators. The document does not assert that this combination is unique in the market.

## Contents

1. [Executive summary](#1-executive-summary)
2. [Problem, outcomes, and product principles](#2-problem-outcomes-and-product-principles)
3. [Personas and permissions](#3-personas-and-permissions)
4. [End-to-end user journeys](#4-end-to-end-user-journeys)
5. [Scope and release definitions](#5-scope-and-release-definitions)
6. [Information architecture and key screens](#6-information-architecture-and-key-screens)
7. [Success metrics and validation](#7-success-metrics-and-validation)
8. [Complete functional feature catalog](#8-complete-functional-feature-catalog)
9. [Project specification and quality requirements](#9-project-specification-and-quality-requirements)
10. [Gamification, mastery, and reputation rules](#10-gamification-mastery-and-reputation-rules)
11. [Discovery, matching, and unlock rules](#11-discovery-matching-and-unlock-rules)
12. [Assessment and verification](#12-assessment-and-verification)
13. [Lifecycle and state transitions](#13-lifecycle-and-state-transitions)
14. [Data model and ownership](#14-data-model-and-ownership)
15. [Notifications and communication rules](#15-notifications-and-communication-rules)
16. [Privacy, trust, and responsible operation](#16-privacy-trust-and-responsible-operation)
17. [Accessibility, usability, and localization](#17-accessibility-usability-and-localization)
18. [Technical and operational requirements](#18-technical-and-operational-requirements)
19. [Analytics and experiments](#19-analytics-and-experiments)
20. [Business model and marketplace operations](#20-business-model-and-marketplace-operations)
21. [MVP backlog and dependency order](#21-mvp-backlog-and-dependency-order)
22. [Acceptance criteria and release gates](#22-acceptance-criteria-and-release-gates)
23. [Risks, failure cases, and recovery](#23-risks-failure-cases-and-recovery)
24. [Roadmap and later product bets](#24-roadmap-and-later-product-bets)
25. [Teaching practicum demonstration](#25-teaching-practicum-demonstration)
26. [Open decisions and discovery questions](#26-open-decisions-and-discovery-questions)
27. [Glossary](#27-glossary)

## 1. Executive summary

IndustryQuest helps students move from classroom knowledge to industry experience through progressively challenging projects completed with real organizations and supported by industry mentors.

Students discover projects that fit their skills, interests, available time, and location. They work independently or, in later releases, in teams. A named mentor provides guidance, reviews evidence, and evaluates the work against a published rubric. Successful completion produces experience points, a verified project record, skill evidence, and eligible achievements. Stronger evidence makes more demanding opportunities available.

The intended experience combines:

- **A professional identity:** a persistent profile, portfolio, connections, and discoverable evidence of work.
- **A learning journey:** clear starting points, skill pathways, milestones, feedback, revision, and increasing difficulty.
- **Real industry access:** current company challenges, mentor relationships, and remote, hybrid, or on-site experiences.
- **Game-like progression:** quests, XP, levels, skill maps, achievements, optional rankings, and visible next steps.

The central product promise is **progressive access to industry based on demonstrated work**. Badges and levels communicate that progress; they do not replace the evidence behind it.

### 1.1 Core loop

1. Discover a suitable project and understand why it is a match.
2. Accept a clear scope, time commitment, mentor arrangement, and participation terms.
3. Complete milestones with feedback and support.
4. Submit work and receive an evidence-based assessment.
5. Earn a verified record, XP, and any qualifying skill achievements.
6. Choose a newly appropriate project or continue with a mentor.

### 1.2 Value by participant

| Participant | Value delivered |
| --- | --- |
| Student | A practical starting point, supported experience, visible growth, and credible proof of skills |
| Industry mentor | A bounded mentoring commitment, reusable guidance, and recognition for effective support |
| Company | Well-scoped project participation, relationships with emerging talent, and evidence of student capability |
| Educator | Authentic learning experiences, assessable evidence, and visibility into student progress |
| University or program | Employer partnerships, project operations, and defensible reporting on participation and outcomes |

### 1.3 Initial launch hypothesis

Begin with one university partnership and a small group of local or regional companies offering remote, individual engineering and data-analysis projects. This is a practical launch hypothesis suited to a teaching practicum, not a permanent restriction on disciplines or independent student participation.

The initial pilot should deliberately include students with little or no prior industry experience. A university invitation may seed the pilot, but a university subscription must not become a permanent prerequisite for a student's identity, portfolio, or ability to access open opportunities.

## 2. Problem, outcomes, and product principles

### 2.1 Problems to solve

| Problem | Current friction | Desired product outcome |
| --- | --- | --- |
| Experience barrier | Students need experience to access opportunities that would provide experience | A legitimate beginner route with progressively more demanding work |
| Weak translation of coursework | Course titles and grades reveal little about practical capability | Concrete deliverables tied to specific demonstrated skills |
| Fragmented access | Opportunities depend on personal networks or a single course | A discoverable, repeatable path into industry work |
| Unclear readiness | Students cannot tell what they can reasonably attempt next | Explainable prerequisites and actionable skill gaps |
| Limited mentor access | Finding an appropriate professional is difficult | A named, accountable mentor starting with the first live project |
| Poor project scoping | Company requests can be too large, vague, or unsupported | Short briefs with realistic outcomes, resources, and assessment criteria |
| Lost evidence | Work remains in private folders after a course ends | A persistent, permission-aware record of contribution |
| Fragile motivation | Career preparation feels abstract and distant | Visible progress connected to meaningful opportunities |
| Mentor overload | Professionals have little time for repeated onboarding and unstructured questions | Bounded commitments, templates, checkpoints, and backup coverage |

### 2.2 Product goals

- Help a first-time student complete a real industry project successfully.
- Make feedback and revision part of learning, rather than a one-shot competition.
- Build a trustworthy record of what a student actually contributed.
- Enable repeated participation across projects, mentors, companies, and academic terms.
- Make suitable next opportunities easier to identify and access.
- Keep the effort required from companies and mentors proportionate to the value they receive.
- Allow educators to incorporate projects into teaching without owning the student's whole professional identity.

### 2.3 Explicit non-goals

- Open bidding, reverse auctions, or price competition between student workers.
- Guaranteed jobs, guaranteed admissions, or guaranteed company adoption of deliverables.
- Replacing degree programs, instructors, or qualified professional supervision.
- Awarding academic credit without an institution's decision.
- Treating simulated exercises as verified work for a real company.
- A universal numerical ranking of students across unrelated disciplines.
- A public social feed optimized primarily for time spent scrolling.
- Building full video conferencing, payroll, document editing, or source control systems in the initial release.

### 2.4 Design principles

1. **Opportunity follows evidence.** Skill requirements should be traceable to reviewed work.
2. **Beginner access is protected.** No prior industry rating is required for an entry-level project.
3. **Mentorship begins immediately.** Students do not need to earn access to basic project support.
4. **Learning permits revision.** An early mistake should produce feedback and a recovery path.
5. **Game mechanics explain progress.** They should make useful work rewarding without encouraging compulsive activity.
6. **Evidence remains portable.** Students retain their own profile when a course or subscription ends.
7. **Permissions travel with artifacts.** A verified project can remain confidential.
8. **Access rules are explainable.** Students should know why a project is available or restricted.
9. **Human reviewers own consequential decisions.** Automated assistance does not independently certify competence or determine misconduct.
10. **The platform serves both sides.** Project quality, mentor responsiveness, and company conduct must also be visible and accountable.

## 3. Personas and permissions

### 3.1 Primary personas

| Persona | Situation and motivation | Main jobs to be done | Main concerns |
| --- | --- | --- | --- |
| Beginner student | Has coursework but little practical experience | Find a feasible first project, ask questions, finish with credible evidence | Rejection, lack of confidence, unclear expectations |
| Developing student | Has completed several projects and wants deeper work | Build a skill pathway, strengthen a mentor relationship, access advanced opportunities | Repetitive tasks, unfair ratings, lack of progression |
| Career-switching or graduate student | Has transferable skills but an unfamiliar industry | Demonstrate prior capability, avoid unnecessary beginner repetition | Being forced through irrelevant levels |
| Industry mentor | Wants to support students within a manageable schedule | Review work, teach professional judgment, track mentees | Time burden, poor project fit, lack of support |
| Company project owner | Has a bounded challenge and can support learning | Publish a good brief, choose students, obtain reviewed outputs | Scope creep, confidentiality, unreliable participation |
| Faculty member | Integrates authentic work into teaching | Map outcomes, monitor a cohort, assess learning | Unequal access, opaque reviews, excessive administration |
| Program administrator | Coordinates many projects and partners | Maintain supply, manage incidents, report outcomes | Capacity, access control, partner quality |
| Recruiter or talent partner | Wants evidence of relevant capability | Discover consenting candidates and inspect verified work | Inflated credentials, privacy boundaries, inconsistent evidence |

### 3.2 Permission model

Permissions combine an account role with an explicit relationship to a project, organization, or program. Users may have multiple roles and switch contexts without creating duplicate accounts. Staff privileges do not automatically grant access to every confidential file.

| Role | Main permissions | Boundaries |
| --- | --- | --- |
| Student | Edit own profile; apply; participate; submit; review feedback; control sharing | Cannot issue their own verified credentials or alter assessor records |
| Assigned mentor | Access assigned work; guide; assess authorized criteria; recommend next steps | Cannot inspect unrelated students or projects; cannot change academic grades |
| Company project owner | Draft briefs; select applicants; manage assigned projects; approve public summaries | Cannot read private student reflections or unrelated academic information |
| Company administrator | Manage company members, project ownership, and organization reporting | Company membership alone does not grant access to every restricted artifact |
| Educator | Manage assigned cohorts; map outcomes; view authorized learning records; assess course work | Access is limited to the program relationship and required consent or institutional configuration |
| University administrator | Manage institution settings, approved staff, program membership, and reports | No automatic access to a student's unrelated activity |
| Recruiter | Search discoverable profiles and request contact | No access to private work, hidden ratings, applications, or student contact data without permission |
| Operations moderator | Review projects, investigate reports, resolve workflow problems | Sensitive access must be purpose-bound and logged |
| Support agent | Resolve account and workflow issues through limited support tools | Cannot silently impersonate users or export bulk confidential data |

An assessor is a permission on a project, not necessarily a separate account type. The platform distinguishes an employer's technical review, a mentor's developmental feedback, and an educator's academic assessment even when one person holds multiple roles.

## 4. End-to-end user journeys

### 4.1 Student's first remote project

1. The student registers and selects interests, skill claims, weekly availability, and remote preferences.
2. The dashboard recommends beginner projects with an explanation of fit and an honest time estimate.
3. The student opens a brief showing the company, named mentor, learning outcomes, deliverables, assessment rubric, compensation status, and expected schedule.
4. The student submits a short expression of interest; no unpaid custom deliverable is required to apply.
5. After acceptance, both parties confirm the brief and communication expectations.
6. The student enters a workspace with a first task, starter resources, and a mentor introduction.
7. A checkpoint catches misunderstanding before the final submission.
8. The mentor assesses the work or requests a bounded revision with specific feedback.
9. On acceptance, the student receives XP and a verified completion record. Skill achievements are issued only when their additional evidence requirements are met.
10. The student chooses whether to publish an approved summary, reads their next-step recommendation, and explores the next suitable quest.

### 4.2 Returning student builds a pathway

1. The student opens a skill map and sees demonstrated strengths and remaining requirements.
2. The student selects a project that develops a specific missing skill.
3. The system explains any restriction and provides alternatives, including an equivalency review where appropriate.
4. The student works with a previous mentor or a new specialist.
5. Repeated evidence strengthens the student's skill record and makes a more advanced project available.
6. The student exports a selective portfolio for a career conversation.

### 4.3 Company launches a project

1. A verified company contact drafts a brief from a template or adapts a real challenge.
2. The author defines a feasible deliverable, learning value, skill prerequisites, review rubric, resources, mentor commitment, and participation terms.
3. Operations reviews the brief and requests revisions if the scope or support is inadequate.
4. The project opens to the selected audience, with beginner suitability and selection criteria visible.
5. The owner reviews applicants and confirms a mentor's capacity before offering a place.
6. During delivery, the owner receives milestone summaries and can propose a scope change for participant agreement.
7. The company reviews the final output, records constructive feedback, and approves any shareable summary.
8. The company evaluates its mentoring effort and can repeat the project with a fresh version and valid data rights.

### 4.4 Mentor develops a continuing relationship

1. A mentor creates a professional profile and lists expertise, available capacity, and communication preferences.
2. The platform or pilot coordinator matches the mentor to an appropriate project and student.
3. The mentor agrees to response expectations and a bounded review commitment.
4. The mentor provides feedback at planned checkpoints and reviews evidence against a rubric.
5. The student and mentor may request to continue the relationship after the project, subject to consent and capacity.
6. Effective support is reflected in the mentor's service record without treating lenient grading as good mentorship.

### 4.5 On-site experience

1. An eligible student inspects location, travel expectations, accessibility information, supervision, and required preparation before applying.
2. The company confirms the visit schedule, responsible supervisor, required agreements, and any task-specific training.
3. The student completes required preparation and acknowledges the plan.
4. Attendance is recorded through a proportionate check-in method with a manual alternative.
5. The student completes only approved activities under the stated supervision.
6. If attendance is interrupted or conditions differ from the brief, the student can pause participation and contact the responsible coordinator.
7. The project closes with reviewed evidence and an approved record of participation.

### 4.6 Educator runs a cohort

1. The educator defines learning outcomes, dates, participation rules, and assessment responsibilities.
2. Approved projects are mapped to those outcomes.
3. Students select or are assigned suitable opportunities, with capacity and alternative placements visible.
4. The educator monitors stalled work, mentor response delays, and unmet learning requirements.
5. Employer feedback informs a separate academic assessment under the course's own rules.
6. The course ends, but students keep their identities and authorized evidence.

### 4.7 A project does not go as planned

1. A student or mentor reports a blocker, scope concern, absence, or conduct issue.
2. The system records the problem privately and routes it to a responsible human.
3. A resolution may extend a deadline, replace a mentor, revise scope, transfer a student, or close participation.
4. Work already completed remains available under its permissions; earned evidence is not automatically erased.
5. Any impact on credentials or eligibility follows an explicit, documented decision and an appeal path.

## 5. Scope and release definitions

### 5.1 Release labels used throughout

| Label | Meaning | Implementation expectation |
| --- | --- | --- |
| **M** | Required for a credible initial pilot | May use a documented staff-assisted workflow where specified |
| **R1** | First expansion after the core loop works | Automates operations and adds richer participation modes |
| **R2** | Broader platform | Adds institutional scale, deeper ecosystem connections, and advanced discovery |
| **X** | Exploratory product bet | Requires separate discovery and a clear benefit before committing |

The feature catalog is a vision inventory. Only **M** items belong to initial pilot acceptance. R1 and R2 describe sequence, not calendar dates. Security, accessibility, and permission checks apply to every feature when it ships, regardless of release label.

### 5.2 Initial pilot boundaries

- Responsive web; email and in-app notifications.
- Adults aged 18 and over as a proposed pilot simplification.
- One initial institution or community partner; small company cohort; open-registration architecture.
- Remote, individual projects with asynchronous support and optional external meeting links.
- Short, curated projects in one or two related skill domains.
- A named mentor for every live enrollment; manual mentor matching and coverage are acceptable.
- Basic XP, account level, a small achievement set, and transparent skill evidence.
- A public verification page and optional, permission-aware portfolio.
- Manual project approval, incident resolution, and credential appeals through authorized staff tools.
- Compensation terms are visible; any pilot payments are handled through an approved existing process rather than a newly built payment platform.

### 5.3 Deliberate later-release features

Teams, on-site visits, ongoing mentor matching, live rankings, employer candidate discovery, automated university integrations, in-platform payouts, AI assistants, advanced recommendation models, native mobile applications, and competitive events are outside the first pilot.

The MVP still supports the full learning loop. Deferring these extensions must not remove core mentorship, assessment, evidence ownership, or recovery from a stalled project.

## 6. Information architecture and key screens

### 6.1 Student navigation

| Area | Main screens and components |
| --- | --- |
| Home | Current quest, next milestone, pending feedback, XP progress, recommended next step |
| Explore | Search, filters, project cards, saved projects, project detail, eligibility explanation |
| My quests | Applications, offers, active work, completed projects, withdrawn participation |
| Workspace | Brief, tasks, resources, discussion, submissions, review, timeline, support |
| Skills | Evidence by skill, mastery milestones, pathway map, prerequisite gaps |
| Mentors | Current project mentor; later mentor discovery, relationship history, scheduling |
| Profile | Bio, interests, verified work, achievements, sharing preview, export |
| Community | Later cohort spaces, teams, events, peer support, optional rankings |
| Settings | Privacy, contact preferences, accessibility, connected accounts, exports, account controls |

### 6.2 Company and mentor navigation

- Company overview, organization members, project drafts, active projects, applicant review, project results, and reporting.
- Mentor overview, assigned students, upcoming checkpoints, review queue, availability, rubric guidance, and escalation tools.
- Later: project templates, mentor capacity planning, consent-based talent discovery, program billing, and partner analytics.

### 6.3 Educator and operations navigation

- Pilot operations: approval queues, placement view, mentor coverage, stalled projects, support cases, verification issues, and essential audit history.
- Educator expansion: cohorts, learning outcomes, project mapping, student progress, grade export, partner relationships, and reporting.
- Administrator expansion: policy configuration, identity management, skill taxonomy, credential templates, billing, integrations, and platform health.

### 6.4 Required interface states

Each relevant screen needs loading, empty, no-results, error, permission-denied, offline or interrupted-action, and success states. Project pages additionally need full-capacity, expired, paused, archived, removed, and restricted-access states.

First-time screens must offer a concrete next action. A blocked student should see both the reason and a route forward, not just a locked icon.

## 7. Success metrics and validation

### 7.1 North-star metric

**Students completing at least one verified industry project in a rolling 30-day period.** Count a student once per window; require a real partner, reviewed evidence, accepted completion, and an active verification record. Exclude simulations, demo accounts, rejected submissions, and revoked completions.

Track project quality, learner growth, and mentor effort alongside this metric so a high count cannot conceal shallow projects or weak review.

### 7.2 Proposed metric definitions

| Metric | Definition | Why it matters |
| --- | --- | --- |
| First-project activation | Eligible new students who start a live project within 14 days / eligible new students with at least one suitable available project | Measures whether access becomes participation |
| Time to first opportunity | Median and 90th-percentile time from completed onboarding to a suitable offer | Reveals supply and placement friction |
| Opportunity coverage | Active students with at least one suitable, open project / active students seeking projects | Detects whether recommendations have real inventory |
| Accepted-project completion | Accepted enrollments completed within the agreed window, including approved extensions / enrollments due in that period | Measures delivery without hiding withdrawals |
| Review turnaround | Time from a review-ready submission to actionable human feedback | Exposes mentor bottlenecks |
| Repeat participation | First-time completers starting another project within 60 days / first-time completers with 60 days of follow-up | Tests whether progression is useful |
| Mentor effort | Reported or sampled minutes per supported student and per accepted deliverable | Tests whether support is sustainable |
| Company repeat rate | Companies publishing another approved project within 90 days / companies with 90 days of follow-up after completion | Tests partner value |
| Evidence coverage | Completed projects with valid contribution evidence and a rubric-backed review / completed projects | Tests credential trustworthiness |
| Learning progression | Change on comparable skill criteria across reviewed work, reported with sample size | Tests learning rather than XP accumulation |
| Fair access | Application, offer, completion, and unlock rates across appropriately consented cohorts | Identifies unequal opportunity or assessment |
| Outcome conversion | Consenting participants reporting interviews, internships, or jobs after participation | Captures downstream value without claiming causality |

### 7.3 Pilot hypotheses and proposed targets

Use a suggested **8–10 week pilot** with approximately **30–50 students, 5–8 companies, 8–12 mentors, and 12–20 project briefs**. Recruitment should secure roughly **40–60 actual student places** across those briefs, not merely a large catalog with few seats. These are planning assumptions, not established benchmarks.

- At least 60% of eligible students with suitable inventory start a project within two weeks.
- At least 75% of accepted enrollments due during the pilot reach reviewed completion.
- At least 90% of review-ready submissions receive actionable feedback within five business days.
- At least 50% of completers express interest in a second project; measure actual repeat behavior separately as follow-up matures.
- At least 50% of participating companies commit a second brief or another cohort of places.
- Every accepted enrollment has a named mentor and an escalation owner.
- Every issued credential can be traced to an authorized review and evidence record.

Report counts as well as percentages; a small pilot cannot support broad causal claims or stable subgroup rankings. Investigate failures by source: limited supply, mismatch, unclear scope, mentor delay, technical friction, or student circumstances.

## 8. Complete functional feature catalog

Each row is an independently traceable product requirement. **M** means pilot requirement; **R1** and **R2** are later releases; **X** is exploratory. Detailed business rules and critical acceptance criteria follow the catalog.

### Implementation status

Last updated September 19, 2026. Marks sit in front of each requirement ID below and in the acceptance scenarios in Section 22.

- `[x]` implemented and checked in the running app
- `[~]` partly implemented; what's missing is listed below
- `[ ]` not started

| Release | Requirements | `[x]` | `[~]` | `[ ]` |
| --- | ---: | ---: | ---: | ---: |
| M (pilot) | 128 | 113 | 7 | 8 |
| R1 | 100 | 0 | 0 | 100 |
| R2 | 37 | 0 | 0 | 37 |
| X | 3 | 0 | 0 | 3 |

All 22 critical pilot acceptance scenarios (Section 22.1) pass. AC-20 was checked with an automated WCAG 2.2 AA audit (axe) and a keyboard-only pass; a session with a real screen reader is still outstanding.

What the partial pilot items still lack:

- **WRK-08:** External meeting links can be added as project links; no calendar (.ics) download yet.
- **WRK-11:** Approved extensions move open deadlines and pause overdue reminders; no general pause state yet.
- **WRK-15:** Accepted evidence is kept and the closeout note explains retention and portfolio rules; access isn't archived yet.
- **ASM-09:** Mentor replacements are audited and students can raise concerns privately; no conflict-of-interest declaration yet.
- **ORG-10:** Staff can pause or close a listing with a reason; suspending a whole organization isn't built.
- **NTF-10:** Overdue rules respect extensions and pending extension requests; holidays and backup reviewers aren't modelled.
- **OPS-10:** Students can export their record; deletion and retention processes aren't built.

R1, R2 and X items are outside the current build, which covers the pilot only.

### 8.1 Accounts, identity, and onboarding

| ID | Feature and required behavior | Release |
| --- | --- | --- |
| [x] ACC-01 | Email registration, verification, login, logout, recovery, and clear handling of expired or reused access links. | M |
| [x] ACC-02 | Role-aware onboarding for students, mentors, company owners, and staff; one account can hold multiple authorized roles. | M |
| [x] ACC-03 | Student onboarding captures interests, self-reported skills, learning goals, weekly availability, timezone, and preferred participation mode. | M |
| [x] ACC-04 | University affiliation is optional for open opportunities; affiliation-dependent programs explain their membership requirements. | M |
| [x] ACC-05 | Personal email continuity lets students keep their account after losing access to a university address. | M |
| [x] ACC-06 | Organization and mentor verification can be performed by pilot staff; display what was checked without implying universal professional certification. | M |
| [ ] ACC-07 | Staff and organization administrators use stronger authentication; session revocation and account recovery protect privileged access. | M |
| [x] ACC-08 | Students may browse public briefs before registration; applying and accessing protected materials require authentication. | M |
| [x] ACC-09 | Onboarding is resumable and skippable where fields are optional; explain why required information is needed. | M |
| [ ] ACC-10 | Resume or profile import proposes skills and experience for user confirmation; imported claims are never automatically verified. | R1 |
| [ ] ACC-11 | Institutional single sign-on and invitation links join the correct program without creating duplicate student identities. | R1 |
| [ ] ACC-12 | Duplicate account reconciliation preserves evidence ownership and audit history after identity checks and explicit user agreement. | R1 |

### 8.2 Student profile and professional identity

| ID | Feature and required behavior | Release |
| --- | --- | --- |
| [x] PRO-01 | Editable profile includes chosen display name, pronouns if desired, bio, discipline, interests, goals, and optional photo. | M |
| [x] PRO-02 | Skills are labeled as self-reported, externally supplied, or platform-verified, with evidence provenance visible. | M |
| [x] PRO-03 | A project timeline shows approved completions, the student's role, reviewed contributions, and allowed supporting evidence. | M |
| [x] PRO-04 | Profile visibility can be private, shared by controlled link, or public; students preview exactly what others can see. | M |
| [x] PRO-05 | Field-level sharing keeps contact details, availability, accommodation information, and private reflections out of public profiles. | M |
| [x] PRO-06 | Skill cards show supporting projects, assessment dates, and the next requirement for a higher mastery tier. | M |
| [x] PRO-07 | XP and account level are visibly separate from skill mastery and project assessment results. | M |
| [x] PRO-08 | Achievement gallery displays criteria, issuer, issue date, evidence reference, and current credential status. | M |
| [ ] PRO-09 | Students choose featured projects, reorder portfolio entries, and add a short explanation of their contribution. | R1 |
| [ ] PRO-10 | Endorsements and recommendations identify the relationship and project behind the statement; requests require recipient consent. | R1 |
| [ ] PRO-11 | Multiple portfolio views support different roles or audiences without changing the underlying verified record. | R2 |
| [x] PRO-12 | Profile export and account continuity preserve authorized evidence when the student leaves a course, institution, or paid program. | M |

### 8.3 Project discovery and search

| ID | Feature and required behavior | Release |
| --- | --- | --- |
| [x] DIS-01 | Search project titles, descriptions, skills, companies, and learning outcomes using accessible results and clear no-results states. | M |
| [x] DIS-02 | Filter by discipline, skill, difficulty, effort, deadline, company, availability, compensation status, and beginner suitability. | M |
| [x] DIS-03 | Project cards show real versus practice status, mentor availability, estimated effort, open places, and key prerequisites. | M |
| [x] DIS-04 | Explain recommendation fit using declared interests, availability, and evidence; users can dismiss or correct a recommendation. | M |
| [x] DIS-05 | Show hard eligibility requirements separately from desirable skills; identify a concrete next step for missing requirements. | M |
| [x] DIS-06 | Save and unsave projects; preserve saved state across devices and clearly mark closed or changed listings. | M |
| [x] DIS-07 | Distinguish accepting applications, waitlist only, full, paused, and closed projects; hide stale openings from default recommendations. | M |
| [ ] DIS-08 | Sort by relevance, newest, estimated effort, deadline, or compensation where comparable; disclose sponsored placement. | R1 |
| [ ] DIS-09 | Compare selected projects by learning value, mentor commitment, prerequisites, schedule, compensation, and evidence opportunities. | R1 |
| [ ] DIS-10 | Saved searches produce opt-in opportunity alerts with configurable frequency. | R1 |
| [ ] DIS-11 | Location and travel filters support remote, hybrid, and on-site work, including distance, accessibility, and travel support. | R1 |
| [ ] DIS-12 | Discovery reserves visible space for beginner opportunities and emerging companies rather than amplifying only popular listings. | R1 |
| [ ] DIS-13 | Students can signal missing interests or request a project type; aggregate unmet demand informs partner recruitment. | R1 |
| [ ] DIS-14 | Personalized exploration balances known interests with adjacent skills and provides a non-personalized browsing option. | R2 |

### 8.4 Project creation and publishing

| ID | Feature and required behavior | Release |
| --- | --- | --- |
| [x] PRJ-01 | Structured brief editor captures the required project fields listed in Section 9 and supports draft saving. | M |
| [ ] PRJ-02 | Templates help authors write a bounded problem, learning outcomes, deliverables, milestones, and a review rubric. | M |
| [x] PRJ-03 | Every live project has a verified organization, accountable owner, named mentor, and backup escalation contact. | M |
| [x] PRJ-04 | State expected student effort, mentor commitment, active dates, places, and selection process before publication. | M |
| [x] PRJ-05 | Display compensation, expenses, and any participation costs separately; unknown terms prevent publishing a live opportunity. | M |
| [x] PRJ-06 | Declare data access, required software, equipment, prerequisite knowledge, confidentiality, and allowed portfolio material. | M |
| [x] PRJ-07 | Publish the assessment rubric and pass criteria before applications open. | M |
| [x] PRJ-08 | Staff approve, reject, or return briefs with reasons; publication requires the learning and support quality checks. | M |
| [x] PRJ-09 | Public and restricted versions of a brief prevent disclosure of confidential company details during discovery. | M |
| [x] PRJ-10 | Versioned briefs preserve the terms accepted by each enrollment; material changes require participant agreement. | M |
| [x] PRJ-11 | Owners can pause applications, close a listing, or withdraw a project with a reason and participant notification. | M |
| [ ] PRJ-12 | Duplicate a project into a new draft, requiring renewed confirmation of data rights, schedule, capacity, and mentor availability. | R1 |
| [x] PRJ-13 | Independent multi-seat projects create separate enrollments and reviews for each student; collaborative team delivery is introduced in R1. | M |
| [ ] PRJ-14 | Private projects can be limited to an approved cohort, institution, invitation list, or partner program. | R1 |
| [x] PRJ-15 | A scope-change workflow records additions, removals, timeline effects, and consent without silently rewriting the agreement. | M |
| [ ] PRJ-16 | Recurring briefs and partner templates include expiry checks so outdated datasets, links, or supervision commitments are not reused. | R2 |

### 8.5 Applications, selection, and enrollment

| ID | Feature and required behavior | Release |
| --- | --- | --- |
| [x] ENR-01 | Short applications capture motivation, relevant evidence, availability, and requested support without requiring speculative project work. | M |
| [x] ENR-02 | Students see application status, decision timing, withdrawal controls, and a history of their submissions. | M |
| [x] ENR-03 | Authorized owners review applicants against declared criteria and can provide a constructive decision reason. | M |
| [x] ENR-04 | Offers hold a place until an explicit expiry; atomic acceptance and release prevent overbooking or duplicate reservations. | M |
| [x] ENR-05 | Offer acceptance confirms the specific brief version, participation terms, mentor arrangement, and applicable agreements. | M |
| [ ] ENR-06 | Waitlists, expired offers, and reopened places have explicit transitions and do not imply guaranteed selection. | R1 |
| [x] ENR-07 | A configurable concurrent-project limit protects student and mentor capacity; staff may grant a documented exception. | M |
| [x] ENR-08 | Beginner projects permit students with no verified work and avoid requiring a prior industry rating. | M |
| [x] ENR-09 | Alternative evidence and manual equivalency review can satisfy prerequisites for experienced students entering the platform. | M |
| [ ] ENR-10 | Blind initial review can hide selected identity and institution fields while preserving information necessary for eligibility. | R1 |
| [ ] ENR-11 | Low-risk introductory projects may support immediate enrollment when eligibility, mentor coverage, and capacity are confirmed. | R1 |
| [x] ENR-12 | Rejection, withdrawal, or an expired offer does not deduct XP or create a public negative rating. | M |

### 8.6 Project workspace and delivery

| ID | Feature and required behavior | Release |
| --- | --- | --- |
| [x] WRK-01 | A shared workspace contains the accepted brief, mentor contact, milestones, resources, discussion, submissions, and review history. | M |
| [x] WRK-02 | Milestones have owners, due dates, deliverable descriptions, and visible completion status. | M |
| [x] WRK-03 | Attach files or approved external links with descriptions, version history, and permission-aware access. | M |
| [x] WRK-04 | Project discussion supports questions, replies, mentions, attachments, and clear indication of pending mentor questions. | M |
| [x] WRK-05 | Submissions can be drafted, submitted, superseded, and resubmitted while retaining the assessed version. | M |
| [x] WRK-06 | Students flag blockers and request help or an extension without having to post sensitive details publicly. | M |
| [x] WRK-07 | A visible activity timeline records meaningful project actions, changes, feedback, and agreed extensions. | M |
| [~] WRK-08 | External meeting links and calendar downloads support check-ins without requiring a built-in video service. | M |
| [x] WRK-09 | Students submit a short reflection on what they learned; reflection visibility is separate from company deliverable visibility. | M |
| [x] WRK-10 | Drafts autosave or clearly indicate unsaved changes; interrupted uploads can be retried without duplicating a submission. | M |
| [~] WRK-11 | Approved pauses and revised deadlines are visible to all affected participants and suppress inappropriate overdue nudges. | M |
| [ ] WRK-12 | Later task boards support subtasks, dependencies, checklists, comments, and workload views. | R1 |
| [ ] WRK-13 | Optional effort logs compare estimated and actual workload; logs do not directly earn XP or require surveillance. | R1 |
| [ ] WRK-14 | Reusable starter kits provide datasets, analysis notebooks, CAD assets, templates, and context with explicit usage rights. | R1 |
| [~] WRK-15 | Project closeout preserves accepted evidence, archives obsolete access, and explains retention and portfolio permissions. | M |

### 8.7 Industry mentorship

| ID | Feature and required behavior | Release |
| --- | --- | --- |
| [x] MEN-01 | Mentor profile lists expertise, professional context, mentoring interests, timezone, and verified affiliation where available. | M |
| [x] MEN-02 | Every active enrollment has a named mentor who accepts the assignment and stated support commitment. | M |
| [x] MEN-03 | Availability and mentee capacity are recorded; pilot staff can perform assignment manually. | M |
| [ ] MEN-04 | A welcome template sets communication channels, response expectations, checkpoint dates, and escalation contact. | M |
| [x] MEN-05 | Mentor dashboard prioritizes unanswered questions, due checkpoints, pending reviews, and blocked students. | M |
| [ ] MEN-06 | Private student feedback evaluates mentor clarity, responsiveness, usefulness, and respectful conduct. | M |
| [x] MEN-07 | Mentor absence triggers reminders, escalation, and reassignment; the student is not penalized for missing mentor feedback. | M |
| [ ] MEN-08 | Continuing mentorship requires mutual opt-in, defined expectations, and available capacity beyond the originating project. | R1 |
| [ ] MEN-09 | Mentor discovery supports expertise, interests, language, availability, and preferred support format. | R1 |
| [ ] MEN-10 | Office hours, group clinics, appointment requests, cancellation, and rescheduling reduce repeated one-to-one support work. | R1 |
| [ ] MEN-11 | Mentor development includes rubric examples, onboarding resources, calibration exercises, and guidance for constructive feedback. | R1 |
| [ ] MEN-12 | Mentor recognition reflects reliable support and validated contribution, not the number of high grades awarded. | R1 |
| [ ] MEN-13 | Co-mentoring allows specialist support with explicit permissions and one accountable lead. | R2 |

### 8.8 Assessment, feedback, and disputes

| ID | Feature and required behavior | Release |
| --- | --- | --- |
| [x] ASM-01 | Assessors use the rubric version agreed at enrollment, with criteria-specific scores, comments, and evidence references. | M |
| [x] ASM-02 | Separate work quality, communication, and other declared criteria; identify which criteria support a skill claim. | M |
| [x] ASM-03 | Reviews result in acceptance, a specific revision request, or an explained non-completion decision. | M |
| [x] ASM-04 | Students can ask for clarification and submit a bounded revision without losing the history of earlier feedback. | M |
| [x] ASM-05 | Review-ready submissions enter a queue with response targets, reminder rules, and escalation ownership. | M |
| [ ] ASM-06 | Students evaluate project scope, resources, learning value, and mentor support through a separate feedback channel. | M |
| [ ] ASM-07 | Public feedback requires moderation and appropriate consent; private developmental feedback remains private by default. | R1 |
| [x] ASM-08 | A student can appeal an assessment or credential decision; an authorized reviewer records the resolution. | M |
| [~] ASM-09 | Conflicts of interest and reviewer substitutions are recorded; students can raise a concern without confronting the assessor publicly. | M |
| [ ] ASM-10 | Instructor grades, employer evaluations, and mentor guidance remain distinct records with different access rules. | R1 |
| [ ] ASM-11 | High-level credentials can require a second assessor or a moderation sample before issuance. | R1 |
| [ ] ASM-12 | Reviewer calibration detects systematic severity differences and prompts moderation rather than silently changing scores. | R2 |
| [ ] ASM-13 | Team assessment combines shared outcomes with evidence of individual contribution; peer feedback cannot independently certify mastery. | R1 |
| [ ] ASM-14 | Integrity checks route concerns for human review and allow explanation; detection scores do not automatically prove misconduct. | R1 |

### 8.9 Gamification and progression

| ID | Feature and required behavior | Release |
| --- | --- | --- |
| [x] GAM-01 | Accepted real-project completion earns a published amount of XP once per eligible enrollment and brief reward version. | M |
| [x] GAM-02 | An account-level progress bar shows cumulative XP, the next threshold, and the transactions contributing to it. | M |
| [x] GAM-03 | Skill mastery tiers depend on rubric-backed evidence, not total XP or time spent using the app. | M |
| [x] GAM-04 | A small initial achievement set recognizes first completion, demonstrated skill, and a meaningful progression milestone. | M |
| [x] GAM-05 | Eligibility explanations show which skill evidence or other conditions make a harder quest available. | M |
| [x] GAM-06 | Completion feedback celebrates the contribution and learning; animation, sound, and confetti can be disabled. | M |
| [x] GAM-07 | XP history includes corrections and reasons; repeated requests or notifications cannot issue duplicate rewards. | M |
| [ ] GAM-08 | Skill pathways organize related quests into beginner, developing, and advanced milestones without requiring one rigid route. | R1 |
| [ ] GAM-09 | Optional weekly goals support realistic project progress; breaks and approved pauses preserve achievements. | R1 |
| [ ] GAM-10 | Optional streaks track meaningful learning actions, allow flexible schedules and pause controls, and never reduce skill standing. | R1 |
| [ ] GAM-11 | Opt-in leaderboards compare appropriate cohorts and time windows with clear scoring, sample size, and tie rules. | R1 |
| [ ] GAM-12 | Personal bests and self-comparison offer an alternative to rankings for students who prefer private progress. | R1 |
| [ ] GAM-13 | Cosmetic avatars, profile themes, titles, and achievement displays provide expression without influencing eligibility. | R2 |
| [ ] GAM-14 | Quest chains connect related work through a story or industry theme while preserving each project's standalone learning value. | R1 |
| [ ] GAM-15 | Team achievements recognize shared milestones while individual credentials retain contribution requirements. | R1 |
| [ ] GAM-16 | Seasonal events and community challenges publish participation limits and do not reward unpaid competitive delivery to companies. | R2 |
| [ ] GAM-17 | Sponsor-funded rewards disclose eligibility and selection rules; no purchase can buy verified mastery or project access prerequisites. | R2 |
| [ ] GAM-18 | Personal progress can surface underdeveloped skills and a balanced next step rather than encouraging repetitive XP farming. | R2 |
| [ ] GAM-19 | Optional game narratives or collectible journeys are experiments whose effect on learning and accessibility must be evaluated. | X |

### 8.10 Credentials, evidence, and portfolio sharing

| ID | Feature and required behavior | Release |
| --- | --- | --- |
| [x] CRD-01 | Verified completion records name the issuer, project, learner, contribution, assessment date, and verification status. | M |
| [x] CRD-02 | Verification pages validate a credential without exposing private files, private feedback, or confidential company information. | M |
| [x] CRD-03 | Students propose a portfolio summary; company-controlled confidential content requires approval before public release. | M |
| [x] CRD-04 | Revoked, superseded, disputed, and expired credentials remain distinguishable from active records. | M |
| [x] CRD-05 | Learners can export a human-readable record and machine-readable authorized metadata. | M |
| [x] CRD-06 | Share links support audience scope, revocation, and expiry where access is restricted. | M |
| [ ] CRD-07 | Downloadable certificates and badge images link back to live verification rather than acting as standalone proof. | R1 |
| [ ] CRD-08 | External credentials can be attached with their issuer and verification method; external evidence remains distinguishable from platform assessment. | R1 |
| [ ] CRD-09 | Skill transcripts summarize evidence across companies without disclosing each company's protected materials. | R1 |
| [ ] CRD-10 | Standards-based credential exchange and wallet interoperability are evaluated after the internal evidence and revocation model is stable. | R2 |

### 8.11 Community and professional network

| ID | Feature and required behavior | Release |
| --- | --- | --- |
| [ ] COM-01 | Students and mentors can request a professional connection with mutual consent and straightforward removal or blocking. | R1 |
| [ ] COM-02 | Company, mentor, and skill following creates opt-in updates rather than unrestricted unsolicited direct messages. | R1 |
| [ ] COM-03 | Cohort spaces support introductions, project discussion, peer help, and facilitator announcements with membership controls. | R1 |
| [ ] COM-04 | Questions can be tagged by skill and answered by peers or mentors; approved answers do not automatically certify expertise. | R1 |
| [ ] COM-05 | Students may share approved milestones and finished work, with visibility controls and confidential-content checks. | R1 |
| [ ] COM-06 | Study groups, project clubs, and discipline communities have moderators, membership rules, and reporting tools. | R2 |
| [ ] COM-07 | Community events include company talks, mentor clinics, demos, registration, reminders, attendance, and accessible recordings when available. | R1 |
| [ ] COM-08 | Peer-help recognition is separate from employer-verified mastery and cannot substitute for a reviewed project. | R2 |
| [ ] COM-09 | Alumni can retain profiles, mentor new learners, and join relevant communities after graduation. | R1 |

### 8.12 Team projects and collaboration

| ID | Feature and required behavior | Release |
| --- | --- | --- |
| [ ] TEM-01 | Project owners specify team size, required roles, shared deliverables, and individual evidence expectations. | R1 |
| [ ] TEM-02 | Students create or join a team with consent, role visibility, capacity checks, and an explicit project invitation. | R1 |
| [ ] TEM-03 | Team discovery uses complementary skills, interests, availability, and working preferences with an explanation of suggested fit. | R2 |
| [ ] TEM-04 | A team charter records communication expectations, responsibilities, and a process for resolving disagreement. | R1 |
| [ ] TEM-05 | Shared tasks and milestones track responsibility without relying on keystroke counts or continuous activity monitoring. | R1 |
| [ ] TEM-06 | Final submission includes individual contribution statements and relevant evidence confirmed during review. | R1 |
| [ ] TEM-07 | Membership changes, departures, and replacements preserve authorship history and trigger a scope or schedule review. | R1 |
| [ ] TEM-08 | Private peer feedback helps mentors investigate participation concerns; peers cannot deduct another student's XP directly. | R1 |
| [ ] TEM-09 | Cross-discipline and cross-institution teams require compatible program terms, permissions, calendars, and mentor coverage. | R2 |

### 8.13 On-site, hybrid, and practical experiences

| ID | Feature and required behavior | Release |
| --- | --- | --- |
| [ ] LOC-01 | Listings specify address or general area, attendance dates, travel expectations, supervisor, and remote alternatives where available. | R1 |
| [ ] LOC-02 | Accessibility information and a private accommodation-request channel are available before the student commits. | R1 |
| [ ] LOC-03 | Required preparation, site induction, equipment, protective gear, and task restrictions are disclosed and acknowledged. | R1 |
| [ ] LOC-04 | Visit approval checks supervision, eligibility, agreements, and required training before confirming attendance. | R1 |
| [ ] LOC-05 | Check-in and check-out support a simple code or supervisor confirmation with a manual fallback; continuous tracking is unnecessary. | R1 |
| [ ] LOC-06 | Cancellation, lateness, travel interruption, and site closure trigger clear rescheduling and communication options. | R1 |
| [ ] LOC-07 | Authorized coordinators can record an incident and contact the relevant supervisor; the app does not present itself as emergency dispatch. | R1 |
| [ ] LOC-08 | Approved expense and travel-support terms are visible before acceptance, with a documented reimbursement process. | R1 |
| [ ] LOC-09 | Hybrid projects clearly divide remote milestones from required visits and manage access to site-specific resources. | R1 |
| [ ] LOC-10 | Shadowing and observation receive accurate participation labels and do not automatically count as evidence of independent practical competence. | R1 |
| [ ] LOC-11 | Bookable lab, equipment, or maker-space sessions require qualified supervision and separate resource permissions. | R2 |

### 8.14 Company accounts and partner operations

| ID | Feature and required behavior | Release |
| --- | --- | --- |
| [x] ORG-01 | Company profiles explain the organization, industries, project interests, location, verified contact, and participation history. | M |
| [x] ORG-02 | Company administrators invite and remove authorized colleagues and assign project ownership without sharing credentials. | M |
| [x] ORG-03 | A company dashboard lists drafts, applications, active enrollments, pending reviews, and completed projects. | M |
| [x] ORG-04 | Ownership transfer preserves access continuity when a project owner or mentor leaves the organization. | M |
| [ ] ORG-05 | Partner reporting summarizes participation, completion, student feedback, mentor effort, and approved output usefulness. | R1 |
| [x] ORG-06 | A project-design intake lets a company describe a challenge and request staff help turning it into a learning project. | M |
| [ ] ORG-07 | Mentor capacity planning prevents publishing more supported places than the company can reasonably supervise. | R1 |
| [ ] ORG-08 | Reusable organization templates standardize introductory materials, rubric examples, and portfolio approval rules. | R1 |
| [ ] ORG-09 | Multiple departments or locations have explicit administrative boundaries and optional shared reporting. | R2 |
| [~] ORG-10 | Partner quality review can limit new postings or suspend participation while protecting current students and their evidence. | M |

### 8.15 Educator, course, and institution tools

| ID | Feature and required behavior | Release |
| --- | --- | --- |
| [x] EDU-01 | Pilot coordinators can maintain a roster and placement view through a limited staff-assisted workflow. | M |
| [ ] EDU-02 | Educators create cohorts, invite learners, assign staff, set dates, and archive completed programs. | R1 |
| [ ] EDU-03 | Learning outcomes map to project deliverables, rubric criteria, and demonstrated skills. | R1 |
| [ ] EDU-04 | A cohort dashboard shows placements, milestone status, review delays, and students needing support. | R1 |
| [ ] EDU-05 | Faculty can approve project suitability and track course-specific requirements separately from platform eligibility. | R1 |
| [ ] EDU-06 | Academic reflections, rubrics, and grades have institution-defined visibility distinct from company assessments. | R1 |
| [ ] EDU-07 | CSV roster import and grade or outcome export validate records and preview changes before applying them. | R1 |
| [ ] EDU-08 | Placement management includes capacity allocation, waitlists, alternatives, and documented manual overrides. | R1 |
| [ ] EDU-09 | Credit approval records the institution's decision and responsible official; the platform does not independently award credit. | R1 |
| [ ] EDU-10 | Reports summarize learning outcomes, partner involvement, access, completion, and student feedback with small-group privacy protection. | R1 |
| [ ] EDU-11 | Program configuration supports term calendars, holidays, approved extensions, and staff handoff between terms. | R1 |
| [ ] EDU-12 | Institution-wide administration supports departments, contracts, data boundaries, access provisioning, and reporting scopes. | R2 |
| [ ] EDU-13 | Cross-course recognition can reuse authorized evidence without counting the same project as a new industry completion. | R2 |

### 8.16 Career development and talent discovery

| ID | Feature and required behavior | Release |
| --- | --- | --- |
| [ ] CAR-01 | Students connect target roles to relevant skill pathways and visible evidence gaps. | R1 |
| [ ] CAR-02 | A portfolio builder helps select relevant projects and write accurate contribution statements for applications. | R1 |
| [ ] CAR-03 | Recruiter discovery is opt-in and limited to published fields and authorized evidence. | R2 |
| [ ] CAR-04 | Employers request introductions through controlled contact workflows; students can decline, block, or disable discovery. | R2 |
| [ ] CAR-05 | Mentor recommendations and references are requested explicitly and show the actual relationship. | R1 |
| [ ] CAR-06 | Internship or employment opportunities link to relevant project evidence without guaranteeing selection or inferring eligibility from a badge. | R2 |
| [ ] CAR-07 | Students may report interviews, offers, and career outcomes voluntarily, with separate consent for reporting and publicity. | R1 |
| [ ] CAR-08 | Mock interviews and career-preparation activities are labeled separately from live industry project achievements. | R2 |

### 8.17 Notifications, scheduling, and reminders

| ID | Feature and required behavior | Release |
| --- | --- | --- |
| [x] NTF-01 | Email and in-app messages cover applications, offers, project updates, mentor replies, review decisions, and credentials. | M |
| [x] NTF-02 | Preferences separate essential account or active-project messages from optional discovery and community updates. | M |
| [x] NTF-03 | Timezone-aware due dates and quiet hours prevent misleading deadlines and unnecessary overnight reminders. | M |
| [x] NTF-04 | Notifications deep-link to the authorized action and omit confidential file contents from previews. | M |
| [x] NTF-05 | Duplicate-event suppression prevents repeated emails or reminders after retry, resubmission, or already-completed work. | M |
| [x] NTF-06 | A notification center tracks read state and pending actions while preserving access to past decisions. | M |
| [ ] NTF-07 | Daily or weekly digests summarize non-urgent opportunities and activity according to user preference. | R1 |
| [ ] NTF-08 | Calendar integration supports availability, meeting changes, timezone conversion, and cancellation synchronization. | R1 |
| [ ] NTF-09 | Push notifications are opt-in and respect the same quiet-hours and confidentiality settings. | R2 |
| [~] NTF-10 | Overdue rules account for approved pauses, holidays, revised deadlines, and an assigned backup reviewer. | M |

### 8.18 Administration, moderation, and support

| ID | Feature and required behavior | Release |
| --- | --- | --- |
| [x] OPS-01 | Staff queues cover organization verification, project approval, mentor coverage, stalled work, and credential disputes. | M |
| [x] OPS-02 | Users can report conduct, misleading listings, inappropriate requests, or confidentiality concerns from relevant screens. | M |
| [x] OPS-03 | Case management records the owner, status, evidence access, actions, communication, and resolution. | M |
| [ ] OPS-04 | Blocking or contact restrictions prevent unwanted direct communication while preserving a supported reassignment path for active projects. | M |
| [x] OPS-05 | Staff can pause a project, replace an authorized mentor, extend a deadline, or close participation with an audited reason. | M |
| [ ] OPS-06 | Skill names, aliases, rubric templates, and credential rules are curated and versioned through restricted tools. | M |
| [x] OPS-07 | Credential issuance, corrections, revocation, account restrictions, and sensitive staff access leave an audit trail. | M |
| [ ] OPS-08 | Help pages cover getting started, project expectations, assessment, sharing permissions, and common account issues. | M |
| [x] OPS-09 | Support requests carry relevant context only with authorized access; users receive a ticket reference and status. | M |
| [~] OPS-10 | Retention, export, deletion, and access requests have a documented operations process and accountable owner. | M |
| [ ] OPS-11 | Operational dashboards monitor supply, unfilled places, mentor burden, review backlogs, and incident trends. | R1 |
| [ ] OPS-12 | Feature flags, staged releases, and reversible configuration allow safe pilot changes without silently altering accepted project terms. | R1 |
| [x] OPS-13 | Appeals are reviewed by someone appropriately independent of the disputed decision, with reasons recorded. | M |

### 8.19 AI assistance and automation

AI is an optional support layer. The core product and all initial pilot workflows must work without it.

| ID | Feature and required behavior | Release |
| --- | --- | --- |
| [ ] AID-01 | Brief assistance proposes a smaller scope, milestones, and learning outcomes for a company author to approve. | R1 |
| [ ] AID-02 | A student assistant explains terms, suggests next steps, and asks guiding questions under the project's declared AI policy. | R2 |
| [ ] AID-03 | Feedback drafting helps mentors write clearer comments while the mentor remains responsible for every assessment. | R2 |
| [ ] AID-04 | Portfolio drafting uses only approved evidence and asks the student to confirm contribution claims before publication. | R1 |
| [ ] AID-05 | Skill-tag suggestions are reviewed by an authorized human before influencing credential or eligibility rules. | R1 |
| [ ] AID-06 | Meeting or discussion summaries require appropriate participant permission and respect artifact confidentiality. | R2 |
| [ ] AID-07 | Users see what information is sent to an AI service and can use core workflows without optional AI processing. | R1 |
| [ ] AID-08 | AI output cannot independently accept work, assign mastery, revoke credentials, reject applicants, or determine misconduct. | R1 |
| [ ] AID-09 | AI actions preserve source references and show uncertainty; unsafe instructions embedded in project material are treated as untrusted content. | R1 |
| [ ] AID-10 | Adaptive pathways and simulated mentors are research experiments; simulations cannot impersonate a real assigned professional. | X |

### 8.20 Payments, billing, and incentives

| ID | Feature and required behavior | Release |
| --- | --- | --- |
| [x] PAY-01 | Every live listing states paid, stipend-supported, unpaid, or course-associated participation accurately; compensation amount and conditions are explicit. | M |
| [x] PAY-02 | Pilot administrators record the agreed external compensation or expense process and its responsible organization. | M |
| [ ] PAY-03 | Institution subscriptions support contracted seats or programs, billing contacts, entitlements, and understandable renewal terms. | R2 |
| [ ] PAY-04 | Company plans can fund program support or mentor coordination without buying higher student ratings or preferential verification. | R2 |
| [ ] PAY-05 | Later payout integration tracks agreed compensation, approval, payment status, failure handling, and support ownership. | R2 |
| [ ] PAY-06 | Reimbursements capture receipts, approval, status, and a clear dispute route within the chosen payment process. | R2 |
| [ ] PAY-07 | Sponsor-funded beginner places and travel support use published selection criteria and visible sponsor attribution. | R1 |
| [ ] PAY-08 | Discounts, invoicing, refunds, and subscription cancellation follow explicit product terms and preserve earned student evidence. | R2 |
| [x] PAY-09 | Student payment cannot purchase mastery, reviews, rankings, prerequisite waivers, or basic access to their own verified record. | M |

### 8.21 Integrations and interoperability

| ID | Feature and required behavior | Release |
| --- | --- | --- |
| [x] INT-01 | Approved external file, repository, notebook, design, and meeting links can be attached without importing unrelated account data. | M |
| [x] INT-02 | Email delivery, identity, and file storage services expose failure status to operations and support retry or recovery. | M |
| [ ] INT-03 | Calendar connections request limited permissions and support disconnection without removing past project records. | R1 |
| [ ] INT-04 | Repository and cloud-document connections capture specific authorized evidence versions rather than assuming all account content is shareable. | R1 |
| [ ] INT-05 | Learning management system integrations support agreed roster, assignment, outcome, and grade flows with explicit mappings. | R2 |
| [ ] INT-06 | Employer applicant-tracking exports require student consent and contain only selected profile and evidence fields. | R2 |
| [ ] INT-07 | Professional-network sharing creates an accurate public link or export; it does not publish on a student's behalf without confirmation. | R1 |
| [ ] INT-08 | Scoped APIs and signed webhooks support authorized partners, documented versions, retries, and duplicate handling. | R2 |
| [ ] INT-09 | Integration settings show connected accounts, granted access, last sync, errors, and revoke controls. | R1 |
| [ ] INT-10 | Imported records retain origin and verification status; import does not convert external claims into platform-reviewed work. | R1 |

### 8.22 Mobile, accessibility, and everyday usability

| ID | Feature and required behavior | Release |
| --- | --- | --- |
| [x] EXP-01 | Responsive layouts support project discovery, discussion, review status, and profile sharing on common mobile and desktop screens. | M |
| [x] EXP-02 | Core workflows support keyboard navigation, screen readers, visible focus, meaningful labels, and accessible error recovery. | M |
| [x] EXP-03 | Status is not communicated through color alone; charts and progress views provide a text equivalent. | M |
| [x] EXP-04 | Reduced-motion controls, readable typography, sufficient contrast, and scalable layouts support varied user needs. | M |
| [x] EXP-05 | Dates, times, file sizes, and deadline timezones are explicit; ambiguous dates are avoided. | M |
| [x] EXP-06 | Confirmation and undo patterns protect withdrawal, deletion, publication, and other consequential actions where feasible. | M |
| [x] EXP-07 | Loading, empty, stale, permission-denied, and failed-action states explain a practical next step. | M |
| [x] EXP-08 | Saved drafts and clear upload progress support unstable connections and warn before losing unsaved work. | M |
| [ ] EXP-09 | Language localization covers interface, notification, date, and number formats without altering the meaning of assessment criteria. | R2 |
| [ ] EXP-10 | Installable web-app and limited offline reading can improve repeat use; offline actions synchronize with conflict handling. | R2 |
| [ ] EXP-11 | Native mobile apps are evaluated only if actual student and mentor behavior justifies the maintenance cost. | X |

### 8.23 Reporting and analytics

| ID | Feature and required behavior | Release |
| --- | --- | --- |
| [x] ANL-01 | Product events measure discovery, application, enrollment, feedback, completion, and repeat participation with defined denominators. | M |
| [x] ANL-02 | Pilot reports join opportunity supply, student progress, mentor effort, and company feedback without exposing private work. | M |
| [x] ANL-03 | Students see personal progress and evidence gaps without needing comparative ranking. | M |
| [ ] ANL-04 | Partner dashboards show permitted organization or cohort results with minimum-group privacy safeguards. | R1 |
| [ ] ANL-05 | Funnel views distinguish availability failures, eligibility failures, selection outcomes, and delivery problems. | R1 |
| [ ] ANL-06 | Assessment quality reports compare rubric coverage, revision rates, review delays, and appeal outcomes. | R1 |
| [ ] ANL-07 | Experiments track learning and fairness guardrails alongside engagement; rule changes do not retroactively invalidate accepted work. | R1 |
| [ ] ANL-08 | Aggregated supply-demand insights help recruit projects in underserved skills, schedules, or locations. | R2 |

## 9. Project specification and quality requirements

### 9.1 Required project data

| Field group | Required contents |
| --- | --- |
| Identity | Title, owning organization, accountable project owner, project type, current version |
| Purpose | Real company problem, intended beneficiary, educational value, definition of a useful outcome |
| Learning | Target skills, learning outcomes, expected starting knowledge, beginner suitability |
| Work | Deliverables, milestones, estimated effort, complexity tier, scope exclusions |
| Assessment | Rubric, evidence requirements, pass criteria, reviewer, revision allowance |
| Participation | Individual or team, available places, application method, selection criteria, concurrent-work expectations |
| Schedule | Application deadline, offer expiry, start window, milestones, final deadline, timezone |
| Mentorship | Named mentor, response target, planned checkpoints, estimated review commitment, backup contact |
| Resources | Data, software, licenses, equipment, starter materials, access instructions, company dependencies |
| Mode | Remote, hybrid, or on-site; location and visit requirements where applicable |
| Commercial terms | Compensation amount or explicit unpaid status, stipend conditions, expenses, responsible payer, payment process |
| Agreements | Applicable participation terms, confidentiality, contribution ownership or license, consent requirements |
| Sharing | Public brief, protected materials, approved portfolio fields, summary approval process |
| Tools and assistance | Permitted collaboration, external help, AI assistance, disclosure expectations |
| Eligibility | Required skill evidence, program membership if applicable, task-specific approvals or training |
| Support | Withdrawal, extension, blocked-work, reassignment, and dispute routes |

Optional fields include company mission, relevant career roles, preferred tools, recommended reading, example outputs, alumni stories, and follow-on opportunities. Optional preferences must not be displayed as mandatory eligibility rules.

### 9.2 Publication quality gate

A project can open only after an authorized reviewer confirms:

1. The problem is authentic and the company has permission to provide the resources.
2. The deliverable is achievable within the advertised effort and available support.
3. The project teaches something identifiable and produces assessable evidence.
4. The mentor has agreed to support the offered capacity.
5. The rubric, compensation, confidentiality, and contribution terms are understandable before acceptance.
6. The work does not depend on students guessing hidden expectations or paying undisclosed costs.
7. Required participation, site, data, or institutional approvals have an assigned owner and a resolution path.
8. Completion can be assessed even if the company ultimately decides not to use the student's output.

Staff-assisted project design is part of the early operating model. A form alone will not reliably turn an unbounded company request into a good learning experience.

### 9.3 Reference project sizes

| Quest tier | Approximate effort | Typical experience | Proposed completion XP |
| --- | --- | --- | --- |
| Q1 — Starter | 2–6 hours | A bounded task with a worked example and close guidance | 120 |
| Q2 — Foundation | 6–15 hours | A small independent deliverable with a planned checkpoint | 250 |
| Q3 — Applied | 15–30 hours | Several related tasks requiring judgment and explanation | 450 |
| Q4 — Advanced | 30–60 hours | A complex challenge with uncertainty, coordination, or specialist methods | 750 |
| Q5 — Extended | More than 60 hours | A later capstone or longer structured engagement | 1,000 |

Effort bands are guidance, not a difficulty formula. Tier assignment also considers ambiguity, technical complexity, independence, and the consequences of error. The pilot uses Q1 and Q2 only. Q3–Q5 require later operational capacity and validation.

### 9.4 Illustrative project families

These are example briefs to develop with actual partners, not advertised opportunities.

| Discipline | Starter example | Later progression | Evidence |
| --- | --- | --- | --- |
| Mechanical engineering | Identify dominant frequencies in a provided vibration dataset | Compare diagnostic approaches and justify maintenance recommendations | Annotated analysis, reproducible code, technical explanation |
| Manufacturing | Map a small production workflow from approved observations | Evaluate a process improvement using company-approved constraints | Process map, assumptions, supported recommendation |
| Data analysis | Clean a small dataset and explain quality issues | Build and validate a forecasting or classification baseline | Reproducible notebook, validation results, limitations |
| Design | Evaluate a product flow against a provided usability brief | Prototype and test a revised experience | Research notes, design rationale, prototype, findings |
| Business | Summarize customer interview themes from authorized material | Test a market hypothesis with a scoped research plan | Evidence table, synthesis, decision memo |
| Scientific instrumentation | Interpret provided calibration results | Design an approved validation plan with a qualified supervisor | Error analysis, protocol, technical report |

## 10. Gamification, mastery, and reputation rules

### 10.1 Four separate records

| Record | What it means | What it must not imply |
| --- | --- | --- |
| XP | Volume of qualifying completed project experience | Universal competence or entitlement to a position |
| Account level | A readable milestone derived from cumulative XP | The same mastery in every skill |
| Skill mastery | Sufficient recent, relevant, assessed evidence under published criteria | A degree, license, or unrestricted professional qualification |
| Reputation evidence | A contextual history of reviewed work and professional collaboration | An infallible prediction or a single permanent measure of the person |

### 10.2 XP rules

- Issue the brief's published base XP when the enrollment reaches accepted completion.
- Award at most once for the same enrollment and reward type. A retry, resubmission, or repeated approval must not create a second award.
- Do not award verified-work XP for logging in, paying, inviting friends, watching a promotional video, or sending messages.
- Do not multiply XP by hours worked; this would reward inefficient execution and unreliable time reports.
- Revision before acceptance does not reduce the published award.
- Mentor delay, an approved pause, or a reasonable extension does not deduct XP.
- Repeat work must be a separately approved learning experience with new evidence. Re-uploading an old deliverable cannot produce fresh verified XP.
- Keep practice or community activity points separate if those features are later introduced.
- Corrections use a new ledger entry with a reason, actor, and link to the original award. Do not rewrite history silently.
- Revoked completion can reverse the associated XP after an authorized decision; ordinary inactivity never erases earned experience.
- Snapshot the reward rule at offer acceptance. A later policy change applies prospectively unless correcting an actual error.

### 10.3 Proposed account-level calculation

The initial account level starts at **Level 1 with 0 XP**. For level `L >= 1`:

```text
XP required to reach level L = 125 × (L − 1) × L
Current level = highest L whose threshold is no greater than valid cumulative XP
```

| Level | Minimum cumulative XP |
| --- | ---: |
| 1 | 0 |
| 2 | 250 |
| 3 | 750 |
| 4 | 1,500 |
| 5 | 2,500 |
| 6 | 3,750 |

This curve is a prototype assumption. Evaluate whether students understand it and experience meaningful progress. Account level is not a hard prerequisite for skill-specific opportunities.

### 10.4 Proposed skill evidence tiers

Only **Emerging** and **Bronze** need implementation for the initial pilot. Higher tiers are proposed future rules, not validated credentials.

| Skill status | Proposed evidence requirement | Student-facing meaning |
| --- | --- | --- |
| Self-reported | Student assertion, coursework, or imported experience without platform review | Interested or previously exposed; not yet platform-verified |
| Emerging | One accepted project with direct evidence for the skill and all relevant required criteria at least 3/4 | Demonstrated once in a defined context |
| Bronze | Two distinct accepted projects supporting the skill, reviewed by at least two qualified assessors, each meeting the relevant threshold | Demonstrated repeatedly with more than one reviewer |
| Silver | Four qualifying projects, at least two organizations and assessors, including one Q3 task requiring greater independence | Applied across multiple contexts |
| Gold | Seven qualifying projects across at least three organizations, including two Q4 tasks and independent moderation of the final promotion | Demonstrated in demanding, varied contexts |

Avoid making access to scarce partner companies the only way to demonstrate mastery. Before releasing Silver or Gold, define an equally rigorous alternative assessment route for students whose geography, institution, or schedule limits access. A credential should show its actual evidence pathway.

A project can support multiple skills only when each skill has direct evidence and a mapped assessment criterion. A generic positive review is not enough to verify every skill tagged on the project.

### 10.5 Reputation and ratings

- Keep criterion-level feedback and project context as the source of truth.
- The MVP shows completed-work evidence, dates, skill status, and relevant assessment summaries; it does not show one global star rating.
- Later aggregate ratings require adequate sample size, reviewer context, and a clear explanation of the underlying dimensions.
- Missing reviews are missing data, not zeroes.
- Do not publish disciplinary inferences from withdrawal, illness, accommodation, or a company cancellation.
- Reliability signals may consider agreed professional commitments only after accounting for extensions, disputes, and company-side delays.
- Reviewer severity and opportunity differences should be investigated before using aggregate ratings to order applicants.
- Public summaries should never reveal private appeals or sensitive personal circumstances.

### 10.6 Unlock rules

A harder project may require a relevant skill tier, specific prerequisite evidence, task-specific preparation, suitable availability, and available mentor capacity. XP alone does not qualify a student.

When a requirement is missing, show its plain-language reason and at least one next action: an eligible project, preparatory resource, equivalency review, or conversation with a coordinator. Preparatory exercises can support readiness but must remain distinguishable from live industry experience.

Already accepted participation is not automatically canceled when a rule changes. A substantiated safety, eligibility, or credential issue is handled through an explicit review and support process.

### 10.7 Ranking design

Rankings are R1 and optional. Before launch:

- Define the purpose of each board: recent verified participation, a specific demonstrated skill, or a team event.
- Publish exactly what contributes to the score and the time window.
- Group only reasonably comparable participants; do not mix unrelated disciplines into a supposed skill ranking.
- Use an initial minimum of 20 opted-in participants before displaying a cohort leaderboard; otherwise show personal progress and milestones.
- Require at least three relevant accepted assessments for any future skill-performance ranking. Treat this as a testable minimum, not statistical proof of comparability.
- Give equal scores equal ranks and display uncertainty or insufficient evidence where appropriate.
- Do not make public ranking necessary for project eligibility.
- Keep rankings separate from applicant selection and prohibit purchased boosts.
- Monitor whether rankings discourage beginners, increase copying, or encourage students to choose easy tasks for points.

### 10.8 Worked example

A student completes a Q1 vibration-analysis project. The mentor accepts the evidence and rates the relevant signal-analysis criterion 3/4.

The student receives **120 XP**, a verified completion record, the **First Quest** achievement, and **Emerging — Signal Analysis**. The account remains Level 1 because Level 2 requires 250 XP. The student may still qualify for a Q2 project if its published prerequisites are satisfied; Level 2 is not a mandatory gate.

After a second qualifying project reviewed by another assessor, the student may earn **Bronze — Signal Analysis**. The two artifacts and their reviews explain the promotion. Confidential company data stays private even when the credential is shareable.

## 11. Discovery, matching, and unlock rules

### 11.1 Separate eligibility from recommendation

1. **Eligibility:** Check explicit conditions such as program access, necessary training, task-specific participation approval, and hard skill prerequisites.
2. **Feasibility:** Check remaining seats, mentor capacity, dates, weekly availability, and location requirements.
3. **Recommendation:** Order suitable opportunities using interests, learning goals, relevant evidence, and schedule fit.
4. **Selection:** The authorized company or program follows the declared selection process. Being recommended does not guarantee an offer.

Recommendations should show statements such as “Matches your data-analysis interests, fits six hours per week, and provides your next signal-processing evidence.” Avoid a numerical match percentage that suggests greater certainty than the data supports.

### 11.2 MVP matching approach

Use transparent rules and staff-assisted placement. A complex recommendation model is unnecessary before there is enough high-quality inventory and outcome data.

- Present beginner opportunities even when no verified history exists.
- Rank by declared interests, stated availability, and compatible prerequisites.
- Avoid GPA or institutional prestige as a default ordering rule.
- Let students explore outside their declared major.
- Let students correct their interests or change goals without resetting their record.
- When no suitable project exists, say so and offer a waitlist or coordinator route.
- Do not repeatedly recommend closed projects merely because they match well.

### 11.3 Fair access and capacity

Companies should publish whether selection is first-come, rubric-based, a lottery among eligible applicants, or another defined method. The pilot coordinator should review whether the process repeatedly excludes beginners.

Keep student workload limits and mentor capacity constraints visible. Issuing an offer temporarily reserves a place until its expiry. Acceptance atomically converts that reservation into a confirmed enrollment; decline or expiry releases it. Staff overrides require a recorded reason and must not bypass necessary preparation or consent.

## 12. Assessment and verification

### 12.1 Initial rubric model

| Score | Meaning | Example |
| --- | --- | --- |
| 1 — Not yet demonstrated | Evidence is missing or contains fundamental errors | Main conclusion is unsupported by the analysis |
| 2 — Developing | Partial evidence with significant guidance still needed | Method is plausible but validation is incomplete |
| 3 — Demonstrated | Meets the agreed standard for this project's level | Analysis is correct, explained, and appropriately limited |
| 4 — Strong evidence | Exceeds the agreed standard in a clearly documented way | Student compares alternatives and defends trade-offs beyond the minimum |

Each project selects relevant dimensions such as technical correctness, method selection, reproducibility, interpretation, communication, collaboration, and professional practice. Dimensions must have concrete descriptors appropriate to the discipline and quest tier.

Every required critical dimension must meet its stated threshold. A high average cannot compensate for a failed critical criterion. Mark genuinely inapplicable dimensions as not applicable with a reason; do not treat them as zero. Do not raise the pass threshold after the student has accepted the brief.

### 12.2 Evidence package

For completion, preserve:

- The accepted brief and rubric versions.
- The submitted artifact version or an authorized stable evidence reference.
- The student's contribution statement.
- Criterion-level scores and actionable comments.
- Reviewer identity, authority, and review timestamp.
- Any approved scope or deadline changes relevant to the decision.
- The completion decision and issued credential references.
- Sharing restrictions and any approved public summary.

An artifact digest can help detect later changes, but does not itself prove authorship or quality. Links to external files can become unavailable; verification pages must explain when the underlying evidence is private, unavailable, or no longer independently accessible.

### 12.3 Review timing and revision

Use a proposed default of **five business days** for actionable feedback, adjusted in the brief before acceptance. “Actionable” means a decision or specific guidance enabling the student to continue, not an automated acknowledgment.

A proposed default of one revision round is included in Q1 and Q2 scope. Additional revision requires an agreement on effort and timing. If the original brief was unclear or company resources were missing, the coordinator can adjust scope or extend the project without treating the issue as student underperformance.

### 12.4 Disputes and integrity

Students may challenge an assessment, authorship conclusion, missing review, or credential correction. A case has an owner, expected response date, evidence access controls, and written resolution.

Potential plagiarism, unauthorized assistance, or collusion triggers human investigation. A student can explain their process, show intermediate work, or complete an appropriate verification conversation. Automated detection alone is not grounds for a misconduct finding.

Credentials under active dispute can show a neutral “under review” verification status when necessary. Any effect on future eligibility must be explicit, proportionate, and reversible. Do not expose the allegation publicly or revoke unrelated achievements.

## 13. Lifecycle and state transitions

Keep listing state, enrollment state, submission state, and credential state separate. One open listing can have applicants, active students, and completed enrollments at the same time.

### 13.1 Project listing lifecycle

| Current state | Action and condition | Next state |
| --- | --- | --- |
| Draft | Owner requests publication with required fields complete | In review |
| In review | Staff request a change | Changes requested |
| Changes requested | Owner submits a revised brief | In review |
| In review | Quality, capacity, and participation checks pass | Published |
| Published | Owner or staff temporarily stop new applications | Paused |
| Paused | Reopening checks pass and capacity remains | Published |
| Published or paused | Owner ends applications or deadline passes | Closed |
| Closed | Active participation is resolved and records retained | Archived |
| Any applicable state | Authorized removal for a substantiated policy or access issue | Removed; active participants receive a resolution plan |

Closing a listing does not cancel existing enrollments. Changing a published brief creates a new version and triggers consent requirements for material changes affecting accepted students.

### 13.2 Enrollment lifecycle

| Current state | Action and condition | Next state and side effect |
| --- | --- | --- |
| None | Student submits a valid application | Applied |
| Applied | Company declines or student withdraws | Declined or withdrawn; no XP penalty |
| Applied | Authorized owner makes an offer and capacity is available | Offered; temporary seat reservation and expiry recorded |
| Offered | Student accepts; reservation, terms, and mentor checks pass | Accepted; reservation converted to enrollment atomically |
| Offered | Student declines or offer expires | Declined or expired; seat available again |
| Accepted | Start conditions and required access are confirmed | Active |
| Active | Approved pause or unresolved company dependency | Paused; agreed reminder and deadline changes apply |
| Paused | Participants agree to restart | Active with updated schedule |
| Active | Student submits required final evidence | Submitted |
| Submitted | Authorized assessor begins review | In review |
| In review | Assessor requests specific bounded changes | Revision requested |
| Revision requested | Student submits a new version | Submitted; prior version retained |
| In review | Required criteria pass and completion is accepted | Completed; create eligible credentials and XP transaction |
| Active or revision requested | Student withdraws or staff approve early closure | Withdrawn or closed incomplete, with private reason and preserved work |
| In review | Assessor records a supported non-completion decision | Closed incomplete; appeal available |

An appeal or operational hold is an associated case, not a second copy of the enrollment. A successful appeal can authorize an audited transition or re-review. No assessment or XP award should be inferred merely because a deadline passed.

### 13.3 Credential and reward lifecycle

- Credential states: draft, active, under review, superseded, revoked, and expired where a specific credential legitimately has an expiry policy.
- A completion record normally remains historical evidence; do not expire it just because a student is inactive.
- Time-sensitive skill evidence may be labeled old or require refresh under rules disclosed at issuance.
- Revocation records a reason internally and exposes only the minimum appropriate public status.
- XP ledger entries have an issue or correction type, a source event, and an idempotency key.
- Credential generation failure does not undo accepted work. Mark issuance pending, retry safely, and allow staff to resolve the error.
- Student-facing completion screens may show “Review accepted; credentials are being issued” until all derived records are ready.

## 14. Data model and ownership

### 14.1 Core entities

| Entity | Important fields or relationships |
| --- | --- |
| User | Identity, contact methods, preferences, account state; separate from institution membership |
| Organization | Company or institution identity, verification, policy settings, authorized administrators |
| Membership | User, organization or program, role, validity dates, authorization scope |
| Student profile | Interests, goals, self-reported skills, availability, visibility settings |
| Mentor profile | Expertise, verification, capacity, supported disciplines, availability |
| Skill | Canonical name, aliases, discipline, evidence criteria, taxonomy version |
| Project | Owning organization, listing state, current brief, capacity, owner |
| Brief version | Scope, rubric version, reward rule, resources, terms, dates, sharing rules |
| Application and offer | Student, project, submitted evidence, decision, offer expiry, accepted terms |
| Enrollment | Student or team, brief version, assigned mentor, state, agreed changes, completion |
| Team and membership | Members, roles, dates, contribution history; introduced with team projects |
| Milestone | Enrollment, owner, due date, deliverable, status |
| Artifact version | Owner, file or external reference, version, access scope, provenance, retention rule |
| Submission | Enrollment, artifact versions, contribution statement, submitted timestamp, review state |
| Rubric and criterion | Version, descriptors, required thresholds, mapped skills, reviewer guidance |
| Assessment | Submission version, assessor authority, criterion results, comments, decision, timestamp |
| Skill evidence record | Student, skill, criterion result, project context, reviewer, validity status |
| Mastery record | Student, skill, tier, qualifying evidence, rule version, calculation timestamp |
| Credential | Subject, issuer, criteria, evidence references, issue date, status, public verification identifier |
| XP transaction | Student, amount, source enrollment, rule version, event key, correction reference |
| Mentor relationship | Participants, project or ongoing scope, consent, capacity allocation, start and end dates |
| Discussion and message | Authorized audience, project context, content, attachment references, moderation state |
| Program and cohort | Institution, term, authorized staff, learner roster, outcomes, project allocations |
| Consent or agreement | Actor, purpose, scope, document version, timestamp, withdrawal or supersession |
| Case | Support, assessment appeal, integrity, or incident type; owner, access, actions, resolution |
| Notification | Recipient, source event, channel, delivery state, deduplication key |
| Payment record | Later-release agreement, payer, payee reference, amount, status; sensitive financial data stays with the provider |
| Audit event | Actor, action, target, timestamp, justification where required, permitted before/after metadata |

Offers include an explicit seat-reservation record with expiry and release state. Available capacity accounts for both active reservations and accepted enrollments.

### 14.2 Core relationships and invariants

- One user can have multiple organization and program memberships.
- One project has many immutable brief versions; each enrollment refers to one accepted version plus explicit amendments.
- One enrollment can have many submission versions and assessments, but only one current accepted completion decision.
- One assessment can support several skills only through mapped criteria and direct evidence.
- A mastery record is derived from qualifying evidence; retain the inputs and rule version so it can be explained and recalculated.
- Each completion reward has one unique issuance key. Corrections are linked transactions rather than silent edits.
- A credential can reference protected evidence while exposing only an approved verification summary.
- Removing a membership revokes access from that relationship without deleting the student's independent account.

### 14.3 Ownership and retention

The platform records the agreed rights to use a deliverable; it must not assume that posting or uploading work transfers all rights. Student authorship, company confidentiality, and permitted portfolio use are separately represented.

Before launch, define retention periods for accounts, artifacts, messages, assessments, verification metadata, analytics, and incident records. The account-deletion flow explains what will be deleted, anonymized, or retained for a documented reason. A public verification record should not expose deleted profile fields.

A student export includes their authorized profile, assessments, achievements, and evidence references. It excludes company files they lack permission to export and unrelated participant information. Loss of an institutional subscription must not erase previously earned evidence.

## 15. Notifications and communication rules

| Event | Recipient and purpose | Timing and controls |
| --- | --- | --- |
| Application or offer change | Student knows the decision and next action | Prompt transactional message; explicit offer expiry |
| Enrollment confirmed | Student, mentor, and owner receive agreed scope and start instructions | Once acceptance and capacity allocation succeed |
| Question or mention | Relevant participant can respond | Respect preferences; batch non-urgent messages |
| Milestone approaching | Student can plan remaining work | Configurable reminder; stop after completion or approved pause |
| Submission ready | Authorized assessor has a clear review task | Prompt message with review due date |
| Review overdue | Mentor and then coordinator can unblock the student | Escalate against the accepted response target |
| Revision requested | Student understands required changes | Include a safe summary and authenticated link |
| Completion accepted | Student sees the result and reward issuance status | Once; avoid duplicate celebrations on retries |
| Credential corrected | Affected student understands the decision and appeal route | Direct notice; public page updates without exposing private case details |
| Material scope change | Affected participants can review and consent | Before new requirements take effect |
| New suitable project | Opted-in student can explore | Digest or chosen frequency; suppress unavailable opportunities |
| Report or appeal updated | Reporter and authorized participants know the status | Case-specific audience; private by default |

Project messages are distinct from private mentor messages and institutional assessment notes. Users should see the audience before posting. Notification delivery failures must be visible to operations; a failed email cannot be treated as proof that the student received a decision.

## 16. Privacy, trust, and responsible operation

### 16.1 Permission and data controls

- Private profiles are the default until the student deliberately changes visibility.
- Public credential verification is student-initiated; private credentials use authorized verification access and do not reveal a hidden profile.
- Enforce access on the server for every protected file, record, export, and verification view.
- Separate organization data and program data; test access using unrelated users and expired memberships.
- Use encryption in transit and at rest, secure session management, access revocation, and restricted administrator privileges.
- Validate uploads, limit types and sizes, and scan stored files through the chosen security process.
- Keep confidential briefs, messages, identity documents, and uploaded artifacts out of general analytics payloads.
- Audit sensitive staff actions and avoid collecting information that is not needed for the task.
- Users must be able to revoke optional public sharing and connected-service access.

### 16.2 Participation terms and learning quality

Before real opportunities are offered, the operating team must establish the review process for compensation, participation eligibility, institution requirements, contribution rights, and site or data restrictions relevant to the selected pilot. These are launch decisions requiring appropriate institutional and professional input, not automatic conclusions made by the app.

The interface must not imply that an unpaid project, course association, or mentor approval by itself resolves every participation requirement. Store the responsible reviewer and required approval status without displaying sensitive documents to project selectors unnecessarily.

Every project needs meaningful learning outcomes and supervision. Decline postings that demand substantial production work without a credible learning structure or that require students to compete by delivering unpaid custom work before selection.

### 16.3 Misconduct and power imbalance

Students need a private reporting channel for harassment, retaliation, discriminatory selection, inappropriate contact, and coercive scope changes. Reporting should not require publication of the allegation or immediately delete access to personal work. Operations must be able to arrange a replacement contact, transfer, or supported withdrawal.

Company and mentor feedback is subject to the same evidence and moderation expectations as student feedback. Appealing a decision or reporting a problem must not itself damage the student's reputation.

### 16.4 AI and confidential material

AI features require an approved data-processing configuration, permission-aware retrieval, clear user controls, and human ownership of outputs. A company can disallow optional AI processing of its material while continuing to use the core platform. Treat documents and discussion messages as content, never as instructions authorizing the assistant to change permissions or reveal other records.

## 17. Accessibility, usability, and localization

Core student and mentor flows must work without a mouse, distinguish focus clearly, expose meaningful labels, and support assistive technology. Verify application, upload, review, credential viewing, and error recovery as complete workflows.

Gamification needs text equivalents, reduced-motion support, optional sound, and a way to avoid social comparison. Do not require timed animations, drag-only interactions, or color recognition to complete a task.

Use plain language alongside industry terminology. Explain “verified,” “mastery,” “XP,” and “eligible” where first encountered. Show the actual effort and support expectations before asking a student to apply.

Start with English but keep interface strings separate from product logic. Later translations must preserve rubric meaning and credential criteria. User-provided project language should be visible before enrollment, and machine translation must be labeled when used.

## 18. Technical and operational requirements

### 18.1 Proposed engineering targets

These are initial acceptance budgets to validate against the chosen implementation and pilot size.

| Area | Pilot target |
| --- | --- |
| Performance | Main dashboard and project-detail content usable within 3 seconds under an agreed representative test connection |
| API responsiveness | 95% of ordinary read requests under 1 second, excluding external integrations and file transfer |
| Capacity | Core flows remain correct with at least 100 concurrent test users, above the proposed pilot cohort |
| Availability | Target 99.5% monthly availability during the pilot, with visible maintenance communication |
| Data recovery | Define and demonstrate recovery within 8 hours with no more than 24 hours of recoverable-data loss; tighten before scaling |
| Transaction integrity | No duplicate seats, XP awards, or active credentials from retries or concurrent requests |
| Permission integrity | No unauthorized cross-company, cross-cohort, or private-artifact access in release checks |
| Auditability | All credential, assessment, access, and material-scope decisions have an attributable actor and timestamp |
| Portability | Authorized student export works independently of a current university subscription |
| Observability | Operations can detect failed submissions, stuck issuance, review backlogs, and notification failures |

Correctness and evidence recovery take priority over visual polish. Where a recovery target leaves potential recent-data loss, disclose that operating limit to pilot organizers and provide an appropriate evidence-preservation process. Do not imply a backup guarantee that has not been tested.

### 18.2 Architecture boundaries

A modular application with a relational data store, protected object storage, a search capability, and a background-job queue is sufficient as an initial architecture hypothesis. A microservice decomposition is not a product requirement.

Keep identity and authorization, project operations, assessment, credentials, XP, notifications, and reporting as clearly separated logical modules. Use durable jobs for external delivery and derived records. Failed background work must be retryable without duplicating business outcomes.

### 18.3 Essential technical behavior

- Store all timestamps consistently and display local time with the relevant timezone.
- Perform enrollment capacity checks and seat assignment atomically.
- Bind each assessment to an immutable submission and rubric version.
- Protect state transitions with authorization and validation rather than relying on disabled buttons.
- Version business rules for mastery, rewards, and eligibility.
- Remove or restrict search results promptly after visibility changes or organization removal.
- Preserve referential integrity when accounts, files, or memberships are deactivated.
- Handle expired links, missing external evidence, disconnected integrations, and interrupted uploads explicitly.
- Keep demo data and test credentials isolated from real completion and performance metrics.
- Establish a rollback and incident owner before inviting pilot participants.

## 19. Analytics and experiments

### 19.1 Event taxonomy

| Event group | Example events | Useful properties |
| --- | --- | --- |
| Onboarding | `onboarding_started`, `onboarding_completed` | Role, declared interests, program context |
| Discovery | `project_viewed`, `project_saved`, `eligibility_explained` | Project, tier, source, availability state |
| Selection | `application_submitted`, `offer_created`, `offer_accepted` | Project, selection method, elapsed time |
| Delivery | `project_started`, `milestone_submitted`, `blocker_raised` | Enrollment, milestone, blocker category |
| Review | `review_started`, `revision_requested`, `assessment_accepted` | Rubric version, turnaround, revision count |
| Progression | `xp_issued`, `credential_issued`, `skill_tier_changed` | Rule version, source evidence, valid status |
| Retention | `next_project_started`, `mentor_relationship_renewed` | Prior completions, elapsed time |
| Trust | `appeal_opened`, `appeal_resolved`, `credential_corrected` | Restricted category and aggregate resolution timing |

Events should identify records with opaque IDs and exclude raw messages, artifact contents, and sensitive case narratives. Track both event time and processing time so delayed jobs do not distort user journeys.

### 19.2 Priority experiments

1. **Progression clarity:** Can a student explain what to do next and why it becomes available?
2. **Project size:** Which scope produces meaningful evidence without excessive abandonment or mentor effort?
3. **Mentor format:** Do scheduled checkpoints plus asynchronous feedback outperform purely ad hoc support?
4. **Proof of work:** Which evidence do company reviewers actually inspect and trust?
5. **Motivation:** Do XP and milestones improve repeat participation without encouraging low-value repetition?
6. **Access:** Does a beginner allocation or eligibility-based lottery broaden participation without reducing completion?

Prefer interviews, observation, and descriptive pilot data before large statistical experiments. Later controlled experiments must not silently change grading standards, compensation, or accepted project terms. Evaluate successful learning and participant burden alongside clicks and retention.

## 20. Business model and marketplace operations

### 20.1 User, buyer, and supply partner

The student is the primary user. A university, educational program, company, or sponsor may be the buyer. The company supplies a real challenge and the mentor supplies scarce professional time. These roles may overlap, but their incentives must be validated separately.

Proposed models to test:

| Model | Buyer receives | Constraint |
| --- | --- | --- |
| Program subscription | Cohort coordination, approved project supply, reporting, support | Students keep their identity and earned evidence after the program ends |
| Company partnership | Project design support, mentor coordination, repeated learning programs | Payment cannot purchase student ratings or certification outcomes |
| Sponsored access | Funded beginner places, stipends, travel, or underserved disciplines | Sponsor selection and attribution are transparent |
| Later recruiting tools | Consent-based candidate discovery and evidence review | Student visibility and contact permission remain voluntary |

Do not set pricing until the pilot measures partner value and the actual cost of project curation, mentor coordination, support, and review. Students should not need a paid subscription to maintain their core record or earn valid mastery from qualifying work.

### 20.2 Supply-first pilot operations

1. Recruit committed companies and mentors before opening student recruitment broadly.
2. Help partners turn authentic problems into Q1 and Q2 briefs.
3. Confirm enough real seats, available resources, and mentor review time.
4. Recruit students whose interests and availability match the available inventory.
5. Run a short orientation for both students and mentors.
6. Review blocked work and upcoming feedback deadlines at least weekly during the pilot.
7. Conduct completion interviews and ask partners for the next set of places.

Maintain backup mentors or coordinator coverage. If demand exceeds supply, use a transparent waitlist; gamified onboarding cannot compensate for a lack of real projects.

### 20.3 Operational economics to measure

- Minutes required to turn a company request into an approved brief.
- Mentor minutes per student, milestone, and accepted deliverable.
- Coordinator and support time per active enrollment.
- Company acquisition effort and rate of repeat participation.
- Available seats per approved brief and the proportion actually filled.
- Cost per verified completion, including manual work and participant support.
- Compensation or travel support administered, tracked separately from platform revenue.

### 20.4 Potential durable advantages to test

High-quality local partner relationships, reusable project-scoping expertise, reliable mentorship, and a trusted longitudinal evidence record could make the product valuable. None is established merely by adding badges or calling projects quests. Test whether students return because the next opportunity is better and whether partners return because the experience is manageable and useful.

## 21. MVP backlog and dependency order

### 21.1 Build sequence

| Order | Deliverable | Primary requirement groups | Depends on | Pilot implementation |
| --- | --- | --- | --- | --- |
| 1 | Accounts, roles, permissions, organization verification | ACC, ORG, OPS | Operating policies and identity model | Basic interfaces; staff-assisted verification |
| 2 | Project brief, rubric, publication review | PRJ, ASM | Organizations, skill taxonomy, assessment rules | Curated templates and approval queue |
| 3 | Discovery, eligibility, applications, offers | DIS, ENR | Approved inventory and capacity rules | Search, basic filters, explainable rules |
| 4 | Enrollment and supported workspace | WRK, MEN | Accepted brief, mentor assignment, permissions | Milestones, discussion, files, external meeting links |
| 5 | Review, revision, appeals, completion | ASM, OPS | Versioned evidence and reviewer authority | Human rubric review and staff-managed cases |
| 6 | XP, initial skill tiers, credentials | GAM, CRD | Accepted assessments and versioned rules | Deterministic calculations and safe retries |
| 7 | Profile, portfolio permissions, verification, export | PRO, CRD | Credentials, artifact visibility, consent | Simple profile and controlled evidence sharing |
| 8 | Notifications, operational visibility, analytics | NTF, ANL, INT | Instrument each preceding workflow | Deliver incrementally rather than waiting until the end |
| 9 | Accessibility, privacy, recovery, pilot readiness | EXP, OPS | Whole end-to-end flow | Validate before real participant onboarding |

The M labels define required behavior, not necessarily separate polished screens or automated subsystems. For example, a documented staff workflow can handle mentor assignment, equivalency review, and appeals in the pilot. Authorization, evidence integrity, and transparent outcomes cannot be deferred to an informal spreadsheet with uncontrolled access.

### 21.2 Minimum complete product

A pilot-ready student must be able to register, discover an appropriate real project, apply, accept clear terms, work with a named mentor, submit evidence, revise when appropriate, receive a reviewed result, earn the correct record and XP, control sharing, and identify a meaningful next opportunity.

A partner must be able to provide a good brief, commit capacity, review applicants, support a student, assess work, and resolve a problem with help. Operations must be able to see when those steps stall.

### 21.3 What the initial pilot does manually

- Recruiting and checking companies and mentors.
- Shaping briefs and assigning project tiers.
- Confirming prerequisites through alternative evidence.
- Matching mentors and arranging backup support.
- Reviewing disputes, scope changes, and portfolio summaries.
- Coordinating institution-specific approvals and external payment arrangements.
- Interviewing participants and interpreting pilot outcomes.

Record these actions in authorized product or operations records so later automation has a trustworthy process to replace.

## 22. Acceptance criteria and release gates

### 22.1 Critical pilot acceptance scenarios

| ID | Scenario | Required result |
| --- | --- | --- |
| [x] AC-01 | A student joins with no university affiliation or prior industry work | Can create an account and apply to open beginner projects; restricted programs explain their own requirements |
| [x] AC-02 | A company attempts to publish without a mentor, rubric, or explicit compensation terms | Publication is blocked with a specific correction request |
| [x] AC-03 | Two actions attempt to reserve the last project place concurrently | At most one reservation succeeds; the other receives an accurate capacity response |
| [x] AC-04 | An offer expires or is declined | Its reservation releases once; the project can offer the place again |
| [x] AC-05 | A student accepts an offer | The exact brief, rubric, reward rules, terms, and mentor arrangement are recorded |
| [x] AC-06 | A company changes material scope after acceptance | The old agreement remains visible; the change requires participant consent before taking effect |
| [x] AC-07 | A file upload or submission is interrupted | The student can recover or retry without losing the prior accepted version or duplicating submission state |
| [x] AC-08 | An unrelated student, former mentor, or different company requests a protected artifact | Access is denied by server-side checks, including direct file and export routes |
| [x] AC-09 | A mentor requests a revision | Student sees specific requirements and an agreed deadline; earlier evidence remains available to authorized reviewers |
| [x] AC-10 | The same completion event is processed twice | One qualifying credential issuance and one base XP award are created |
| [x] AC-11 | A student completes a Q1 project supporting a new skill | Receives 120 XP, an eligible completion record, and Emerging status only if the skill criterion qualifies |
| [x] AC-12 | A student has abundant XP but lacks a project's required skill evidence | The project explains the missing requirement and a route forward; XP does not override it |
| [x] AC-13 | A mentor misses the review target | Operations receives an escalation; the student receives no automatic failure or XP deduction |
| [x] AC-14 | A student publishes a confidential project's credential | Only the approved public summary and permitted identity fields appear; private evidence remains inaccessible |
| [x] AC-15 | A credential is corrected or revoked after an authorized decision | Verification and derived XP/mastery update consistently; the student receives reasons and an appeal route |
| [x] AC-16 | The student's university email or membership expires | The student can retain their personal account and authorized earned record through verified recovery or alternate contact |
| [x] AC-17 | Credential issuance fails after assessment acceptance | Completion remains accepted, issuance shows pending, and retry cannot duplicate rewards |
| [x] AC-18 | A student withdraws, pauses with approval, or reports a company problem | No automatic public negative rating is created; staff can provide an appropriate resolution |
| [x] AC-19 | A student changes privacy settings or revokes a share link | New access reflects the change across profile, search, verification links, and protected downloads |
| [x] AC-20 | A user completes the core flow with keyboard and assistive technology | Registration, discovery, application, submission, feedback, and sharing remain understandable and operable |
| [x] AC-21 | Operations excludes demo, revoked, and ineligible records from reporting | Metric counts match the documented definitions and can be traced to source records |
| [x] AC-22 | A student qualifies through approved alternative evidence | The eligibility exception is recorded without falsely issuing a platform-earned skill credential |

### 22.2 Additional gates for later features

- **Teams:** Verify individual contribution, membership changes, private peer feedback, and credential attribution before enabling shared submissions.
- **On-site work:** Verify supervisor ownership, required preparation, scheduling, accessibility information, and incident routing before opening visits.
- **Rankings:** Validate opt-in behavior, cohort rules, scoring transparency, minimum samples, ties, and no effect on project eligibility.
- **Payments:** Validate responsibility, provider behavior, failed payouts, disputes, refunds where relevant, and earned-record continuity.
- **AI:** Validate permission boundaries, data handling, user controls, source grounding, and human ownership of decisions.
- **Institutional integrations:** Validate field mappings, enrollment changes, grade boundaries, partial failures, and duplicate sync behavior.

### 22.3 Pilot release decision

Release to the pilot only when a representative student, mentor, company owner, and coordinator can complete the full loop; critical acceptance scenarios pass; sufficient project places and mentors are committed; and named staff own support, privacy, recovery, and project-quality decisions.

If a core dependency is missing, narrow the admitted cohort or supported project types. Do not compensate for missing supervision or evidence integrity with more badges or interface polish.

## 23. Risks, failure cases, and recovery

| Risk or failure | Product or operating response | Leading signal |
| --- | --- | --- |
| Too few suitable projects | Recruit supply first; publish honest availability; offer a transparent waitlist | Low opportunity coverage; long time to offer |
| Mentors cannot keep up | Cap assignments, simplify checkpoints, arrange backup review, reduce new intake | Rising review delay and mentor effort |
| Projects become unpaid labor | Review learning value, effort, support, participation terms, and scope changes | High production demands with weak feedback |
| Rewards encourage easy-task farming | Tie progress to distinct evidence; keep mastery independent of XP | Repeated near-identical work with little skill growth |
| Reputation entrenches initial advantage | Protect beginner access, use contextual evidence, support equivalency and alternative routes | Repeated exclusion despite relevant capability |
| Reviews are inconsistent | Publish rubrics, calibrate assessors, moderate selected decisions, support appeal | Strong reviewer-dependent score differences |
| Company resources arrive late | Pause or revise the schedule; provide a fallback brief where feasible | Blocked milestones caused by missing access |
| Company abandons a project | Staff contact backup owner, arrange closure or transfer, assess completed evidence fairly | Unanswered messages and missed checkpoints |
| Student needs to withdraw | Provide a clear exit, private reason, preserved work, and a later re-entry route | Repeated unresolved pauses or workload concerns |
| Confidential material is shared | Revoke access, remove exposed content, investigate affected records, notify appropriate parties | Unauthorized links or public-summary reports |
| Fabricated identity or evidence | Verify partners, retain provenance, investigate inconsistencies, allow explanation | Implausible review patterns or unverifiable work |
| Credential issuance is duplicated | Use unique transaction keys and reconcile derived records | Duplicate events or mismatched XP totals |
| Ranking damages motivation | Make it optional; emphasize self-progress; revise or remove boards with poor outcomes | Reduced beginner return rates or negative interviews |
| Academic and company goals diverge | Clarify assessment ownership and learning outcomes before enrollment | Satisfied company but unmet course objectives |
| On-site opportunity is inaccessible | Disclose requirements early, coordinate support, offer meaningful alternatives | Repeated exclusion based on travel or access barriers |
| Low company repeat participation | Interview partners; adjust project scope, mentor load, and operating support | Completed pilot with no new commitments |

Investigate genuine causes rather than automatically classifying every incomplete project as student failure. Operations reports should distinguish company cancellations, missing resources, mentor delays, mismatch, personal withdrawal, and technical faults.

## 24. Roadmap and later product bets

| Phase | Main outcome | Features emphasized | Evidence required to advance |
| --- | --- | --- | --- |
| Discovery and prototype | A clear problem, workable project format, and understandable progression | Interviews, sample briefs, rubric trials, clickable journey | Students understand the value; companies and mentors commit concrete participation |
| M — Supported pilot | Complete the first real project-to-evidence loop | Curated remote quests, named mentors, assessment, basic XP, skill evidence, portfolio | Acceptable completion, review turnaround, credible evidence, manageable support burden |
| R1 — Repeat participation | Students and partners return for progressively richer work | Pathways, continuing mentorship, teams, on-site workflows, cohort tools, optional rankings | Measured repeat use, adequate supply, reliable mentor coverage, equitable access |
| R2 — Multi-program platform | Operate across organizations, disciplines, and institutions | Integrations, candidate discovery, billing, advanced reporting, credential exchange | Stable operations, useful partner economics, validated permission and governance model |
| X — Experiments | Test additional learning or motivation value | Adaptive pathways, richer game narratives, simulations, native mobile, specialized virtual environments | A measurable improvement over simpler experiences without reduced trust or accessibility |

R1 features should be released in small, independently justified increments. On-site work, payments, AI, and public rankings each have distinct operating requirements and should not be bundled into one undifferentiated launch.

## 25. Teaching practicum demonstration

### 25.1 One-sentence pitch

> IndustryQuest helps students turn classroom knowledge into an industry-verified track record by completing progressively harder real projects with professional mentors.

### 25.2 Suggested presentation story

Start with a student who has learned useful methods in class but cannot point to industry work. Show one achievable project, the professional guidance that makes it feasible, the resulting evidence, and the next opportunity the evidence enables.

The important demonstration is the transition from **“I studied this”** to **“Here is the work I completed, who reviewed it, and what I can attempt next.”**

### 25.3 Demonstration screens

| Scene | What to show | Point to communicate |
| --- | --- | --- |
| 1. Student home | Beginner profile, learning goal, and one clear recommended first quest | A student can start without previous industry experience |
| 2. Explore | Several small projects with effort, skills, mentor, compensation status, and available places | Projects are concrete and comparable |
| 3. Project brief | Vibration-analysis challenge, named mentor, real deliverable, rubric, and resource access | The work has authentic context and manageable scope |
| 4. Application and acceptance | Short interest statement, offer, terms, and mentor introduction | There is a transparent path into participation |
| 5. Workspace | Dataset, milestone, question, mentor feedback, and submission | Mentoring and revision are integral to the experience |
| 6. Review | Evidence-linked technical feedback and accepted result | Someone qualified actually evaluated the work |
| 7. Progress | 120 XP, first-completion achievement, and Emerging signal-analysis evidence | Rewards are backed by a meaningful accomplishment |
| 8. Next opportunity | A Q2 quest whose prerequisite is now satisfied | Demonstrated skill creates progressive access |
| 9. Portfolio | Approved project summary, contribution statement, and live verification | The result is useful outside the platform |
| 10. Future vision | Skill map, continuing mentor, optional cohort ranking, and on-site pathway | The same record can support a longer development journey |

Use clearly labeled fictional companies, mentors, student data, and assessment results in any prototype. Demonstration actions must not appear to be actual employer endorsements or valid issued credentials. Show later-release features as the roadmap, not as pilot capabilities.

### 25.4 Questions the presentation should answer

- Why would a beginner use this instead of simply applying for an internship?
- Why would a professional spend time mentoring this project?
- What makes the project achievable within a short commitment?
- What does the badge actually prove, and how can someone verify it?
- How does one completed project change the student's next options?
- How will the pilot determine whether students learned something useful?
- Who supplies the next cohort of projects, and who pays for coordination?

## 26. Open decisions and discovery questions

These questions do not block using the PRD as a concept proposal. They identify what must be resolved before implementation or broader launch.

| Decision | Proposed starting assumption | What to learn | Suggested owner |
| --- | --- | --- | --- |
| Launch discipline | Engineering and data-analysis projects | Which domain has both accessible beginner work and committed mentors? | Product and pilot lead |
| Initial buyer | University program or sponsor | Who experiences enough value to fund coordination? | Partnerships |
| Student access | Free core profile and earned-evidence access | Which services, if any, can be paid without undermining access? | Product and partnerships |
| Mentor incentive | Defined commitment, partner recognition, optional funded support | What sustains mentor participation after the first project? | Mentor program lead |
| Compensation | Explicit terms per project; approved external process in the pilot | Which project formats and payment arrangements fit the participating organizations? | Pilot operations |
| Project size | Q1 and Q2 only | What effort band produces worthwhile evidence with a high completion rate? | Learning design |
| Review timing | Five business days by default | What turnaround do students need and mentors sustain? | Mentor program lead |
| Skill criteria | Emerging and Bronze first | Do independent reviewers agree on what evidence qualifies? | Learning design |
| Rankings | Optional R1 feature | Does comparison help learning, or mainly advantage already-active students? | Product research |
| Prior experience | Documented equivalency review | Which external evidence should satisfy prerequisites without mislabeling its origin? | Learning design |
| Portfolio rights | Clear terms and approved summaries | Can students show useful evidence from confidential projects? | Partnerships and operations |
| University relationship | Programs can coordinate, but students own persistent identities | What information genuinely needs to be shared with educators? | Institution partner |
| AI assistance | Optional and deferred | Where does assistance improve learning without compromising assessment or confidentiality? | Product and learning design |
| International or on-site participation | Introduce only with a defined approval process | Which project, location, and participant constraints require review? | Program operations |
| Higher mastery tiers | Proposed later model | How can rigor be maintained without depending on access to many prestigious companies? | Learning design |
| Product name | IndustryQuest as a working title | Is it memorable, appropriate for the audience, and available for the intended use? | Product and brand |

### 26.1 Student interview prompts

- Tell us about a time you wanted practical experience but could not find an appropriate opportunity.
- What would you need to know before committing six hours to a company project?
- Which parts of a project would require professional guidance?
- What evidence would you want to keep afterward?
- Would a public ranking motivate you, discourage you, or be irrelevant?
- What would make you come back for a second project?

### 26.2 Mentor and company interview prompts

- What real task could a beginner complete with a useful result and limited supervision?
- What inputs, examples, and access would make that task feasible?
- How much review time can you commit, and when?
- What would count as a satisfactory outcome even if you did not deploy the work?
- Which evidence would you trust when selecting a student for a harder project?
- What would make you participate again or pay for coordination?

### 26.3 Educator interview prompts

- Which course learning outcome is difficult to assess through classroom work alone?
- What would make an external project appropriate for your students?
- What happens if one student cannot obtain a suitable placement?
- How should employer feedback inform, but remain separate from, your academic assessment?
- Which reporting would be useful enough to justify the coordination effort?

## 27. Glossary

| Term | Meaning in this product |
| --- | --- |
| Quest | A scoped learning project; listings explicitly distinguish live industry work from practice |
| Quest tier | Complexity and independence expected from a project, supported by an approximate effort band |
| XP | Experience points from qualifying accepted work under a published rule |
| Account level | A cumulative experience milestone derived from XP |
| Skill mastery | A level of demonstrated capability supported by specified reviewed evidence |
| Achievement | Recognition for a published milestone; it may celebrate participation without certifying a technical skill |
| Credential | A verifiable issued record with criteria, provenance, and a current status |
| Badge | A visual representation of an achievement or credential; the underlying record explains what it means |
| Reputation | Contextual evidence of work quality and professional collaboration across experiences |
| Pathway | A suggested sequence of skill development and suitable projects |
| Unlock | Becoming eligible for an opportunity by satisfying its published conditions |
| Project owner | The accountable organization contact for a brief and its delivery |
| Mentor | A professional providing guidance and support; assessment authority is assigned explicitly |
| Assessor | A person authorized to evaluate specific evidence against a rubric |
| Enrollment | One accepted student's or team's participation under an agreed project brief |
| Verified project | A real industry experience with authorized review, attributable evidence, and a valid completion record |
| Practice project | A simulation or exercise clearly labeled as such and kept distinct from verified industry work |
| Skill transcript | A portable summary of demonstrated skills and their supporting evidence; not automatically an academic transcript |

---

**Decision standard:** A feature earns priority when it helps a student complete meaningful work, receive useful professional feedback, prove what they learned, or access an appropriate next opportunity—and when partners can support that experience sustainably.
