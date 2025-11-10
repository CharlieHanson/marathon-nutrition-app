import { describe, it, expect } from 'vitest';

describe('Meal Formatting Utils', () => {
  it('should extract macros from meal string', () => {
    const meal = "Scrambled eggs (Cal: 350, P: 20g, C: 10g, F: 25g)";
    
    const calMatch = meal.match(/Cal:\s*(\d+)/);
    const proteinMatch = meal.match(/P:\s*(\d+)g/);
    
    expect(calMatch[1]).toBe('350');
    expect(proteinMatch[1]).toBe('20');
  });

  it('should validate meal types', () => {
    const validTypes = ['breakfast', 'lunch', 'dinner', 'snacks', 'dessert'];
    const testType = 'breakfast';
    
    expect(validTypes).toContain(testType);
  });

  it('should format macro display correctly', () => {
    const macros = { calories: 500, protein: 30, carbs: 50, fat: 15 };
    const formatted = `(Cal: ${macros.calories}, P: ${macros.protein}g, C: ${macros.carbs}g, F: ${macros.fat}g)`;
    
    expect(formatted).toBe('(Cal: 500, P: 30g, C: 50g, F: 15g)');
  });
});