# Product Requirements Document

## 1. Overview
### Product Name
Osuna App

### Problem Statement
Photography businesses, particularly those working with schools and organizations, face challenges in managing:
- Complex package offerings for school photography sessions
- Physical inventory (medals, certificates) alongside digital assets
- Multiple client relationships (parents, schools, organizations)
- Order tracking and fulfillment
- Client data organization across different contexts

### Target Audience
Primary personas:
1. **Photography Business Owners/Administrators**
   - Manage overall business operations
   - Track inventory and sales
   - Create and manage package offerings

2. **School Administrators**
   - Coordinate photography sessions
   - Manage school-specific packages
   - Track student participation

3. **Parents/Individual Clients**
   - Purchase photo packages for their children
   - Book regular photography services
   - Track orders and deliveries

### Key Objectives
- Streamline school photography session management
- Simplify package creation and inventory tracking
- Enable efficient client relationship management
- Provide clear insights into business performance
- Support both B2B (schools/organizations) and B2C (individual clients) workflows

## 2. Features
### Core Features
1. Authentication System
   - User login/signup with email/password
   - Social login integration (Google)
   - Role-based access control
   - Password reset functionality

2. Organization Management
   - School/organization profile management
   - Member role assignment
   - Organization-specific package creation
   - Bulk order management

3. Client Management
   - Multi-type client profiles (parents, employees, individuals)
   - Child management for parent accounts
   - Purchase history tracking
   - Contact information management

4. Package/Bundle Management
   - Customizable photography packages
   - Physical item inventory tracking
   - Price management
   - School-specific package creation

5. Dashboard
   - Sales metrics and trends
   - Inventory alerts
   - Upcoming photography sessions
   - Recent activity feed

### Future Features
- Digital asset delivery system
- Customer feedback and rating system
- Automated email marketing campaigns

## 3. User Stories
### Authentication
- As a user, I want to sign up using email/password so I can access the system
- As a user, I want to log in using Google so I can access my account quickly
- As an admin, I want to manage user roles so I can control system access

### Organization Management
- As an admin, I want to create and manage school profiles
- As a school admin, I want to view all orders from my school
- As an organization member, I want to access organization-specific packages

### Client Management
- As an admin, I want to view all clients in a searchable table
- As a parent, I want to manage multiple children's photo packages
- As a client, I want to view my purchase history
- As an admin, I want to track client relationships with organizations

### Package Management
- As an admin, I want to create and modify photo packages
- As an admin, I want to track inventory levels for physical items
- As a client, I want to view available packages for my organization

### Dashboard
- As an admin, I want to see key metrics at a glance
- As an admin, I want to receive low inventory alerts
- As a school admin, I want to track session completion status

## 4. Technical Requirements
### Frontend
- Next.js 14
- React
- Tailwind CSS
- Shadcn UI components
- TypeScript
- React Query for data fetching
- Zustand for state management

### Backend
- Next.js API routes
- Authentication via NextAuth
- PostgreSQL database with Drizzle ORM
- AWS S3 for image storage
- Redis for caching

### Infrastructure
- Hosting: Vercel
- CI/CD: GitHub Actions
- Database: Neon (PostgreSQL)
- Image CDN: Cloudinary
- Monitoring: Vercel Analytics

## 5. Success Metrics
- User Engagement
  - 90% of schools complete photo session workflow
  - 70% of parents place orders online
  - Average session duration > 5 minutes

- Business Performance
  - 25% reduction in package management time
  - 50% reduction in inventory tracking errors
  - 30% increase in package customization options

- Technical Performance
  - 99.9% system uptime
  - Page load time < 2 seconds
  - API response time < 200ms

## 6. Open Questions
- Should we implement a mobile-first approach for on-site package selection?
- How can we handle seasonal peaks in school photography sessions?
- What level of customization should be allowed for organization-specific packages?
- Should we integrate with school management systems?
- How can we implement efficient bulk delivery tracking?
- What payment processing options should we support?

I want to make that the schools i can put the goals in this case an i can track the thing
/organizations/ etc