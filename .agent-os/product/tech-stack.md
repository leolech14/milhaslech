# Technical Stack

> Last Updated: 2025-07-26
> Version: 1.0.0

## Core Technologies

### Application Framework
- **Framework:** FastAPI
- **Version:** 0.110.1
- **Language:** Python 3.x

### Database
- **Primary:** MongoDB
- **Version:** Latest (via MongoDB Atlas)
- **ORM:** Motor 3.3.1 (async MongoDB driver)

## Frontend Stack

### JavaScript Framework
- **Framework:** React
- **Version:** 18.3.1
- **Build Tool:** Create React App with CRACO

### Import Strategy
- **Strategy:** node
- **Package Manager:** Yarn 1.22.22
- **Node Version:** 18.x or higher

### CSS Framework
- **Framework:** Tailwind CSS
- **Version:** 3.4.17
- **PostCSS:** 8.4.49

### UI Components
- **Library:** Custom components
- **Version:** N/A
- **Installation:** Built-in

## Assets & Media

### Fonts
- **Provider:** System fonts
- **Loading Strategy:** Native font stack

### Icons
- **Library:** Custom SVG icons
- **Implementation:** Inline SVG

## Infrastructure

### Application Hosting
- **Platform:** Fly.io
- **Service:** Container-based deployment
- **Region:** GRU (São Paulo)

### Database Hosting
- **Provider:** MongoDB Atlas
- **Service:** Managed MongoDB
- **Backups:** Automated by Atlas

### Asset Storage
- **Provider:** Served with application
- **CDN:** Fly.io edge network
- **Access:** Public

## Deployment

### CI/CD Pipeline
- **Platform:** Manual deployment
- **Trigger:** fly deploy command
- **Tests:** Local testing before deploy

### Environments
- **Production:** milhaslech.fly.dev
- **Staging:** N/A
- **Review Apps:** N/A

### Code Repository
- **URL:** Local development (PROJECT_milhaslech)

## Additional Technologies

### Backend Dependencies
- **Authentication:** PyJWT 2.10.1 with Passlib 1.7.4
- **Validation:** Pydantic 2.6.4
- **Testing:** Pytest 8.0.0
- **Code Quality:** Black, isort, flake8, mypy
- **Environment:** python-dotenv 1.0.1

### Frontend Dependencies
- **HTTP Client:** Axios 1.8.4
- **Routing:** React Router DOM 7.5.1
- **Build Enhancement:** CRACO 7.1.0
- **Styling:** PostCSS with Autoprefixer

### Development Tools
- **Containerization:** Docker with custom Dockerfile
- **Port:** 8080 (configurable via ENV)
- **CORS:** Enabled for all origins (development mode)