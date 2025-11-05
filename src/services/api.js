// Centralized API calls
export const apiClient = {
  async generateMeals(data) {
    const response = await fetch('/api/generate-meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async regenerateMeal(data) {
    const response = await fetch('/api/regenerate-meal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async getRecipe(data) {
    const response = await fetch('/api/get-recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async generateGroceryList(data) {
    const response = await fetch('/api/generate-grocery-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async validateNutrition(mealData) {
    const response = await fetch('/api/validate-nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mealData),
    });
    return response.json();
  },
};