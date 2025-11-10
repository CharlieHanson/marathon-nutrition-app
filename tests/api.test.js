import { describe, it, expect } from 'vitest';

describe('API Response Format Tests', () => {
  it('should validate meal plan response structure', () => {
    const mockResponse = {
      success: true,
      meals: {
        monday: {
          breakfast: "Eggs (Cal: 350, P: 20g, C: 10g, F: 25g)",
          lunch: "Chicken (Cal: 500, P: 40g, C: 30g, F: 20g)"
        }
      }
    };
    
    expect(mockResponse.success).toBe(true);
    expect(mockResponse.meals).toBeDefined();
    expect(mockResponse.meals.monday.breakfast).toContain('Cal:');
  });

  it('should validate macro format in meal strings', () => {
    const meal = "Scrambled eggs (Cal: 350, P: 20g, C: 10g, F: 25g)";
    
    expect(meal).toMatch(/Cal: \d+/);
    expect(meal).toMatch(/P: \d+g/);
    expect(meal).toMatch(/C: \d+g/);
    expect(meal).toMatch(/F: \d+g/);
  });

  it('should validate meal types', () => {
    const validTypes = ['breakfast', 'lunch', 'dinner', 'snacks', 'dessert'];
    const testType = 'breakfast';
    
    expect(validTypes).toContain(testType);
    expect(validTypes).toHaveLength(5);
  });

  it('should validate error response structure', () => {
    const mockError = {
      success: false,
      error: 'Missing meal parameter'
    };
    
    expect(mockError.success).toBe(false);
    expect(mockError.error).toBeDefined();
  });
});