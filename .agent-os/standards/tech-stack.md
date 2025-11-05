# Tech Stack

## Context

Global tech stack defaults for Agent OS projects, overridable in project-specific `.agent-os/product/tech-stack.md`.

- **App Framework**: .NET latest LTS (C#) for backend services  
- **Languages**: C#, TypeScript/JavaScript, Python (for scripting, ML, or automation)  
- **Primary Database**: Microsoft SQL Server (typical), with PostgreSQL or Supabase when lighter/flexible solutions fit  
- **ORM / Data Access**: Entity Framework Core (preferred), Dapper for lightweight querying  
- **JavaScript Framework**: Vue 3 (latest stable)  
- **3D/Interactive**: Three.js, WebGL, Unity (when simulation/game-like interaction is needed)  
- **Build Tool**: Vite  
- **Import Strategy**: ES Modules (Node.js)  
- **Package Manager**: npm (pnpm acceptable for larger repos)  
- **Node Version**: 22 LTS  
- **CSS Framework**: Tailwind CSS 4.0+  
- **UI Components**: shadcn/ui or custom components with Tailwind  
- **Icons**: Lucide (React/Vue ports)  
- **Fonts**: Google Fonts, self-hosted for performance  

## Cloud & Hosting

- **Application Hosting**: Azure App Services or Cloudflare
- **Serverless / Event-driven**: Azure Functions, AWS Lambda when needed or Supabase Functions
- **Messaging / Realtime**: WebSockets, SignalR, MQTT (depending on scenario)  
- **Hosting Region**: Chosen based on project/user base (typically Northern Europe)  
- **Database Hosting**: Azure SQL Database, Digital Ocean Managed PostgreSQL, Supabase  
- **Database Backups**: Daily automated with point-in-time restore  
- **Asset Storage**: Amazon S3 / Azure Blob / Google Cloud Storage (per project)  
- **CDN**: CloudFront or Azure CDN  
- **Asset Access**: Private with signed URLs  

## DevOps

- **Version Control**: GitHub (main/staging branching model)  
- **CI/CD Platform**: GitHub Actions (standard)  
- **CI/CD Trigger**: Push to `main` (prod) / `staging` (test)  
- **Infrastructure as Code**: Terraform or Bicep (depending on cloud)  
- **Containers**: Docker + Docker Compose (for local/test)  
- **Tests**: Unit + Integration tests run before deployment  

## Environments

- **Production Environment**: `main` branch  
- **Staging Environment**: `staging` branch  
- **Dev Environment**: feature branches, local Docker, SWA (Static Web Apps) if applicable
