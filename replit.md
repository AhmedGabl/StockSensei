# CM Training Home Page

## Overview

A fully functional, comprehensive training Home Page built for Class Mentors (CMs) featuring roleplay practice calls, interactive chat support, progress tracking, and learning materials management. The application includes a complete authentication system, PostgreSQL database integration, and is ready for deployment with external AI service integrations.

**Status**: ✅ Complete and functional
**Last Updated**: January 13, 2025

## Recent Changes

- ✅ **Enhanced Material-Based Test Generation**: Fixed AI test generation to properly use material content context based on file types (VIDEO, PDF, DOCUMENT), ensuring questions are directly relevant to the training materials
- ✅ **Improved Test Generation Error Handling**: Enhanced frontend error handling to distinguish between session expiry and actual generation failures, providing more accurate user feedback
- ✅ **Botpress Q&A Chat Integration**: Successfully integrated Botpress chatbot with hardcoded credentials for seamless Q&A functionality
- ✅ **Role-Specific Home Page Actions**: Fixed admin home page to show "Create Tests" and "Manage Groups" instead of student actions like "Take Quiz"
- ✅ **Enhanced Navigation Visibility**: Updated selected navigation tabs to use clear 51Talk orange text on white background with orange border for excellent readability
- ✅ **Consistent Home Page Navigation**: Fixed navigation to use "Home Page" consistently throughout system with multiple access points
- ✅ **Complete Dashboard → Home Page Migration**: Replaced all "dashboard" references with "Home Page" for consistent terminology
- ✅ **Full AI-Native Implementation**: Complete AI chatbot and voice roleplay system deployed
- ✅ **OpenAI Integration**: AI-powered chat assistant and practice call analysis functionality
- ✅ **Ringg AI Integration**: Live voice roleplay agent with real API credentials and custom styling
- ✅ **Voice Assistant CSS Isolation**: Fixed styling conflicts with Ringg AI voice assistant, Home Page colors now remain consistent
- ✅ **Problem Report Admin Controls**: Admins can now mark reports as fixed and add resolution notes
- ✅ **Admin-Controlled Test Attempts**: Admins can now set maximum attempts per test assignment (1-unlimited), preventing score modifications after limit reached
- ✅ **Test Results in Progress Tracking**: All test scores are now recorded in the progress system and visible to admins with complete attempt history
- ✅ **Enhanced Module Admin Interface**: Added proper icons and tooltips for all module management functions (move up/down, edit, show/hide, delete)
- ✅ **Unified Admin Control Center**: New centralized admin panel for managing all student-facing elements, Home Page sections, modules, and test assignments
- ✅ **Real-time Module Tracking**: Students now see live updates when admins modify training modules (5-second refresh)
- ✅ **Enhanced Materials Management**: Fixed tag filtering and added admin edit capabilities for material names and descriptions
- ✅ **Improved Test Results Recording**: Fixed test scoring system with proper answer validation and result storage
- ✅ **Dynamic Home Page Updates**: Training modules display with proper ordering and enable/disable state tracking
- ✅ **Material Edit Dialog**: Complete edit interface for admins to modify material titles, descriptions, and tags
- ✅ **Production-Ready Deployment Configuration**: Complete CORS setup with Replit domain patterns
- ✅ **Enhanced Session Security**: Production cookies with HTTPS, SameSite, and cross-origin support
- ✅ **Multiple Concurrent Admin Sessions**: Verified database support for 5+ concurrent admin logins
- ✅ **Deployment Compatibility Testing**: Automated test suite for production environment simulation
- ✅ **Auto-redirect after authentication**: Immediate redirect behavior without page refresh required
- ✅ **Health Check Endpoint**: `/api/health` for deployment diagnostics and troubleshooting
- ✅ **Pre-filled Admin Credentials**: admin@cm.com/password123 auto-filled for easy access
- ✅ **Enhanced materials portal** with comprehensive file preview system (100MB upload limit)
- ✅ **Test Assignment System**: Admins can assign tests to specific students with due dates
- ✅ **Note Management Enhancement**: Added delete functionality for admin notes with proper access control

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

### AI Services Integration
- **OpenAI GPT-4o**: AI-native chat assistant for training support and practice call analysis
- **Ringg AI**: Live voice roleplay practice calls with real agent ID and API key integration
- **Botpress**: Conversational AI chatbot for Q&A support with webchat widget embedding (optional)

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

### Required (for AI features)
- `OPENAI_API_KEY`: OpenAI API key for AI-native website functionality and intelligent features

### Optional (for external services)
- `VITE_RINGG_AGENT_ID`: Ringg AI agent ID for practice calls
- `VITE_RINGG_X_API_KEY`: Ringg AI API key for voice assistant

### Configured (Botpress Integration)
- **Botpress Bot ID**: `3f10c2b1-6fc1-4cf1-9f25-f5db2907d205` (hardcoded in component)
- **Botpress Client ID**: `b98de221-d1f1-43c7-bad5-f279c104c231` (hardcoded in component)
- **Botpress CDN**: `https://cdn.botpress.cloud/webchat/v3.2/inject.js`

**Note**: Botpress chat is fully configured and operational. Voice practice calls have fallback interfaces for demonstration purposes.