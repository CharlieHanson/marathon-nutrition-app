import pytest
import pandas as pd
import numpy as np

def test_training_data_exists():
    """Test that all training datasets exist"""
    meal_types = ['breakfast', 'lunch', 'dinner', 'snacks', 'desserts']
    
    for meal_type in meal_types:
        df = pd.read_csv(f'{meal_type}/data/training_data.csv')
        assert len(df) >= 500, f"{meal_type} has too few training samples"

def test_no_null_values():
    """Test that training data has no null values"""
    df = pd.read_csv('breakfast/data/training_data.csv')
    
    assert df['description'].notna().all(), "Found null descriptions"
    assert df['calories'].notna().all(), "Found null calories"
    assert df['protein'].notna().all(), "Found null protein"
    assert df['carbs'].notna().all(), "Found null carbs"
    assert df['fat'].notna().all(), "Found null fat"

def test_macro_ranges_valid():
    """Test that macros are in reasonable ranges"""
    df = pd.read_csv('breakfast/data/training_data.csv')
    
    # All should be non-negative
    assert (df['calories'] >= 0).all(), "Found negative calories"
    assert (df['protein'] >= 0).all(), "Found negative protein"
    assert (df['carbs'] >= 0).all(), "Found negative carbs"
    assert (df['fat'] >= 0).all(), "Found negative fat"
    
    # Breakfast shouldn't exceed reasonable limits
    assert (df['calories'] <= 1000).all(), "Found unreasonably high calories"

def test_macro_consistency():
    """Test that macro-derived calories match listed calories"""
    df = pd.read_csv('breakfast/data/training_data.csv')
    
    # Calculate calories from macros (4 cal/g protein, 4 cal/g carbs, 9 cal/g fat)
    calculated_cal = 4*df['protein'] + 4*df['carbs'] + 9*df['fat']
    
    # Should be within 25% of listed calories
    ratio = calculated_cal / df['calories']
    
    assert (ratio >= 0.75).all() and (ratio <= 1.25).all(), \
           "Found inconsistent macro-calorie calculations"