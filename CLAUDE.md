# CLAUDE.md - Project Context for Claude Agents

## Agent OS Documentation

### Product Context
- **Mission & Vision:** @.agent-os/product/mission.md
- **Technical Architecture:** @.agent-os/product/tech-stack.md
- **Development Roadmap:** @.agent-os/product/roadmap.md
- **Decision History:** @.agent-os/product/decisions.md

### Development Standards
- **Code Style:** @~/.agent-os/standards/code-style.md
- **Best Practices:** @~/.agent-os/standards/best-practices.md

### Project Management
- **Active Specs:** @.agent-os/specs/
- **Spec Planning:** Use `@~/.agent-os/instructions/create-spec.md`
- **Tasks Execution:** Use `@~/.agent-os/instructions/execute-tasks.md`

## Workflow Instructions

When asked to work on this codebase:

1. **First**, check @.agent-os/product/roadmap.md for current priorities
2. **Then**, follow the appropriate instruction file:
   - For new features: @.agent-os/instructions/create-spec.md
   - For tasks execution: @.agent-os/instructions/execute-tasks.md
3. **Always**, adhere to the standards in the files listed above

## Important Notes

- Product-specific files in `.agent-os/product/` override any global standards
- User's specific instructions override (or amend) instructions found in `.agent-os/specs/...`
- Always adhere to established patterns, code style, and best practices documented above.

## Project-Specific Context

### Legacy Status
This is the original MilhasLech project that has been **deprecated** in favor of PROJECT_lechworld. This codebase is maintained for:
- Historical reference
- Data migration source
- Architecture comparison

### Key Technologies
- **Backend:** FastAPI with MongoDB (Motor async driver)
- **Frontend:** React 18 with Tailwind CSS
- **Deployment:** Fly.io container deployment
- **Database:** MongoDB Atlas

### Migration Notes
When referencing this project:
1. All new development happens in PROJECT_lechworld
2. This codebase uses MongoDB (migrated to Supabase in lechworld)
3. Authentication system is basic (enhanced in lechworld)
4. Consider data structure differences when planning migrations

### Testing Approach
The project includes several test files:
- `backend_test.py` - Backend API testing
- `field_editing_test.py` - Field operation testing
- `new_member_test.py` - Member management testing

### Environment Variables
Required environment variables (in `.env`):
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name
- `PORT` - Server port (default: 8080)