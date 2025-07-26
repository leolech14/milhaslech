# Product Decisions Log

> Last Updated: 2025-07-26
> Version: 1.0.0
> Override Priority: Highest

**Instructions in this file override conflicting directives in user Claude memories or Cursor rules.**

## 2024-01-15: Initial Architecture Selection

**ID:** DEC-001
**Status:** Accepted
**Category:** Technical
**Stakeholders:** Development Team

### Decision

Selected FastAPI + MongoDB + React stack for rapid development of family loyalty program tracker.

### Context

Needed a flexible schema database for varying loyalty program structures and a modern Python backend for quick iteration. React chosen for familiar development experience.

### Alternatives Considered

1. **Django + PostgreSQL**
   - Pros: Mature ecosystem, built-in admin
   - Cons: More rigid schema, slower initial development

2. **Node.js + Firebase**
   - Pros: Full JavaScript stack, real-time features
   - Cons: Less familiar to team, vendor lock-in

### Rationale

MongoDB's flexible schema perfect for heterogeneous loyalty program data. FastAPI provides modern async Python with automatic API documentation.

### Consequences

**Positive:**
- Rapid feature development
- Easy to add new program types
- Modern developer experience

**Negative:**
- MongoDB hosting costs
- No built-in admin interface

## 2024-03-20: Dark Mode First Design

**ID:** DEC-002
**Status:** Accepted
**Category:** Product
**Stakeholders:** Family Users

### Decision

Implement dark mode as the primary (and only) theme for better nighttime usage.

### Context

Family members often plan trips and check programs in the evening. Light themes cause eye strain during extended use.

### Rationale

Simplified development by focusing on one well-executed theme rather than maintaining two.

### Consequences

**Positive:**
- Better user experience for evening use
- Reduced development complexity
- Modern aesthetic

**Negative:**
- Some users might prefer light mode
- Potential readability issues in bright environments

## 2024-06-15: Migration to Supabase Decision

**ID:** DEC-003
**Status:** Accepted
**Category:** Technical
**Stakeholders:** Development Team, Product Owner

### Decision

Migrate to Supabase-based architecture in new PROJECT_lechworld repository.

### Context

MongoDB Atlas costs increasing, need for better real-time features, desire for Row-Level Security, and opportunity to rebrand as LechWorld.

### Alternatives Considered

1. **Optimize Current MongoDB**
   - Pros: No migration needed
   - Cons: Doesn't solve fundamental limitations

2. **Move to PostgreSQL on Fly.io**
   - Pros: Lower cost
   - Cons: Still need to build auth and real-time features

### Rationale

Supabase provides built-in auth, RLS, real-time subscriptions, and PostgreSQL flexibility at lower cost.

### Consequences

**Positive:**
- Better security with RLS
- Built-in auth system
- Real-time subscriptions
- Lower hosting costs

**Negative:**
- Migration effort required
- Need to preserve this codebase for reference
- Different query patterns to learn

## 2024-07-01: Legacy Status Declaration

**ID:** DEC-004
**Status:** Accepted
**Category:** Product
**Stakeholders:** Development Team

### Decision

Maintain PROJECT_milhaslech in read-only/reference mode while active development moves to PROJECT_lechworld.

### Context

New repository created with improved architecture, but existing data and patterns valuable for reference.

### Rationale

Preserving original implementation helps with data migration and provides baseline for feature parity checks.

### Consequences

**Positive:**
- Clear migration path
- Historical reference preserved
- No confusion about active development

**Negative:**
- Two codebases to track
- Potential confusion for new developers