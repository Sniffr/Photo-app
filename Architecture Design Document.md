# Photo-Inc
# Photo Sharing App - Architecture Design Document

## 1. System Architecture Overview

### 1.1 High-Level Architecture
The system follows a modular, layered architecture based on the following principles:
- Clean Architecture
- Domain-Driven Design (DDD)
- SOLID principles
- Dependency Injection

```
├── Application Layer (Controllers, DTOs)
├── Domain Layer (Entities, Interfaces)
├── Infrastructure Layer (Repositories, External Services)
└── Core Layer (Shared utilities, constants)
```

### 1.2 Technology Stack
- Backend Framework: NestJS
- Database: PostgreSQL
- ORM: TypeORM
- Authentication: JWT
- File Storage: AWS (S3-compatible)
- Container: Docker
- CI/CD: GitHub Actions
- API Documentation: Swagger/OpenAPI

## 2. Database Design

### 2.1 Entity Relationship Diagram
```
User
├── id (UUID)
├── username (string, unique)
├── email (string, unique)
├── password (string, hashed)
├── bio (string, nullable)
├── created_at (timestamp)
└── updated_at (timestamp)

Photo
├── id (UUID)
├── user_id (UUID, FK)
├── filename (string)
├── url (string)
├── caption (string, nullable)
├── hashtags (string[])
├── created_at (timestamp)
└── updated_at (timestamp)

Like
├── id (UUID)
├── user_id (UUID, FK)
├── photo_id (UUID, FK)
└── created_at (timestamp)

Comment
├── id (UUID)
├── user_id (UUID, FK)
├── photo_id (UUID, FK)
├── content (string)
├── created_at (timestamp)
└── updated_at (timestamp)

Follow
├── follower_id (UUID, FK)
├── following_id (UUID, FK)
└── created_at (timestamp)

Notification
├── id (UUID)
├── user_id (UUID, FK)
├── type (enum)
├── reference_id (UUID)
├── read (boolean)
├── created_at (timestamp)
└── updated_at (timestamp)
```

## 3. Module Design

### 3.1 Auth Module
- Handles user authentication and authorization
- JWT token generation and validation
- Password encryption using bcrypt

### 3.2 User Module
- User profile management
- Follow/unfollow functionality
- Profile updates

### 3.3 Photo Module
- Photo upload and management
- File validation and processing
- Metadata storage
- AWS integration for storage

### 3.4 Feed Module
- Aggregates photos from followed users
- Implements pagination
- Optimizes feed generation using caching

### 3.5 Interaction Module
- Handles likes and comments
- Manages notifications
- Real-time updates (WebSocket)

### 3.6 Search Module
- User search by username
- Photo search by hashtags

## 4. API Design

### 4.1 Authentication Endpoints
```
POST /auth/signup
POST /auth/login
POST /auth/logout
POST /auth/refresh-token
```

### 4.2 User Endpoints
```
GET /users/:id/profile
PUT /users/profile
POST /users/:id/follow
DELETE /users/:id/follow
GET /users/search
```

### 4.3 Photo Endpoints
```
POST /photos
GET /photos
GET /photos/:id
DELETE /photos/:id
GET /photos/feed
```

### 4.4 Interaction Endpoints
```
POST /photos/:id/like
DELETE /photos/:id/like
POST /photos/:id/comments
GET /photos/:id/comments
```

### 4.5 Notification Endpoints
```
GET /notifications
PUT /notifications/:id/read
```

## 5. Security Measures

### 5.1 Authentication & Authorization
- JWT-based authentication
- Role-based access control
- Token refresh mechanism
- Request rate limiting

### 5.2 Data Protection
- Password hashing with bcrypt
- HTTPS enforcement
- Input validation
- SQL injection prevention
- XSS protection

## 6. Performance Optimization

### 6.1 Caching Strategy(TBD)
- Redis for caching
- Cache feed data
- Cache user profiles
- Cache photo metadata

### 6.2 Database Optimization
- Indexing strategy
- Query optimization
- Connection pooling
- Database sharding preparation

## 7. Deployment Architecture

### 7.1 Docker Configuration
```yaml
services:
  app:
    build: .
    depends_on:
      - postgres
      - redis
  postgres:
    image: postgres:latest
```

### 7.2 CI/CD Pipeline
1. Code linting and testing
2. Build Docker image
3. Run integration tests
4. Deploy to staging
5. Deploy to production

## 8. Monitoring and Logging

### 8.1 Monitoring
- Health check endpoints
- Performance metrics
- Error tracking
- Resource utilization

### 8.2 Logging
- Request/Response logging
- Error logging
- Audit logging
- Performance logging

## 9. Scaling Strategy

### 9.1 Horizontal Scaling
- Stateless application design
- Load balancer configuration
- Session management
- Database replication

### 9.2 Vertical Scaling
- Resource optimization
- Performance tuning
- Memory management
- Connection pooling

## 10. Testing Strategy

### 10.1 Testing Levels
- Unit tests
- Integration tests
- E2E tests
- Load tests

### 10.2 Test Coverage
- Minimum 80% code coverage
- Critical path testing
- Error handling testing
- Edge case testing
