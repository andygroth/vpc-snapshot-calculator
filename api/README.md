# VPC Snapshot Calculator API

Backend API service for the VPC Snapshot Calculator that fetches real-time pricing data from IBM Cloud.

## Features

- 🔐 Secure IBM Cloud API key handling
- 💾 Intelligent caching (24-hour default)
- 🔄 Automatic fallback to static pricing
- 🚀 Fast response times
- 📊 Health check and monitoring endpoints
- 🐳 Docker support for easy deployment

## Prerequisites

- Node.js 18 or higher
- IBM Cloud API key (get one at https://cloud.ibm.com/iam/apikeys)

## Local Development

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Configure Environment

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and add your IBM Cloud API key:

```env
IBM_CLOUD_API_KEY=your_actual_api_key_here
PORT=3001
NODE_ENV=development
CACHE_TTL=86400
CORS_ORIGIN=http://localhost:3000
```

### 3. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The API will be available at `http://localhost:3001`

## API Endpoints

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-10T17:30:00.000Z",
  "version": "1.2.0",
  "cache": {
    "keys": 1,
    "stats": {...}
  }
}
```

### GET /api/pricing
Get VPC snapshot pricing data

**Response:**
```json
{
  "lastUpdated": "2026-02-10T17:30:00.000Z",
  "source": "IBM Cloud Global Catalog API",
  "cached": false,
  "regions": {
    "us-south": {
      "name": "US South (Dallas)",
      "pricePerGB": 0.05,
      "currency": "USD"
    },
    ...
  }
}
```

### POST /api/pricing/refresh
Force refresh pricing data (clears cache)

**Response:**
```json
{
  "lastUpdated": "2026-02-10T17:30:00.000Z",
  "refreshed": true,
  "regions": {...}
}
```

### GET /api/cache/stats
Get cache statistics

**Response:**
```json
{
  "stats": {
    "keys": 1,
    "hits": 42,
    "misses": 1,
    "ksize": 1,
    "vsize": 1024
  },
  "keys": ["pricing"],
  "ttl": 86400
}
```

### POST /api/cache/clear
Clear all cached data

**Response:**
```json
{
  "message": "Cache cleared successfully"
}
```

## Docker

### Build Image

```bash
docker build -t vpc-calculator-api .
```

### Run Container

```bash
docker run -d \
  -p 3001:3001 \
  -e IBM_CLOUD_API_KEY=your_api_key \
  -e CACHE_TTL=86400 \
  --name vpc-api \
  vpc-calculator-api
```

### Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - IBM_CLOUD_API_KEY=${IBM_CLOUD_API_KEY}
      - CACHE_TTL=86400
      - CORS_ORIGIN=http://localhost:3000
    restart: unless-stopped
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `IBM_CLOUD_API_KEY` | No* | - | IBM Cloud API key for fetching pricing |
| `PORT` | No | 3001 | Server port |
| `NODE_ENV` | No | production | Environment (development/production) |
| `CACHE_TTL` | No | 86400 | Cache duration in seconds (24 hours) |
| `CORS_ORIGIN` | No | * | Allowed CORS origin |

*If not provided, the API will use fallback static pricing data.

## Caching Strategy

- Pricing data is cached for 24 hours by default
- Cache is automatically refreshed when expired
- If API fails, stale cache data is returned
- If no cache exists and API fails, fallback static pricing is used

## Error Handling

The API implements multiple fallback strategies:

1. **Primary**: Fetch from IBM Cloud API
2. **Secondary**: Return cached data (even if stale)
3. **Tertiary**: Return static fallback pricing

This ensures the frontend always receives pricing data.

## Security

- API key is stored as environment variable (never in code)
- CORS configured to restrict origins
- Non-root user in Docker container
- Health checks for monitoring

## Monitoring

Monitor the API using:

```bash
# Check health
curl http://localhost:3001/health

# Check cache stats
curl http://localhost:3001/api/cache/stats
```

## Troubleshooting

### API returns fallback pricing

**Cause**: IBM Cloud API key not configured or invalid

**Solution**: 
1. Verify your API key is correct
2. Check the key has proper permissions
3. View server logs for detailed error messages

### High cache miss rate

**Cause**: Cache TTL too short or frequent restarts

**Solution**: Increase `CACHE_TTL` environment variable

### CORS errors

**Cause**: Frontend origin not allowed

**Solution**: Set `CORS_ORIGIN` to your frontend URL

## Development

### Project Structure

```
api/
├── src/
│   ├── server.js           # Express server
│   └── ibmCloudPricing.js  # IBM Cloud API integration
├── Dockerfile              # Docker configuration
├── package.json            # Dependencies
├── .env.example            # Environment template
└── README.md              # This file
```

### Adding New Endpoints

1. Add route in `src/server.js`
2. Implement handler function
3. Add error handling
4. Update this README

## License

MIT
