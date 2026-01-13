// Centralized API calls with platform-aware base URL
// - Web: uses relative paths (e.g., '/api/generate-meals')
// - React Native: uses full production URL (e.g., 'https://alimenta-nutrition.vercel.app/api/generate-meals')

// Platform detection: Check if we're in a React Native environment
function isReactNative() {
  // Method 1: Check navigator.product (most reliable for React Native)
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return true;
  }
  
  // Method 2: Check for React Native Platform module
  try {
    if (typeof require !== 'undefined') {
      const rn = require('react-native');
      if (rn?.Platform && (rn.Platform.OS === 'ios' || rn.Platform.OS === 'android')) {
        return true;
      }
    }
  } catch (e) {
    // react-native not available, we're on web
  }
  
  return false;
}

// Get the base URL based on platform
function getBaseUrl() {
  if (isReactNative()) {
    // React Native: use environment variable or default to production URL
    const apiUrl = 
      process.env.EXPO_PUBLIC_API_URL || 
      process.env.REACT_NATIVE_API_URL || 
      'https://alimenta-nutrition.vercel.app';
    return apiUrl;
  } else {
    // Web: use empty string for relative paths
    return '';
  }
}

const BASE_URL = getBaseUrl();

// Helper function to build the full API endpoint URL
function getApiUrl(endpoint) {
  // Remove leading slash from endpoint if present (we'll add it)
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${BASE_URL}${cleanEndpoint}`;
}

// Stream SSE using XMLHttpRequest (works in React Native)
function streamSSE(url, data, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let buffer = '';
    let lastProcessedIndex = 0;
    let currentEvent = null; // Moved outside onprogress so it persists between chunks
    let finalResult = { success: false, week: {}, weekStarting: data.weekStarting };

    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    // Process chunks as they arrive
    xhr.onprogress = () => {
      const newData = xhr.responseText.substring(lastProcessedIndex);
      lastProcessedIndex = xhr.responseText.length;
      buffer += newData;

      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        if (trimmedLine.startsWith('event: ')) {
          currentEvent = trimmedLine.substring(7).trim();
        } else if (trimmedLine.startsWith('data: ')) {
          const dataStr = trimmedLine.substring(6);
          try {
            const payload = JSON.parse(dataStr);

            if (currentEvent === 'status' && payload.message) {
              if (onProgress) onProgress({ type: 'status', message: payload.message });
            } else if (currentEvent === 'day' && payload.day && payload.meals) {
              finalResult.week[payload.day] = { ...finalResult.week[payload.day], ...payload.meals };
              if (onProgress) onProgress({ type: 'day', day: payload.day, meals: payload.meals, skipped: payload.skipped });
            } else if (currentEvent === 'done') {
              finalResult.success = payload.success;
              finalResult.weekStarting = payload.weekStarting || data.weekStarting;
              if (onProgress) onProgress({ type: 'done', success: payload.success });
            } else if (currentEvent === 'error') {
              if (onProgress) onProgress({ type: 'error', message: payload.message });
            }
          } catch (e) {
            // Ignore parse errors (e.g., keepalive comments)
          }
          currentEvent = null;
        }
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(finalResult);
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network request failed'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Request timed out'));
    };

    // Set a reasonable timeout (meal generation can take a while)
    xhr.timeout = 120000; // 2 minutes

    xhr.send(JSON.stringify(data));
  });
}

// Stream SSE for day-based generation (handles 'meal' events instead of 'day' events)
function streamSSEDay(url, data, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let buffer = '';
    let lastProcessedIndex = 0;
    let currentEvent = null;
    let finalResult = { success: false, day: data.day, meals: {} };

    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    // Process chunks as they arrive
    xhr.onprogress = () => {
      const newData = xhr.responseText.substring(lastProcessedIndex);
      lastProcessedIndex = xhr.responseText.length;
      buffer += newData;

      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        if (trimmedLine.startsWith('event: ')) {
          currentEvent = trimmedLine.substring(7).trim();
        } else if (trimmedLine.startsWith('data: ')) {
          const dataStr = trimmedLine.substring(6);
          try {
            const payload = JSON.parse(dataStr);

            if (currentEvent === 'status' && payload.message) {
              if (onProgress) onProgress({ type: 'status', message: payload.message });
            } else if (currentEvent === 'meal' && payload.mealType && payload.meal) {
              finalResult.meals[payload.mealType] = payload.meal;
              if (onProgress) onProgress({ type: 'meal', mealType: payload.mealType, meal: payload.meal, day: payload.day });
            } else if (currentEvent === 'done') {
              finalResult.success = payload.success;
              if (payload.meals) {
                finalResult.meals = { ...finalResult.meals, ...payload.meals };
              }
              if (onProgress) onProgress({ type: 'done', success: payload.success, day: payload.day });
            } else if (currentEvent === 'error') {
              if (onProgress) onProgress({ type: 'error', message: payload.message });
            }
          } catch (e) {
            // Ignore parse errors (e.g., keepalive comments)
          }
          currentEvent = null;
        }
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(finalResult);
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network request failed'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Request timed out'));
    };

    // Set a reasonable timeout (meal generation can take a while)
    xhr.timeout = 120000; // 2 minutes

    xhr.send(JSON.stringify(data));
  });
}

export const apiClient = {
  async generateMeals(data, onProgress) {
    try {
      // Use XMLHttpRequest for streaming in React Native
      if (isReactNative()) {
        return await streamSSE(getApiUrl('/api/generate-meals'), data, onProgress);
      }

      // Web: use fetch with getReader (original behavior)
      const response = await fetch(getApiUrl('/api/generate-meals'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      // Check if response is SSE (text/event-stream)
      const contentType = response.headers.get('content-type') || '';
      
      // Web streaming with getReader
      if (response.body && response.body.getReader) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let week = {};

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent = null;

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              try {
                const payload = JSON.parse(line.slice(6));

                if (currentEvent === 'status' && payload.message) {
                  if (onProgress) onProgress({ type: 'status', message: payload.message });
                } else if (currentEvent === 'day' && payload.day && payload.meals) {
                  week[payload.day] = { ...week[payload.day], ...payload.meals };
                  if (onProgress) onProgress({ type: 'day', day: payload.day, meals: payload.meals });
                } else if (currentEvent === 'done') {
                  if (onProgress) onProgress({ type: 'done', success: payload.success });
                  return { success: payload.success, week, weekStarting: payload.weekStarting || data.weekStarting };
                } else if (currentEvent === 'error') {
                  throw new Error(payload.message || 'Unknown error');
                }
              } catch (e) {
                // Ignore parse errors
              }
              currentEvent = null;
            }
          }
        }

        return { success: true, week, weekStarting: data.weekStarting };
      }

      // Fallback: read as text
      const text = await response.text();
      
      if (contentType.includes('text/event-stream') || text.includes('event:') || text.includes('data:')) {
        return parseSSEText(text, onProgress, data.weekStarting);
      }
      
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error(text || 'Failed to generate meals');
      }
    } catch (error) {
      console.error('generateMeals error:', error);
      return { success: false, error: error.message || 'Failed to generate meals' };
    }
  },

  async regenerateMeal(data) {
    const response = await fetch(getApiUrl('/api/regenerate-meal'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async generateDay(data, onProgress) {
    try {
      // Use XMLHttpRequest for streaming in React Native
      if (isReactNative()) {
        return await streamSSEDay(getApiUrl('/api/generate-day'), data, onProgress);
      }

      // Web: use fetch with getReader
      const response = await fetch(getApiUrl('/api/generate-day'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      // Check if response is SSE (text/event-stream)
      const contentType = response.headers.get('content-type') || '';
      
      // Web streaming with getReader
      if (response.body && response.body.getReader) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let meals = {};

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent = null;

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              try {
                const payload = JSON.parse(line.slice(6));

                if (currentEvent === 'status' && payload.message) {
                  if (onProgress) onProgress({ type: 'status', message: payload.message });
                } else if (currentEvent === 'meal' && payload.mealType && payload.meal) {
                  meals[payload.mealType] = payload.meal;
                  if (onProgress) onProgress({ type: 'meal', mealType: payload.mealType, meal: payload.meal, day: payload.day });
                } else if (currentEvent === 'done') {
                  if (payload.meals) {
                    meals = { ...meals, ...payload.meals };
                  }
                  if (onProgress) onProgress({ type: 'done', success: payload.success, day: payload.day });
                  return { success: payload.success, day: payload.day || data.day, meals };
                } else if (currentEvent === 'error') {
                  throw new Error(payload.message || 'Unknown error');
                }
              } catch (e) {
                // Ignore parse errors
              }
              currentEvent = null;
            }
          }
        }

        return { success: true, day: data.day, meals };
      }

      // Fallback: read as text
      const text = await response.text();
      
      if (contentType.includes('text/event-stream') || text.includes('event:') || text.includes('data:')) {
        return parseSSETextDay(text, onProgress, data.day);
      }
      
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error(text || 'Failed to generate day');
      }
    } catch (error) {
      console.error('generateDay error:', error);
      return { success: false, error: error.message || 'Failed to generate day' };
    }
  },

  async generateSingleMeal(data) {
    try {
      const response = await fetch(getApiUrl('/api/generate-single-meal'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${response.status}: ${response.statusText}` };
        }
        return { success: false, ...errorData };
      }

      const text = await response.text();
      if (!text || text.trim().length === 0) {
        return { success: false, error: 'Empty response from server' };
      }

      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('JSON parse error:', e, 'Response text:', text);
        return { success: false, error: 'Invalid JSON response from server' };
      }
    } catch (error) {
      console.error('generateSingleMeal fetch error:', error);
      return { success: false, error: error.message || 'Network error' };
    }
  },

  async getRecipe(data) {
    const response = await fetch(getApiUrl('/api/get-recipe'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async deleteAccount(data) {
    try {
      const response = await fetch(getApiUrl('/api/delete-account'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      // Check if response is OK
      if (!response.ok) {
        // Try to parse error response
        let errorMessage = 'Failed to delete account';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        return { success: false, error: errorMessage };
      }

      // Check if there's content to parse
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        if (text.trim()) {
          return JSON.parse(text);
        }
      }

      // If no JSON content, return success
      return { success: true };
    } catch (error) {
      console.error('deleteAccount error:', error);
      return { 
        success: false, 
        error: error.message || 'An error occurred while deleting your account' 
      };
    }
  },

  async estimateMacros(data) {
    try {
      const response = await fetch(getApiUrl('/api/estimate-macros'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${response.status}: ${response.statusText}` };
        }
        return { success: false, ...errorData };
      }

      const text = await response.text();
      if (!text || text.trim().length === 0) {
        return { success: false, error: 'Empty response from server' };
      }

      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('JSON parse error:', e, 'Response text:', text);
        return { success: false, error: 'Invalid JSON response from server' };
      }
    } catch (error) {
      console.error('estimateMacros fetch error:', error);
      return { success: false, error: error.message || 'Network error' };
    }
  },

  async generateGroceryList(data) {
    const response = await fetch(getApiUrl('/api/generate-grocery-list'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async generateMealPrep(data) {
    const response = await fetch(getApiUrl('/api/generate-meal-prep'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async validateNutrition(mealData) {
    const response = await fetch(getApiUrl('/api/validate-nutrition'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mealData),
    });
    return response.json();
  },
};

// Helper function to parse SSE text response (fallback)
function parseSSEText(text, onProgress, weekStarting) {
  const lines = text.split('\n');
  let week = {};
  let currentEvent = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('event: ')) {
      currentEvent = line.substring(7).trim();
    } else if (line.startsWith('data: ')) {
      const dataStr = line.substring(6);
      try {
        const payload = JSON.parse(dataStr);
        
        if (currentEvent === 'status' && payload.message) {
          if (onProgress) onProgress({ type: 'status', message: payload.message });
        } else if (currentEvent === 'day' && payload.day && payload.meals) {
          week[payload.day] = { ...week[payload.day], ...payload.meals };
          if (onProgress) onProgress({ type: 'day', day: payload.day, meals: payload.meals });
        } else if (currentEvent === 'done') {
          if (onProgress) onProgress({ type: 'done', success: payload.success });
          return { success: payload.success, week, weekStarting: payload.weekStarting || weekStarting };
        } else if (currentEvent === 'error') {
          throw new Error(payload.message || 'Unknown error');
        }
      } catch (e) {
        console.error('Error parsing SSE data:', e, dataStr);
      }
      currentEvent = null;
    }
  }

  return { success: true, week, weekStarting };
}

// Helper function to parse SSE text response for day-based generation (fallback)
function parseSSETextDay(text, onProgress, day) {
  const lines = text.split('\n');
  let meals = {};
  let currentEvent = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('event: ')) {
      currentEvent = line.substring(7).trim();
    } else if (line.startsWith('data: ')) {
      const dataStr = line.substring(6);
      try {
        const payload = JSON.parse(dataStr);
        
        if (currentEvent === 'status' && payload.message) {
          if (onProgress) onProgress({ type: 'status', message: payload.message });
        } else if (currentEvent === 'meal' && payload.mealType && payload.meal) {
          meals[payload.mealType] = payload.meal;
          if (onProgress) onProgress({ type: 'meal', mealType: payload.mealType, meal: payload.meal, day: payload.day });
        } else if (currentEvent === 'done') {
          if (payload.meals) {
            meals = { ...meals, ...payload.meals };
          }
          if (onProgress) onProgress({ type: 'done', success: payload.success, day: payload.day });
          return { success: payload.success, day: payload.day || day, meals };
        } else if (currentEvent === 'error') {
          throw new Error(payload.message || 'Unknown error');
        }
      } catch (e) {
        console.error('Error parsing SSE data:', e, dataStr);
      }
      currentEvent = null;
    }
  }

  return { success: true, day, meals };
}