# CM Training Dashboard

## Overview

A fully functional, comprehensive training dashboard built for Class Mentors (CMs) featuring roleplay practice calls, interactive chat support, progress tracking, and learning materials management. The application includes a complete authentication system, PostgreSQL database integration, and is ready for deployment with external AI service integrations.

**Status**: ✅ Complete and functional
**Last Updated**: January 6, 2025

## Recent Changes

- ✅ **Production-Ready Deployment Configuration**: Complete CORS setup with Replit domain patterns
- ✅ **Enhanced Session Security**: Production cookies with HTTPS, SameSite, and cross-origin support
- ✅ **Multiple Concurrent Admin Sessions**: Verified database support for 5+ concurrent admin logins
- ✅ **Deployment Compatibility Testing**: Automated test suite for production environment simulation
- ✅ **Auto-redirect after authentication**: Immediate redirect behavior without page refresh required
- ✅ **Health Check Endpoint**: `/api/health` for deployment diagnostics and troubleshooting
- ✅ **Pre-filled Admin Credentials**: admin@cm.com/password123 auto-filled for easy access
- ✅ Enhanced materials portal with comprehensive file preview system (100MB upload limit)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Single-page application using React 18 with TypeScript for type safety
- **Component Library**: Radix UI components with shadcn/ui styling system for consistent, accessible UI components
- **Styling**: Tailwind CSS with CSS custom properties for theming and responsive design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod for form validation and type-safe form handling
- **Client-side Routing**: Custom navigation system using state-based page switching

### Backend Architecture
- **Express.js Server**: RESTful API server with middleware for logging, JSON parsing, and error handling
- **Database Layer**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Authentication**: Custom session-based authentication with bcrypt for password hashing
- **API Structure**: RESTful endpoints following `/api/*` convention with proper HTTP status codes
- **Storage Pattern**: Repository pattern with interface abstraction for data access operations

### Database Design
- **Users**: Authentication and profile management with role-based access (STUDENT, TRAINER, ADMIN)
- **Progress**: Module-based progress tracking with status, scores, and attempt counting
- **Practice Calls**: Session tracking for roleplay calls with outcomes and notes
- **Materials**: Learning resource management with tagging system for categorization

### Development Architecture
- **Monorepo Structure**: Client and server code in separate directories with shared schema
- **Build System**: Vite for frontend bundling with hot reload, esbuild for backend compilation
- **Development Server**: Express server with Vite middleware integration for seamless full-stack development
- **Path Aliases**: TypeScript path mapping for clean imports (@/, @shared/, @assets/)

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL database with connection pooling via `@neondatabase/serverless`
- **Drizzle**: Type-safe ORM with migration support and schema management

### Third-Party Integrations
- **Ringg AI**: Voice-based roleplay practice calls integration with agent ID and API key configuration
- **Botpress**: Conversational AI chatbot for Q&A support with webchat widget embedding

### UI and Styling
- **Radix UI**: Comprehensive component primitives for accessibility and interaction patterns
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **shadcn/ui**: Pre-built component library built on Radix UI primitives

### Development Tools
- **Replit Integration**: Development environment optimizations with runtime error overlay and cartographer plugin
- **Session Management**: PostgreSQL session store with `connect-pg-simple`
- **Validation**: Zod for runtime type validation and schema definitions

### Authentication and Security
- **bcrypt**: Password hashing and validation
- **Custom Session Management**: Server-side session handling with database persistence
- **express-session**: Session middleware with PostgreSQL store via connect-pg-simple

## Environment Variables

The following environment variables can be configured for external service integration:

### Required (automatically configured)
- `DATABASE_URL`: PostgreSQL connection string (auto-configured by Replit)
- `SESSION_SECRET`: Session encryption key (defaults to dev key)

### Optional (for external services)
- `VITE_RINGG_AGENT_ID`: Ringg AI agent ID for practice calls
- `VITE_RINGG_X_API_KEY`: Ringg AI API key for voice assistant
- `VITE_BOTPRESS_BOT_ID`: Botpress bot ID for chat integration  
- `VITE_BOTPRESS_CLIENT_ID`: Botpress client ID
- `VITE_BOTPRESS_WEBCHAT_HOST`: Botpress webchat host URL
- `VITE_BOTPRESS_MESSAGING_URL`: Botpress messaging service URL

**Note**: The application works fully without external API keys. Practice calls and chat features have fallback interfaces for demonstration purposes.