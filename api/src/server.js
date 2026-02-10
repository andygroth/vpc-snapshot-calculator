/**
 * VPC Snapshot Calculator API Server
 * 
 * Provides pricing data from IBM Cloud API with caching
 */

import express from 'express';
import cors from 'cors';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';
import { fetchIBMCloudPricing, getFallbackPricing } from './ibmCloudPricing.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Cache configuration (24 hours by default)
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '86400', 10);
const cache = new NodeCache({ stdTTL: CACHE_TTL });

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.2.0',
    cache: {
      keys: cache.keys().length,
      stats: cache.getStats()
    }
  });
});

/**
 * Get pricing data
 * Returns cached data if available, otherwise fetches from IBM Cloud API
 */
app.get('/api/pricing', async (req, res) => {
  try {
    // Check cache first
    const cachedPricing = cache.get('pricing');
    if (cachedPricing) {
      console.log('Returning cached pricing data');
      return res.json({
        ...cachedPricing,
        cached: true,
        cacheAge: Math.floor((Date.now() - new Date(cachedPricing.lastUpdated).getTime()) / 1000)
      });
    }

    // Fetch from IBM Cloud API
    const apiKey = process.env.IBM_CLOUD_API_KEY;
    
    if (!apiKey) {
      console.warn('IBM_CLOUD_API_KEY not configured, using fallback pricing');
      const fallbackData = getFallbackPricing();
      cache.set('pricing', fallbackData);
      return res.json({
        ...fallbackData,
        cached: false,
        warning: 'Using fallback pricing - API key not configured'
      });
    }

    console.log('Fetching pricing from IBM Cloud API...');
    const pricingData = await fetchIBMCloudPricing(apiKey);
    
    // Cache the result
    cache.set('pricing', pricingData);
    
    res.json({
      ...pricingData,
      cached: false
    });
  } catch (error) {
    console.error('Error fetching pricing:', error.message);
    
    // Try to return cached data even if expired
    const cachedPricing = cache.get('pricing');
    if (cachedPricing) {
      console.log('Returning stale cached data due to API error');
      return res.json({
        ...cachedPricing,
        cached: true,
        stale: true,
        error: 'API temporarily unavailable, using cached data'
      });
    }
    
    // Fall back to static pricing
    console.log('Using fallback pricing due to API error');
    const fallbackData = getFallbackPricing();
    res.json({
      ...fallbackData,
      cached: false,
      error: 'API unavailable, using fallback pricing'
    });
  }
});

/**
 * Force refresh pricing data (clears cache)
 */
app.post('/api/pricing/refresh', async (req, res) => {
  try {
    // Clear cache
    cache.del('pricing');
    console.log('Cache cleared, fetching fresh pricing data...');
    
    const apiKey = process.env.IBM_CLOUD_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({
        error: 'IBM_CLOUD_API_KEY not configured'
      });
    }

    const pricingData = await fetchIBMCloudPricing(apiKey);
    cache.set('pricing', pricingData);
    
    res.json({
      ...pricingData,
      refreshed: true
    });
  } catch (error) {
    console.error('Error refreshing pricing:', error.message);
    res.status(500).json({
      error: 'Failed to refresh pricing data',
      message: error.message
    });
  }
});

/**
 * Get cache statistics
 */
app.get('/api/cache/stats', (req, res) => {
  const stats = cache.getStats();
  const keys = cache.keys();
  
  res.json({
    stats,
    keys,
    ttl: CACHE_TTL
  });
});

/**
 * Clear cache (admin endpoint)
 */
app.post('/api/cache/clear', (req, res) => {
  cache.flushAll();
  console.log('Cache cleared');
  res.json({
    message: 'Cache cleared successfully'
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

/**
 * Error handler
 */
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`\n🚀 VPC Snapshot Calculator API Server`);
  console.log(`📡 Listening on port ${PORT}`);
  console.log(`🔑 API Key configured: ${process.env.IBM_CLOUD_API_KEY ? 'Yes' : 'No'}`);
  console.log(`⏱️  Cache TTL: ${CACHE_TTL} seconds (${Math.floor(CACHE_TTL / 3600)} hours)`);
  console.log(`🌍 CORS origin: ${process.env.CORS_ORIGIN || '*'}`);
  console.log(`\nEndpoints:`);
  console.log(`  GET  /health              - Health check`);
  console.log(`  GET  /api/pricing         - Get pricing data`);
  console.log(`  POST /api/pricing/refresh - Force refresh pricing`);
  console.log(`  GET  /api/cache/stats     - Cache statistics`);
  console.log(`  POST /api/cache/clear     - Clear cache\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Made with Bob
