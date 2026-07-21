# Manual Testing Guide - Alimenta Nutrition App

This document provides comprehensive manual test cases for both the mobile app and web app to simulate complete user flows. Test all scenarios to ensure the app works correctly across all features.

---

## Table of Contents

1. [Mobile App Testing](#mobile-app-testing)
2. [Web App Testing](#web-app-testing)
3. [Cross-Platform Testing](#cross-platform-testing)
4. [Error Scenarios](#error-scenarios)

---

## Mobile App Testing

### 1. Authentication Flow

#### 1.1 Sign Up Flow
- [ ] Open the app (should show login screen if not authenticated)
- [ ] Tap "Sign Up" link
- [ ] **Test validation errors:**
  - [ ] Try submitting without name → Should show "Please enter your name"
  - [ ] Try submitting without email → Should show "Please enter your email"
  - [ ] Try submitting invalid email (e.g., "test@") → Should show "Please enter a valid email address"
  - [ ] Try submitting password less than 6 characters → Should show "Password must be at least 6 characters long"
  - [ ] Try submitting without password → Should show "Please enter your password"
- [ ] **Test successful signup:**
  - [ ] Enter valid name, email, and password (6+ characters)
  - [ ] Tap "Sign Up" button
  - [ ] Should show loading state ("Creating account...")
  - [ ] Should show success screen with checkmark icon
  - [ ] Should display "Check Your Email" message with the email you entered
  - [ ] Tap "Back to Login" → Should navigate to login screen
- [ ] **Test duplicate email:**
  - [ ] Try signing up with an existing email
  - [ ] Should show "An account with this email already exists. Please log in instead."

#### 1.2 Google Sign In
- [ ] On login screen, tap "Continue with Google" button
- [ ] Should show Google authentication prompt
- [ ] Complete Google authentication
- [ ] Should redirect to onboarding or dashboard (depending on if profile exists)
- [ ] **Test on signup screen:**
  - [ ] Navigate to signup screen
  - [ ] Tap "Continue with Google"
  - [ ] Should authenticate and redirect appropriately

#### 1.3 Login Flow
- [ ] On login screen, enter email and password
- [ ] **Test validation errors:**
  - [ ] Try submitting without email → Should show "Please enter your email"
  - [ ] Try submitting without password → Should show "Please enter your password"
  - [ ] Try submitting invalid email → Should show "Please enter a valid email address"
  - [ ] Try submitting wrong credentials → Should show error message
- [ ] **Test successful login:**
  - [ ] Enter correct email and password
  - [ ] Tap "Sign In" button
  - [ ] Should show loading state ("Please wait...")
  - [ ] Should redirect to dashboard or onboarding (if first time)
- [ ] **Test "Forgot password" link:**
  - [ ] Tap "Forgot password?" link
  - [ ] Should open Forgot Password modal
  - [ ] Enter email address
  - [ ] Tap "Send Reset Link"
  - [ ] Should show success message
  - [ ] Close modal

#### 1.4 Onboarding Flow (First-Time Users)
- [ ] After signup/login, should see Welcome step
- [ ] **Welcome Step:**
  - [ ] Read welcome message
  - [ ] Tap "Get Started" button → Should advance to Profile step
- [ ] **Profile Step:**
  - [ ] Progress indicator should show "Step 2 of 3"
  - [ ] Fill in all fields:
    - [ ] Name (text input)
    - [ ] Age (numeric input)
    - [ ] Gender (tap to open picker, select option)
    - [ ] Height (enter feet and inches OR meters, tap unit button to switch)
    - [ ] Weight (enter value, tap unit button to switch between lbs/kg)
    - [ ] Weight Goal (tap to open picker: lose/maintain/gain)
    - [ ] Activity Level (tap to open picker: low/moderate/high)
    - [ ] Training Objective (multiline text)
    - [ ] Dietary Restrictions (multiline text)
  - [ ] **Test validation:**
    - [ ] Try tapping "Next" without filling required fields
    - [ ] Should show error or prevent submission
  - [ ] Tap "Back" → Should return to Welcome step
  - [ ] Fill in all fields and tap "Next"
  - [ ] Should show loading state
  - [ ] Should save profile and advance to Preferences step
- [ ] **Preferences Step:**
  - [ ] Progress indicator should show "Step 3 of 3"
  - [ ] Enter foods you like (comma-separated)
  - [ ] Enter foods you dislike (comma-separated)
  - [ ] Enter favorite cuisines (comma-separated)
  - [ ] Tap "Back" → Should return to Profile step
  - [ ] Tap "Complete"
  - [ ] Should show loading state
  - [ ] Should save preferences and redirect to Dashboard

### 2. Dashboard Screen

#### 2.1 Initial State
- [ ] Navigate to Dashboard tab
- [ ] Should show "Today" with current date
- [ ] Should show "On Track" status pill
- [ ] **Today's Nutrition tile:**
  - [ ] Should show calories (or "—" if no meals)
  - [ ] Should show macros: Protein, Carbs, Fat (or "—" if no meals)
  - [ ] If meals exist for today:
    - [ ] Should show progress bar
    - [ ] Should show "Eaten" and "Remaining" calories
    - [ ] Should show 5 meal checkboxes (one for each meal type)
    - [ ] Completed meals should have green checkmark
- [ ] **Today's Training tile:**
  - [ ] Should show workout for today (or "No training plan yet" or "Rest")
  - [ ] If workout exists:
    - [ ] Should show workout type
    - [ ] Should show distance/duration
    - [ ] Should show intensity badge
    - [ ] Should show notes (if any)
- [ ] **This Week tile:**
  - [ ] Should show "X/35 meals filled" (where X is number of filled meals)
- [ ] **Next Action tile:**
  - [ ] Should show appropriate action based on state:
    - [ ] "Create training plan" if no training plan
    - [ ] "Generate meal plan" if no meals
    - [ ] "Finish meal plan" if partial meals
    - [ ] "View grocery list" if all meals filled

#### 2.2 Interactions
- [ ] Tap "Today's Nutrition" tile → Should navigate to Meals screen
- [ ] Tap "Today's Training" tile → Should navigate to Training screen
- [ ] Tap "This Week" tile → Should navigate to Meals screen
- [ ] **Tap "Next Action" tile:**
  - [ ] If "Create training plan" → Navigate to Training screen
  - [ ] If "Generate meal plan" → Should start generating meals for today
  - [ ] If "View grocery list" → Should show loading, then open Grocery List modal
- [ ] **Test Grocery List modal:**
  - [ ] Should show categorized grocery items
  - [ ] Tap share icon → Should open share sheet
  - [ ] Tap close icon → Should close modal

### 3. Meals Screen

#### 3.1 Header and Navigation
- [ ] Should show collapsible header with:
  - [ ] Week navigation (< Week of [date] >)
  - [ ] Quick action buttons (Analytics, Grocery List, Meal Prep, Log Meal)
  - [ ] Day selector pills (Mon-Sun)
  - [ ] Macros summary (when expanded)
- [ ] **Test week navigation:**
  - [ ] Tap "<" button → Should load previous week
  - [ ] Tap ">" button → Should load next week
  - [ ] Tap "Week of [date]" → Should jump to current week
- [ ] **Test day selector:**
  - [ ] Tap each day pill → Should show meals for that day
  - [ ] Today's day should have special styling
- [ ] **Test scroll behavior:**
  - [ ] Scroll down → Header should collapse
  - [ ] Scroll up → Header should expand

#### 3.2 Quick Actions
- [ ] **Analytics button:**
  - [ ] Tap Analytics icon
  - [ ] Should open Analytics modal
  - [ ] Should show weekly macro breakdown
  - [ ] Close modal
- [ ] **Grocery List button:**
  - [ ] Tap Grocery List icon
  - [ ] Should show loading state
  - [ ] Should generate and display grocery list
  - [ ] Test share functionality
  - [ ] Close modal
- [ ] **Meal Prep button:**
  - [ ] Tap Meal Prep icon
  - [ ] Should open Meal Prep modal
  - [ ] Enter meal details (name, description, macros)
  - [ ] Select days and meal types
  - [ ] Tap "Apply to Selected Meals"
  - [ ] Should populate selected meal slots
  - [ ] Close modal
- [ ] **Log Meal button:**
  - [ ] Tap Log Meal icon
  - [ ] Should open Log Meal modal
  - [ ] Enter meal details
  - [ ] Select day and meal type
  - [ ] Tap "Log Meal"
  - [ ] Should add meal to selected slot
  - [ ] Close modal

#### 3.3 Meal Cards
- [ ] Should show 5 meal cards: Breakfast, Lunch, Dinner, Snack 1, Snack 2
- [ ] **Empty meal card:**
  - [ ] Should show "+" icon
  - [ ] Should show "Add [Meal Type]" text
  - [ ] Tap empty card → Should show action sheet:
    - [ ] "Generate with AI" option
    - [ ] "Log Meal" option
    - [ ] "Meal Prep" option
    - [ ] "Cancel" option
  - [ ] Select "Generate with AI" → Should generate meal
  - [ ] Select "Log Meal" → Should open Log Meal modal
  - [ ] Select "Meal Prep" → Should open Meal Prep modal
- [ ] **Filled meal card:**
  - [ ] Should show meal name
  - [ ] Should show calories and macros
  - [ ] Should show star rating (if rated)
  - [ ] If today: Should show checkbox
  - [ ] Tap checkbox → Should toggle completion status
  - [ ] Tap meal card → Should open Meal Options bottom sheet
- [ ] **Meal Options bottom sheet:**
  - [ ] Should show meal name
  - [ ] Should show star rating (tap stars to rate)
  - [ ] "Get Recipe" button → Should open Servings Picker modal
  - [ ] "Save Meal" button → Should save meal to favorites
  - [ ] "Regenerate" button → Should open Regenerate Reason modal
  - [ ] Close button → Should close bottom sheet
- [ ] **Servings Picker modal:**
  - [ ] Should show meal name
  - [ ] Should show servings input (default: 1)
  - [ ] Tap +/- buttons → Should adjust servings
  - [ ] Tap "Get Recipe" → Should generate recipe
  - [ ] Should open Recipe modal with loading state
  - [ ] Should display recipe when loaded
  - [ ] Tap share icon → Should open share sheet
  - [ ] Close modal
- [ ] **Regenerate Reason modal:**
  - [ ] Should show text input for reason
  - [ ] Enter reason (e.g., "Don't like chicken")
  - [ ] Tap "Regenerate" → Should regenerate meal
  - [ ] Close modal
- [ ] **Delete meal:**
  - [ ] Swipe meal card left (or long press)
  - [ ] Tap delete icon
  - [ ] Should show confirmation alert
  - [ ] Tap "Delete" → Should remove meal
  - [ ] Tap "Cancel" → Should keep meal

#### 3.4 Generate Meals (FAB)
- [ ] **When day has empty meals:**
  - [ ] Should show floating action button (FAB) with "+" icon
  - [ ] Should show label "Generate Meals" or "Generate Remaining"
  - [ ] Tap FAB → Should generate meals for selected day
  - [ ] Should show status banner with progress
- [ ] **When day is full:**
  - [ ] FAB should be hidden
  - [ ] Tap day header → Should show action sheet:
    - [ ] "Regenerate Day" option
    - [ ] "Clear Day" option
    - [ ] "Cancel" option
  - [ ] Select "Regenerate Day" → Should clear and regenerate all meals
  - [ ] Select "Clear Day" → Should show confirmation, then clear all meals

#### 3.5 Meal Completion (Today Only)
- [ ] Select today's day
- [ ] Each meal card should show checkbox
- [ ] Tap checkbox → Should mark meal as completed
- [ ] Progress bar should update
- [ ] "Eaten" calories should increase
- [ ] Meal checkbox in dashboard should update
- [ ] **Complete all 5 meals:**
  - [ ] Mark all 5 meals as completed
  - [ ] Should show celebration alert: "🎉 Congratulations! You've completed all 5 meals for today!"
  - [ ] Tap "Awesome!" → Should close alert

### 4. Training Screen

#### 4.1 Header
- [ ] Should show current plan name (or "New Training Plan")
- [ ] Should show "Active" badge if plan is saved
- [ ] **Action buttons:**
  - [ ] "New" button → Should create new blank plan
  - [ ] "Load" button → Should open Load Plan modal
  - [ ] "Save" button → Should open Save Plan modal

#### 4.2 Day Cards
- [ ] Should show 7 day cards (Monday-Sunday)
- [ ] **Collapsed day card:**
  - [ ] Should show day name
  - [ ] Should show chevron icon (forward)
  - [ ] Should show workout count badge (if workouts exist)
  - [ ] Should show "Add" button
  - [ ] Tap day header → Should expand day
  - [ ] Tap "Add" button → Should add workout to that day
- [ ] **Expanded day card:**
  - [ ] Should show chevron down icon
  - [ ] Should show workout form(s)
  - [ ] Tap day header → Should collapse day
- [ ] **Current day:**
  - [ ] Should be expanded by default on first load

#### 4.3 Workout Form
- [ ] **Workout Type field:**
  - [ ] Tap field → Should open picker modal
  - [ ] Should show options: Rest, Distance Run, Speed or Agility Training, Bike Ride, Walk/Hike, Swim, Strength Training, Sport Practice
  - [ ] Select option → Should update field and show icon
- [ ] **Distance/Duration field:**
  - [ ] Should be text input
  - [ ] Enter value (e.g., "5km", "30 min")
  - [ ] Should save automatically
- [ ] **Intensity field:**
  - [ ] Tap field → Should open picker modal
  - [ ] Should show options: High, Medium, Low, Recovery
  - [ ] Select option → Should update field and show colored dot
  - [ ] Card left border should change color based on intensity
- [ ] **Workout Time field:**
  - [ ] Tap field → Should open picker modal
  - [ ] Should show options: —, Morning, Afternoon, Evening
  - [ ] Select option → Should update field
- [ ] **Remove workout button:**
  - [ ] Should only show if there are multiple workouts for that day
  - [ ] Tap "Remove" → Should delete workout

#### 4.4 Save/Load Plans
- [ ] **Save plan:**
  - [ ] Tap "Save" button
  - [ ] Should open Save modal
  - [ ] Enter plan name (e.g., "Marathon Week 1")
  - [ ] Tap "Save"
  - [ ] Should show loading state
  - [ ] Should show "Saved!" confirmation badge
  - [ ] Plan name should update in header
  - [ ] "Active" badge should appear
- [ ] **Load plan:**
  - [ ] Tap "Load" button
  - [ ] Should open Load modal
  - [ ] Should show list of saved plans
  - [ ] Each plan should show:
    - [ ] Plan name
    - [ ] Created date
    - [ ] "Active" badge (if currently active)
    - [ ] "Load" button (if not active)
    - [ ] Delete icon
  - [ ] Tap "Load" on a plan → Should load that plan
  - [ ] Tap delete icon → Should show confirmation alert
  - [ ] Confirm delete → Should remove plan from list
  - [ ] Close modal
- [ ] **New plan:**
  - [ ] Tap "New" button
  - [ ] Should create blank plan
  - [ ] Header should show "New Training Plan"
  - [ ] "Active" badge should disappear

### 5. Profile Screen

#### 5.1 Profile Tab
- [ ] Navigate to Profile screen
- [ ] Should show "Profile" and "Preferences" tabs
- [ ] "Profile" tab should be active by default
- [ ] **Profile form:**
  - [ ] Name field (text input)
  - [ ] Age field (numeric input)
  - [ ] Gender field (tap to open picker)
  - [ ] Height field (with unit switcher: m or ft & in)
  - [ ] Weight field (with unit switcher: lbs or kg)
  - [ ] Weight Goal field (tap to open picker)
  - [ ] Activity Level field (tap to open picker)
  - [ ] Training Objective field (multiline text)
  - [ ] Dietary Restrictions field (multiline text)
- [ ] **Test unit switchers:**
  - [ ] Height: Switch between meters and feet/inches
  - [ ] Should convert values automatically
  - [ ] Weight: Switch between lbs and kg
  - [ ] Should maintain value when switching
- [ ] **Test pickers:**
  - [ ] Tap Gender → Should open picker with options
  - [ ] Tap Weight Goal → Should open picker with options
  - [ ] Tap Activity Level → Should open picker with options
  - [ ] Select option → Should update field and close picker
- [ ] **Profile completion card:**
  - [ ] Should show completion percentage
  - [ ] Should show progress bar
  - [ ] Should list missing fields
  - [ ] Should disappear when 100% complete
- [ ] **Save button:**
  - [ ] Tap "Save Profile" button
  - [ ] Should show loading state
  - [ ] Should show success confirmation badge
  - [ ] Badge should disappear after 3 seconds

#### 5.2 Preferences Tab
- [ ] Tap "Preferences" tab
- [ ] Should show food preferences interface
- [ ] **Search and filter:**
  - [ ] Enter search term in search box
  - [ ] Should filter foods and auto-expand matching categories
  - [ ] Clear search → Should reset to default state
  - [ ] Tap filter chips: All, Unset, Liked, Disliked
  - [ ] Should filter foods by state
- [ ] **Food categories:**
  - [ ] Should show categories: Proteins, Dairy & Eggs, Grains & Carbs, Fruits, Vegetables, Nuts & Legumes, Other
  - [ ] Tap category header → Should expand/collapse
  - [ ] First category should be expanded by default
- [ ] **Food tiles:**
  - [ ] Should show in grid layout (2-3 columns)
  - [ ] Tap food tile → Should cycle through states:
    - [ ] Neutral (gray) → Liked (green with thumbs up) → Disliked (red with thumbs down) → Neutral
  - [ ] Liked foods should have green background and thumbs up icon
  - [ ] Disliked foods should have red background and thumbs down icon
- [ ] **Other foods:**
  - [ ] Scroll to "Other Foods I Like" section
  - [ ] Enter comma-separated foods
  - [ ] Scroll to "Other Foods I Dislike" section
  - [ ] Enter comma-separated foods
- [ ] **Favorite cuisines:**
  - [ ] Should show cuisine chips
  - [ ] Tap cuisine chip → Should toggle favorite state
  - [ ] Favorited cuisines should have orange background and filled thumbs up icon
  - [ ] Enter other cuisines in text field
- [ ] **Save preferences:**
  - [ ] Tap "Save Preferences" button (at top or bottom)
  - [ ] Should show loading state
  - [ ] Should show success confirmation
  - [ ] Confirmation should disappear after 3 seconds

### 6. Settings Screen

#### 6.1 Appearance
- [ ] Navigate to Settings screen
- [ ] Should show "Appearance" card
- [ ] **Dark Mode toggle:**
  - [ ] Toggle switch → Should change theme immediately
  - [ ] App should switch between light and dark mode
  - [ ] All screens should update
  - [ ] Toggle back → Should return to original theme

#### 6.2 Change Password
- [ ] Should show "Change Password" card
- [ ] **Test validation:**
  - [ ] Enter different passwords in "New Password" and "Confirm Password"
  - [ ] Tap "Update Password"
  - [ ] Should show "❌ Passwords do not match"
  - [ ] Enter password less than 6 characters
  - [ ] Should show "❌ Password must be at least 6 characters"
- [ ] **Test successful change:**
  - [ ] Enter new password (6+ characters)
  - [ ] Enter same password in confirm field
  - [ ] Tap "Update Password"
  - [ ] Should show "✅ Password updated successfully!"
  - [ ] Fields should clear
  - [ ] Message should disappear after 4 seconds

#### 6.3 Legal Information
- [ ] Should show "Legal Information" card
- [ ] **Privacy Policy:**
  - [ ] Tap "Privacy Policy" button
  - [ ] Should open browser with privacy policy page
- [ ] **Terms of Service:**
  - [ ] Tap "Terms of Service" button
  - [ ] Should open browser with terms page

#### 6.4 Delete Account
- [ ] Should show "Delete Account" section (red/danger zone)
- [ ] Tap "Delete Account" button
- [ ] Should show confirmation alert
- [ ] Tap "No" → Should cancel
- [ ] Tap "Yes" → Should delete account
- [ ] Should show success alert
- [ ] Should sign out and return to login screen

### 7. Navigation

#### 7.1 Bottom Tab Navigation
- [ ] Should show 5 tabs: Dashboard, Meals, Training, Profile, Settings
- [ ] Tap each tab → Should navigate to corresponding screen
- [ ] Active tab should be highlighted
- [ ] Tab icons should change when active

#### 7.2 Offline Banner
- [ ] Turn off internet connection
- [ ] Should show offline banner at top of screen
- [ ] Banner should say "You're offline. Some features may not work."
- [ ] Turn on internet connection
- [ ] Banner should disappear

---

## Web App Testing

### 1. Landing Page

#### 1.1 Initial Load
- [ ] Navigate to https://alimentanutrition.com (or localhost)
- [ ] Should show landing page with:
  - [ ] Logo and tagline
  - [ ] Hero section
  - [ ] Features section
  - [ ] Call-to-action buttons
- [ ] **Test navigation:**
  - [ ] Click "Get Started" → Should navigate to signup/login
  - [ ] Click "Sign In" → Should navigate to login page

### 2. Authentication

#### 2.1 Sign Up
- [ ] Navigate to signup page
- [ ] **Test validation:**
  - [ ] Submit empty form → Should show validation errors
  - [ ] Enter invalid email → Should show error
  - [ ] Enter password < 6 characters → Should show error
- [ ] **Test successful signup:**
  - [ ] Enter valid name, email, password
  - [ ] Click "Sign Up"
  - [ ] Should show loading state
  - [ ] Should show success message or redirect to onboarding
- [ ] **Test Google Sign Up:**
  - [ ] Click "Continue with Google"
  - [ ] Complete Google authentication
  - [ ] Should redirect to onboarding or dashboard

#### 2.2 Login
- [ ] Navigate to login page
- [ ] **Test validation:**
  - [ ] Submit without email → Should show error
  - [ ] Submit without password → Should show error
  - [ ] Submit wrong credentials → Should show error
- [ ] **Test successful login:**
  - [ ] Enter correct email and password
  - [ ] Click "Sign In"
  - [ ] Should show loading state
  - [ ] Should redirect to dashboard or onboarding
- [ ] **Test "Forgot Password":**
  - [ ] Click "Forgot password?" link
  - [ ] Enter email
  - [ ] Click "Send Reset Link"
  - [ ] Should show success message
- [ ] **Test Google Sign In:**
  - [ ] Click "Continue with Google"
  - [ ] Complete Google authentication
  - [ ] Should redirect appropriately

### 3. Onboarding (Web)

#### 3.1 Welcome Step
- [ ] Should show welcome message
- [ ] Click "Get Started" → Should advance to Profile step

#### 3.2 Profile Step
- [ ] Should show progress indicator (Step 2 of 3)
- [ ] Fill in all profile fields (same as mobile)
- [ ] Test dropdowns/selects for Gender, Goal, Activity Level
- [ ] Click "Back" → Should return to Welcome
- [ ] Click "Next" → Should save and advance to Preferences

#### 3.3 Preferences Step
- [ ] Should show progress indicator (Step 3 of 3)
- [ ] Enter likes, dislikes, cuisines
- [ ] Click "Back" → Should return to Profile
- [ ] Click "Complete" → Should save and redirect to dashboard

### 4. Dashboard (Web)

#### 4.1 Layout
- [ ] Should show sidebar navigation
- [ ] Should show main content area
- [ ] **Test sidebar:**
  - [ ] Click each navigation item
  - [ ] Should highlight active item
  - [ ] Should navigate to corresponding page

#### 4.2 Dashboard Content
- [ ] Should show similar tiles as mobile:
  - [ ] Today's nutrition summary
  - [ ] Today's training
  - [ ] Week progress
  - [ ] Next action
- [ ] Test all tile interactions (same as mobile)

### 5. Meals Page (Web)

#### 5.1 Layout
- [ ] Should show week navigation
- [ ] Should show day selector
- [ ] Should show meal cards in grid/list
- [ ] Should show action buttons

#### 5.2 Functionality
- [ ] Test all meal operations (same as mobile):
  - [ ] Generate meals
  - [ ] View recipe
  - [ ] Rate meals
  - [ ] Save meals
  - [ ] Regenerate meals
  - [ ] Delete meals
  - [ ] Log meals
  - [ ] Meal prep
  - [ ] Generate grocery list
  - [ ] View analytics

### 6. Training Page (Web)

#### 6.1 Layout
- [ ] Should show training plan header
- [ ] Should show day cards
- [ ] Should show workout forms

#### 6.2 Functionality
- [ ] Test all training operations (same as mobile):
  - [ ] Add workouts
  - [ ] Edit workouts
  - [ ] Remove workouts
  - [ ] Save plan
  - [ ] Load plan
  - [ ] Delete plan
  - [ ] Create new plan

### 7. Profile Page (Web)

#### 7.1 Profile Tab
- [ ] Should show profile form
- [ ] Test all profile fields (same as mobile)
- [ ] Test unit conversions
- [ ] Test save functionality

#### 7.2 Preferences Tab
- [ ] Should show food preferences
- [ ] Test search and filter
- [ ] Test food selection
- [ ] Test cuisine selection
- [ ] Test save functionality

### 8. Settings Page (Web)

#### 8.1 Settings Options
- [ ] Test dark mode toggle
- [ ] Test change password
- [ ] Test legal links
- [ ] Test delete account

### 9. Responsive Design (Web)

#### 9.1 Desktop (1920x1080)
- [ ] All elements should be properly sized
- [ ] Sidebar should be visible
- [ ] Content should use available space

#### 9.2 Tablet (768x1024)
- [ ] Layout should adapt
- [ ] Sidebar may collapse to hamburger menu
- [ ] Content should remain readable

#### 9.3 Mobile (375x667)
- [ ] Should show mobile-optimized layout
- [ ] Sidebar should be hamburger menu
- [ ] All interactions should work with touch

---

## Cross-Platform Testing

### 1. Data Synchronization

#### 1.1 Profile Changes
- [ ] Update profile on mobile
- [ ] Open web app → Should show updated profile
- [ ] Update profile on web
- [ ] Open mobile app → Should show updated profile

#### 1.2 Meal Plan Changes
- [ ] Generate meals on mobile
- [ ] Open web app → Should show same meals
- [ ] Regenerate a meal on web
- [ ] Open mobile app → Should show updated meal

#### 1.3 Training Plan Changes
- [ ] Create training plan on mobile
- [ ] Open web app → Should show same plan
- [ ] Edit workout on web
- [ ] Open mobile app → Should show updated workout

#### 1.4 Meal Completions
- [ ] Mark meals as completed on mobile
- [ ] Open web app → Should show completed status
- [ ] Mark meals as completed on web
- [ ] Open mobile app → Should show completed status

### 2. Authentication State
- [ ] Sign in on mobile
- [ ] Open web app → Should be signed in
- [ ] Sign out on web
- [ ] Open mobile app → Should be signed out

---

## Error Scenarios

### 1. Network Errors

#### 1.1 Offline Mode
- [ ] Turn off internet
- [ ] Try to generate meals → Should show "No Connection" alert
- [ ] Try to save profile → Should show "No Connection" alert
- [ ] Try to load training plan → Should show error
- [ ] Turn on internet
- [ ] Retry operations → Should work

#### 1.2 API Errors
- [ ] Simulate API error (if possible)
- [ ] Should show appropriate error message
- [ ] Should not crash app
- [ ] Should allow retry

### 2. Validation Errors

#### 2.1 Form Validation
- [ ] Try submitting forms with invalid data
- [ ] Should show validation errors
- [ ] Should highlight invalid fields
- [ ] Should not submit until valid

#### 2.2 Data Validation
- [ ] Try entering invalid height (e.g., negative number)
- [ ] Try entering invalid weight
- [ ] Try entering invalid age
- [ ] Should show appropriate error or prevent input

### 3. Edge Cases

#### 3.1 Empty States
- [ ] New user with no data
- [ ] Should show empty state messages
- [ ] Should show helpful prompts
- [ ] Should allow easy data entry

#### 3.2 Large Data Sets
- [ ] User with many saved meals
- [ ] User with many training plans
- [ ] Should handle large lists
- [ ] Should not lag or crash

#### 3.3 Special Characters
- [ ] Enter special characters in text fields
- [ ] Should handle properly
- [ ] Should not cause errors

### 4. Session Management

#### 4.1 Token Expiration
- [ ] Let session expire (wait or manipulate token)
- [ ] Try to perform action
- [ ] Should redirect to login
- [ ] Should not lose unsaved data (if possible)

#### 4.2 Multiple Devices
- [ ] Sign in on two devices
- [ ] Make changes on one device
- [ ] Refresh other device → Should show changes
- [ ] Sign out on one device
- [ ] Other device should handle appropriately

---

## Performance Testing

### 1. Load Times
- [ ] Measure initial app load time
- [ ] Measure page transition times
- [ ] Measure API response times
- [ ] Should be reasonably fast (< 3 seconds for most operations)

### 2. Memory Usage
- [ ] Monitor memory usage during extended use
- [ ] Should not continuously increase
- [ ] Should not cause device slowdown

### 3. Battery Usage (Mobile)
- [ ] Use app for extended period
- [ ] Monitor battery drain
- [ ] Should not drain excessively

---

## Accessibility Testing

### 1. Screen Reader
- [ ] Enable screen reader (VoiceOver on iOS, TalkBack on Android)
- [ ] Navigate through app
- [ ] All elements should be announced
- [ ] All buttons should be accessible

### 2. Font Scaling
- [ ] Increase system font size
- [ ] App should scale appropriately
- [ ] Text should remain readable
- [ ] Layout should not break

### 3. Color Contrast
- [ ] Check color contrast in light mode
- [ ] Check color contrast in dark mode
- [ ] Should meet WCAG standards

---

## Security Testing

### 1. Authentication
- [ ] Test password requirements
- [ ] Test session timeout
- [ ] Test unauthorized access attempts
- [ ] Test password reset flow

### 2. Data Privacy
- [ ] Verify sensitive data is not logged
- [ ] Verify data is encrypted in transit
- [ ] Verify user data is isolated

---

## Notes for Testers

1. **Test on Multiple Devices:**
   - iOS (iPhone 12+, iPad)
   - Android (Samsung, Google Pixel)
   - Web (Chrome, Firefox, Safari, Edge)

2. **Test Different Network Conditions:**
   - WiFi
   - 4G/5G
   - Slow 3G
   - Offline

3. **Test Different User States:**
   - New user (first time)
   - Returning user
   - User with partial data
   - User with complete data

4. **Report Issues:**
   - Include device/browser info
   - Include steps to reproduce
   - Include screenshots/videos
   - Include expected vs actual behavior

5. **Priority Levels:**
   - **Critical:** Blocks core functionality (auth, meal generation)
   - **High:** Major feature broken (can't save profile)
   - **Medium:** Minor feature issue (UI glitch)
   - **Low:** Cosmetic issue (alignment off by 1px)

---

## Test Completion Checklist

- [ ] All authentication flows tested
- [ ] All main screens tested
- [ ] All CRUD operations tested
- [ ] All modals/dialogs tested
- [ ] All navigation tested
- [ ] All error scenarios tested
- [ ] Cross-platform sync tested
- [ ] Responsive design tested
- [ ] Accessibility tested
- [ ] Performance acceptable
- [ ] No critical bugs found
- [ ] All high-priority bugs documented

---

**Last Updated:** [Date]
**Tested By:** [Name]
**Version:** [App Version]
