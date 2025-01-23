# Photo-Inc API

A robust photo-sharing application backend built with NestJS, PostgreSQL, and AWS S3.

## Features

- User authentication with JWT
- Photo upload and management with AWS S3 storage
- User profiles and follow system
- Feed generation with pagination
- Like and comment functionality
- Search capabilities for users and photos
- Real-time notifications
- Comprehensive API documentation with Swagger

## Local Development Setup

### Prerequisites

- Node.js 18 or later
- PostgreSQL 14 or later
- AWS S3 bucket and credentials
- Docker (optional, for containerized setup)

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/Sniffr/Photo-Inc.git
cd Photo-Inc
```

2. Copy the example environment file and update with your credentials:
```bash
cp .env.example .env
```

3. Update the following environment variables in `.env`:
```
# Authentication
JWT_SECRET=your-jwt-secret-here

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=photo_inc

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=your-region
AWS_S3_BUCKET=your-bucket-name
```

### Database Setup

1. Create a PostgreSQL database:
```bash
createdb photo_inc
```

2. Install dependencies and run migrations:
```bash
npm install
npm run migration:run
```

### Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`. Swagger documentation can be accessed at `http://localhost:3000/api`.

## Deployment Guide

### Prerequisites for Private Server
- Ubuntu 20.04 LTS or later
- Docker and Docker Compose installed
- Node.js 18 or later (for running migrations)
- PostgreSQL 14 or later
- Nginx (for reverse proxy)
- SSL certificate (recommended)

### Server Setup

1. Install required packages:
```bash
sudo apt update
sudo apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx
```

2. Create deployment directory:
```bash
sudo mkdir -p /opt/photo-inc
sudo chown $USER:$USER /opt/photo-inc
cd /opt/photo-inc
```

3. Clone the repository:
```bash
git clone https://github.com/Sniffr/Photo-Inc.git .
```

### Docker Setup

1. Create environment file:
```bash
cp .env.example .env
# Edit .env with your production values
```

2. Build and start the containers:
```bash
docker-compose up -d
```

3. Run database migrations:
```bash
docker-compose exec app npm run migration:run
```

### Nginx Configuration

1. Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/photo-inc
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

2. Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/photo-inc /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

3. Set up SSL (recommended):
```bash
sudo certbot --nginx -d your-domain.com
```

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment. The pipeline consists of the following stages:

### Test Stage
- Runs on every push and pull request
- Sets up Node.js and PostgreSQL
- Installs dependencies
- Runs linting checks
- Executes unit tests
- Environment variables are automatically configured

### Build Stage
- Triggered on push to main branch
- Uses Docker Buildx for multi-platform builds
- Builds and pushes Docker image to registry
- Requires Docker Hub credentials

### Deploy Stage
- Deploys to private server using SSH
- Automatically runs database migrations
- Sets up environment variables from secrets
- Configures SSL and domain settings

### Environment Variables for CI/CD
Required secrets for the pipeline:
- `DOCKER_USERNAME`: Docker Hub username
- `DOCKER_PASSWORD`: Docker Hub password
- `DEPLOY_HOST`: Deployment server hostname
- `DEPLOY_USERNAME`: Deployment server username
- `DEPLOY_SSH_KEY`: SSH private key for deployment
- `JWT_SECRET`: JWT signing secret
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `AWS_REGION`: AWS region
- `AWS_S3_BUCKET`: S3 bucket name

## API Documentation

The API documentation is available in two formats:

1. Swagger UI: Available at `/api` when running the application
2. A live version of the swagger si available at http://209.97.132.232/api 
3. Postman Collection: Located in the `postman` directory
4. This is also available through  the link https://jungopharm.postman.co/workspace/Interview~52eb37c8-2d2a-449d-9001-85400a5429fd/collection/9293037-942e0f74-a193-47dc-86ee-2a05d6ca1e49?action=share&creator=9293037&active-environment=9293037-7c025d09-e41b-42f0-ac47-9c529c3bb43b

## License

This project is MIT licensed.
