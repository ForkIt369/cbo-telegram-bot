# Docker Deployment Documentation

## Docker Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Container                        │
├─────────────────────────────────────────────────────────────┤
│  Base Image: node:18-alpine                                 │
│  Working Directory: /app                                    │
│  Exposed Ports: 8082 (HTTP), 8084 (WebSocket)             │
├─────────────────────────────────────────────────────────────┤
│  Services:                                                  │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Node.js Server (Express + WebSocket)                 │ │
│  │  • HTTP Server on 8082                                │ │
│  │  • WebSocket Server on 8084                           │ │
│  │  • Static File Serving                                │ │
│  │  • Telegram Webhook Handler                           │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Frontend Assets                                      │ │
│  │  • HTML/CSS/JS files                                  │ │
│  │  • Static assets                                      │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Dockerfile Configuration

```dockerfile
FROM node:18-alpine

# Install necessary tools
RUN apk add --no-cache bash curl

WORKDIR /app

# Copy package files
COPY server/package*.json ./server/

# Install dependencies
RUN cd server && npm install

# Copy application files
COPY . .

# Expose ports
EXPOSE 8082 8084

# Start the application
CMD ["npm", "--prefix", "server", "start"]
```

## Docker Compose Setup

```yaml
version: '3.8'

services:
  cbo-app:
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - "8082:8082"  # HTTP
      - "8084:8084"  # WebSocket
    environment:
      - NODE_ENV=production
      - PORT=8082
      - WS_PORT=8084
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - APP_URL=${APP_URL}
    volumes:
      - ./src:/app/src:ro
      - ./server:/app/server:ro
    restart: unless-stopped
    networks:
      - cbo-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8082/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - cbo-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - cbo-app
    networks:
      - cbo-network
    restart: unless-stopped

networks:
  cbo-network:
    driver: bridge

volumes:
  redis-data:
```

## Nginx Configuration

```nginx
upstream cbo_app {
    server cbo-app:8082;
}

upstream cbo_ws {
    server cbo-app:8084;
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # WebSocket upgrade headers
    location /ws {
        proxy_pass http://cbo_ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeouts
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # Regular HTTP traffic
    location / {
        proxy_pass http://cbo_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static file caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        proxy_pass http://cbo_app;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Build and Deployment Scripts

### docker-start.sh
```bash
#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Build the Docker image
echo "Building Docker image..."
docker build -t cbo-mini-app:latest -f docker/Dockerfile .

# Stop existing containers
echo "Stopping existing containers..."
docker-compose -f docker/docker-compose.yml down

# Start services
echo "Starting services..."
docker-compose -f docker/docker-compose.yml up -d

# Check health
echo "Checking application health..."
sleep 5
curl -f http://localhost:8082/health || exit 1

echo "Application started successfully!"
echo "HTTP: http://localhost:8082"
echo "WebSocket: ws://localhost:8084"
```

### Production Deployment Script
```bash
#!/bin/bash

# Production deployment script
set -e

# Variables
REGISTRY="your-registry.com"
IMAGE_NAME="cbo-mini-app"
TAG=$(git rev-parse --short HEAD)

# Build and tag image
docker build -t ${REGISTRY}/${IMAGE_NAME}:${TAG} \
             -t ${REGISTRY}/${IMAGE_NAME}:latest \
             -f docker/Dockerfile .

# Push to registry
docker push ${REGISTRY}/${IMAGE_NAME}:${TAG}
docker push ${REGISTRY}/${IMAGE_NAME}:latest

# Deploy to production
ssh production-server << EOF
  docker pull ${REGISTRY}/${IMAGE_NAME}:latest
  docker-compose -f /app/docker-compose.yml up -d --no-deps cbo-app
  docker system prune -f
EOF

echo "Deployment complete!"
```

## Environment Configuration

### Development (.env.development)
```bash
# Server Configuration
NODE_ENV=development
PORT=8082
WS_PORT=8084

# Claude AI
ANTHROPIC_API_KEY=sk-ant-development-key

# Telegram
TELEGRAM_BOT_TOKEN=development-bot-token
APP_URL=http://localhost:8082

# Database (optional)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=debug

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8082
```

### Production (.env.production)
```bash
# Server Configuration
NODE_ENV=production
PORT=8082
WS_PORT=8084

# Claude AI
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}

# Telegram
TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
APP_URL=https://your-domain.com

# Database
REDIS_URL=redis://redis:6379

# Logging
LOG_LEVEL=info

# CORS
ALLOWED_ORIGINS=https://your-domain.com

# Security
SESSION_SECRET=${SESSION_SECRET}
JWT_SECRET=${JWT_SECRET}

# Rate Limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100
```

## Kubernetes Deployment

### deployment.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cbo-mini-app
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cbo-mini-app
  template:
    metadata:
      labels:
        app: cbo-mini-app
    spec:
      containers:
      - name: app
        image: your-registry.com/cbo-mini-app:latest
        ports:
        - containerPort: 8082
          name: http
        - containerPort: 8084
          name: websocket
        env:
        - name: NODE_ENV
          value: "production"
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: cbo-secrets
              key: anthropic-api-key
        - name: TELEGRAM_BOT_TOKEN
          valueFrom:
            secretKeyRef:
              name: cbo-secrets
              key: telegram-bot-token
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8082
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8082
          initialDelaySeconds: 5
          periodSeconds: 5
```

### service.yaml
```yaml
apiVersion: v1
kind: Service
metadata:
  name: cbo-mini-app-service
  namespace: production
spec:
  selector:
    app: cbo-mini-app
  ports:
  - name: http
    port: 80
    targetPort: 8082
  - name: websocket
    port: 8084
    targetPort: 8084
  type: LoadBalancer
```

## Health Monitoring

### Health Check Endpoint
```javascript
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    connections: {
      websocket: wss.clients.size,
      sessions: sessionManager.getActiveSessionCount()
    }
  };
  
  res.status(200).json(health);
});
```

### Docker Health Check
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1
```

### healthcheck.js
```javascript
const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 8082,
  path: '/health',
  method: 'GET',
  timeout: 2000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.abort();
  process.exit(1);
});

req.end();
```

## Scaling Strategies

### Horizontal Scaling
```yaml
# Auto-scaling configuration
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: cbo-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: cbo-mini-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Load Balancing
```nginx
upstream cbo_app_cluster {
    least_conn;
    server app1:8082 weight=1;
    server app2:8082 weight=1;
    server app3:8082 weight=1;
    keepalive 32;
}
```

## Backup and Recovery

### Backup Script
```bash
#!/bin/bash

# Backup configuration and data
BACKUP_DIR="/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p ${BACKUP_DIR}

# Backup Redis data
docker exec redis redis-cli SAVE
docker cp redis:/data/dump.rdb ${BACKUP_DIR}/redis-dump.rdb

# Backup application data
tar -czf ${BACKUP_DIR}/app-data.tar.gz ./data/

# Upload to S3 (optional)
aws s3 cp ${BACKUP_DIR} s3://backup-bucket/cbo-app/ --recursive

echo "Backup completed: ${BACKUP_DIR}"
```

## Monitoring and Logging

### Prometheus Metrics
```javascript
const prometheus = require('prom-client');

// Create metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
});

const websocketConnections = new prometheus.Gauge({
  name: 'websocket_connections_total',
  help: 'Total number of WebSocket connections'
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});
```

### Log Aggregation
```yaml
# Fluentd configuration
<source>
  @type forward
  port 24224
</source>

<filter cbo.**>
  @type record_transformer
  <record>
    hostname ${hostname}
    environment ${ENV["NODE_ENV"]}
  </record>
</filter>

<match cbo.**>
  @type elasticsearch
  host elasticsearch
  port 9200
  logstash_format true
  logstash_prefix cbo
</match>
```

## Security Considerations

1. **Environment Variables**: Never commit secrets to version control
2. **Network Isolation**: Use Docker networks to isolate services
3. **SSL/TLS**: Always use HTTPS in production
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Container Security**: Run containers as non-root user
6. **Image Scanning**: Scan Docker images for vulnerabilities

## Next Steps
- [Environment Configuration →](./environment.md)
- [Production Deployment →](./production.md)
- [Monitoring Setup →](./monitoring.md)