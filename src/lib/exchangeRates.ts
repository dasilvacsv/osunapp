import axios from 'axios';

// API endpoint for Venezuelan exchange rates
const EXCHANGE_RATE_API = 'https://pydolarve.org/api/v1/dollar?page=alcambio&format_date=default&rounded_price=false';

interface RateInfo {
    rate: number;
    lastUpdate: string;
    isError?: boolean;
}

// Cache for BCV rate to avoid frequent API calls
let bcvRateCache: RateInfo | null = null;
let lastFetchTime: number | null = null;
const CACHE_DURATION_MS = 3600000; // 1 hour
const FALLBACK_RATE = 36.42; // Fallback rate in case API fails

/**
 * Fetches the current BCV exchange rate
 */
export async function fetchBCVRate() {
    try {
        console.log('Fetching BCV exchange rate...');
        
        const response = await axios.get(EXCHANGE_RATE_API, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Extract just the BCV rate from the API response
        const bcvRate = response.data.monitors.bcv.price;
        const lastUpdate = response.data.monitors.bcv.last_update;
        
        console.log(`Successfully fetched BCV rate: ${bcvRate}`);
        return {
            rate: bcvRate,
            lastUpdate: lastUpdate || new Date().toISOString()
        };
    } catch (error) {
        console.error('Error fetching BCV rate:', error);
        // Return fallback rate if API fails
        return {
            rate: FALLBACK_RATE,
            lastUpdate: 'No disponible',
            isError: true
        };
    }
}

/**
 * Get BCV rate with caching to avoid excessive API calls
 */
export async function getBCVRate() {
    const now = Date.now();
    
    // If cache is valid, return cached rate
    if (bcvRateCache && lastFetchTime && (now - lastFetchTime < CACHE_DURATION_MS)) {
        console.log('Using cached BCV rate:', bcvRateCache.rate);
        return bcvRateCache;
    }
    
    // Fetch new rate
    console.log('Fetching fresh BCV rate');
    const rateInfo = await fetchBCVRate();
    
    // Update cache
    bcvRateCache = rateInfo;
    lastFetchTime = now;
    
    return rateInfo;
}

/**
 * Formats a USD amount to VES using the current BCV rate
 */
export async function formatUsdToVes(usdAmount: number) {
    try {
        // Get the current BCV rate
        const rateInfo = await getBCVRate();
        const bcvRate = rateInfo.rate;
        
        // Calculate amount in VES
        const vesAmount = usdAmount * bcvRate;
        
        // Format with thousand separators and 2 decimal places
        const formattedVES = new Intl.NumberFormat('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(vesAmount);
        
        return {
            rate: bcvRate,
            vesAmount: vesAmount,
            formattedVES: formattedVES,
            lastUpdate: rateInfo.lastUpdate
        };
    } catch (error) {
        console.error('Error formatting USD to VES:', error);
        
        // Use fallback rate if error occurs
        const vesAmount = usdAmount * FALLBACK_RATE;
        const formattedVES = new Intl.NumberFormat('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(vesAmount);
        
        return {
            rate: FALLBACK_RATE,
            vesAmount: vesAmount,
            formattedVES: formattedVES,
            lastUpdate: 'No disponible'
        };
    }
} 