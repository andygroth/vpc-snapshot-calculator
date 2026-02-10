/**
 * IBM Cloud Pricing Service
 * 
 * Fetches VPC snapshot pricing from IBM Cloud Global Catalog API
 * Uses IBM Cloud API key for authentication
 */

import https from 'https';

/**
 * Fetch pricing data from IBM Cloud Global Catalog API
 * @param {string} apiKey - IBM Cloud API key
 * @returns {Promise<Object>} Pricing data by region
 */
export async function fetchIBMCloudPricing(apiKey) {
  if (!apiKey) {
    throw new Error('IBM Cloud API key is required');
  }

  try {
    // Get IAM token first
    const token = await getIAMToken(apiKey);
    
    // Fetch pricing from Global Catalog
    const pricingData = await fetchGlobalCatalogPricing(token);
    
    return pricingData;
  } catch (error) {
    console.error('Error fetching IBM Cloud pricing:', error.message);
    throw error;
  }
}

/**
 * Get IAM access token using API key
 * @param {string} apiKey - IBM Cloud API key
 * @returns {Promise<string>} IAM access token
 */
function getIAMToken(apiKey) {
  return new Promise((resolve, reject) => {
    const postData = `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`;
    
    const options = {
      hostname: 'iam.cloud.ibm.com',
      port: 443,
      path: '/identity/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.access_token) {
            resolve(response.access_token);
          } else {
            reject(new Error('Failed to get IAM token: ' + data));
          }
        } catch (error) {
          reject(new Error('Failed to parse IAM response: ' + error.message));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error('IAM token request failed: ' + error.message));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Fetch VPC snapshot pricing from Global Catalog
 * @param {string} token - IAM access token
 * @returns {Promise<Object>} Pricing data
 */
function fetchGlobalCatalogPricing(token) {
  return new Promise((resolve, reject) => {
    // Search for VPC snapshot service in Global Catalog
    const options = {
      hostname: 'globalcatalog.cloud.ibm.com',
      port: 443,
      path: '/api/v1?q=name:snapshot*+active:true&include=*',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          const pricingData = parseGlobalCatalogResponse(response);
          resolve(pricingData);
        } catch (error) {
          reject(new Error('Failed to parse pricing data: ' + error.message));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error('Pricing request failed: ' + error.message));
    });

    req.end();
  });
}

/**
 * Parse Global Catalog response and extract VPC snapshot pricing
 * @param {Object} response - Global Catalog API response
 * @returns {Object} Structured pricing data by region
 */
function parseGlobalCatalogResponse(response) {
  const pricingData = {
    lastUpdated: new Date().toISOString(),
    source: 'IBM Cloud Global Catalog API',
    regions: {}
  };

  // Default pricing structure (fallback if API doesn't return expected data)
  const defaultRegions = {
    'us-south': { name: 'US South (Dallas)', pricePerGB: 0.05, currency: 'USD' },
    'us-east': { name: 'US East (Washington DC)', pricePerGB: 0.05, currency: 'USD' },
    'eu-gb': { name: 'United Kingdom (London)', pricePerGB: 0.055, currency: 'USD' },
    'eu-de': { name: 'Germany (Frankfurt)', pricePerGB: 0.055, currency: 'USD' },
    'jp-tok': { name: 'Japan (Tokyo)', pricePerGB: 0.06, currency: 'USD' },
    'jp-osa': { name: 'Japan (Osaka)', pricePerGB: 0.06, currency: 'USD' },
    'au-syd': { name: 'Australia (Sydney)', pricePerGB: 0.06, currency: 'USD' },
    'ca-tor': { name: 'Canada (Toronto)', pricePerGB: 0.05, currency: 'USD' },
    'br-sao': { name: 'Brazil (São Paulo)', pricePerGB: 0.07, currency: 'USD' }
  };

  try {
    // Parse the response to extract snapshot pricing
    if (response.resources && Array.isArray(response.resources)) {
      // Look for VPC snapshot service
      const snapshotService = response.resources.find(resource => 
        resource.name && resource.name.toLowerCase().includes('snapshot')
      );

      if (snapshotService && snapshotService.pricing) {
        // Extract pricing by region from the service
        Object.keys(snapshotService.pricing).forEach(region => {
          const pricing = snapshotService.pricing[region];
          if (pricing && pricing.metrics) {
            // Find storage pricing metric
            const storageMetric = pricing.metrics.find(m => 
              m.metric_id && m.metric_id.includes('storage')
            );
            
            if (storageMetric && storageMetric.amounts) {
              const price = storageMetric.amounts[0]?.price || defaultRegions[region]?.pricePerGB || 0.05;
              pricingData.regions[region] = {
                name: defaultRegions[region]?.name || region,
                pricePerGB: parseFloat(price),
                currency: storageMetric.amounts[0]?.currency || 'USD'
              };
            }
          }
        });
      }
    }

    // If no pricing data was extracted, use defaults
    if (Object.keys(pricingData.regions).length === 0) {
      console.log('Using default pricing data (API did not return expected format)');
      pricingData.regions = defaultRegions;
    }
  } catch (error) {
    console.error('Error parsing pricing data, using defaults:', error.message);
    pricingData.regions = defaultRegions;
  }

  return pricingData;
}

/**
 * Get fallback pricing data (used when API is unavailable)
 * @returns {Object} Static pricing data
 */
export function getFallbackPricing() {
  return {
    lastUpdated: new Date().toISOString(),
    source: 'Static fallback data',
    regions: {
      'us-south': { name: 'US South (Dallas)', pricePerGB: 0.05, currency: 'USD' },
      'us-east': { name: 'US East (Washington DC)', pricePerGB: 0.05, currency: 'USD' },
      'eu-gb': { name: 'United Kingdom (London)', pricePerGB: 0.055, currency: 'USD' },
      'eu-de': { name: 'Germany (Frankfurt)', pricePerGB: 0.055, currency: 'USD' },
      'jp-tok': { name: 'Japan (Tokyo)', pricePerGB: 0.06, currency: 'USD' },
      'jp-osa': { name: 'Japan (Osaka)', pricePerGB: 0.06, currency: 'USD' },
      'au-syd': { name: 'Australia (Sydney)', pricePerGB: 0.06, currency: 'USD' },
      'ca-tor': { name: 'Canada (Toronto)', pricePerGB: 0.05, currency: 'USD' },
      'br-sao': { name: 'Brazil (São Paulo)', pricePerGB: 0.07, currency: 'USD' }
    }
  };
}

// Made with Bob
