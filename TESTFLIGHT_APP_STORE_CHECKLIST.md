# Alimenta TestFlight App Store Submission Checklist

Use this checklist on the exact TestFlight build intended for App Store review.

**Build/version:** __________  
**TestFlight build:** __________  
**Tester:** __________  
**Date:** __________  
**Devices/iOS versions:** __________

## Test setup

- [ ] Test a clean install on the smallest supported iPhone and a current Dynamic Island iPhone.
- [ ] Test an upgrade over the previous App Store/TestFlight build.
- [ ] Test on the oldest and newest supported iOS versions.
- [ ] Prepare accounts for: new email user, verified returning user, incomplete-onboarding user, Google user, Apple user, nutritionist, and data-heavy user.
- [ ] Run core flows on Wi-Fi, cellular, slow network, and offline.
- [ ] Confirm the build uses production API, auth, legal-page, Sentry, and analytics configuration.
- [ ] Confirm no development menus, placeholder content, debug logs, or test credentials are visible.

## Launch, splash, and routing

- [ ] App icon, app name, launch screen, and splash colors look correct.
- [ ] Cold launch, warm launch, background/resume, and force-quit/relaunch do not crash.
- [ ] Fonts load without a flash, broken layout, or indefinitely blocked splash screen.
- [ ] First clean install opens the intro carousel.
- [ ] Returning signed-out users open Login.
- [ ] Signed-in users with incomplete profiles open setup onboarding.
- [ ] Signed-in users with complete profiles open Dashboard.
- [ ] Expired sessions show a clear message and return to Login.
- [ ] A network failure during session restoration does not expose protected data or strand the user.
- [ ] Light/dark theme and login state survive relaunch as expected.
- [ ] `alimenta://` links open the app correctly.
- [ ] Invalid app links show the not-found screen and can return home.
- [ ] Redirect parameters accept internal routes and reject absolute/external URLs.

## Intro carousel

- [ ] All four pages can be swiped in both directions.
- [ ] Pagination dots match the visible page.
- [ ] Text, images, and mockups render without clipping or overlap.
- [ ] Remote meal imagery handles slow or unavailable networks gracefully.
- [ ] “Get Started” routes to Signup wherever it appears.
- [ ] “Already have an account?” routes to Login.
- [ ] Theme toggle updates the full screen and persists after restart.
- [ ] Partially viewing the carousel and relaunching has sensible behavior.

## Login

- [ ] Email form expands/collapses correctly and remains usable with the keyboard open.
- [ ] Empty email, malformed email, empty password, and wrong credentials show useful errors.
- [ ] Unverified email accounts receive the correct guidance.
- [ ] Server and offline errors do not clear entered credentials unnecessarily.
- [ ] Loading disables duplicate submissions and all other auth methods.
- [ ] A completed client routes to Dashboard.
- [ ] An incomplete client routes to setup onboarding.
- [ ] A nutritionist routes to the intended landing screen.
- [ ] Sign-in with Google succeeds and returns to the app.
- [ ] Google cancel, dismiss, browser interruption, and provider failure recover cleanly.
- [ ] Sign in with Apple succeeds on a physical iPhone.
- [ ] First Apple consent works with both shared and hidden email.
- [ ] Repeat Apple sign-in works when Apple does not return name/email again.
- [ ] Apple cancel, revoked credential, and server failure recover cleanly.
- [ ] Apple sign-in is only shown on supported platforms.

### Forgot password modal

- [ ] Modal opens, closes, and remains visible above the keyboard.
- [ ] Empty and malformed emails are rejected.
- [ ] Valid submission shows loading and success feedback.
- [ ] Failure/offline states are clear and retryable.
- [ ] Reset email arrives and its link opens a working reset flow.
- [ ] The new password can be used in the app.

## Signup and email verification

- [ ] Name, email, and password fields remain visible and scroll above the keyboard.
- [ ] Missing name/email/password, malformed email, and short password are rejected.
- [ ] Existing-email signup shows useful guidance.
- [ ] Valid signup cannot be submitted more than once.
- [ ] Success screen shows the correct email and “Back to Login” works.
- [ ] Verification email arrives and its link successfully activates the account.
- [ ] Verified user can log in and is routed to onboarding.
- [ ] Google signup succeeds, cancels, and fails gracefully.
- [ ] Apple signup captures the name on first authorization.
- [ ] Repeat Apple authentication still resolves to the same account.
- [ ] Terms and Privacy links open the correct production pages in Safari.
- [ ] A browser-open failure shows a useful error.

## Setup onboarding — Welcome

- [ ] Welcome content and progress state are correct.
- [ ] Theme toggle works and persists.
- [ ] “Get Started” advances to Profile.
- [ ] Back navigation does not accidentally leave the user in an invalid state.

## Setup onboarding — Profile

- [ ] Signup/OAuth name is prefilled when available.
- [ ] Required fields are enforced: name, age, gender, height, weight, goal, and activity.
- [ ] Age boundaries reject values below 13 and above 150.
- [ ] Empty, negative, malformed, decimal, and extreme height/weight values are handled.
- [ ] Metric/imperial height conversion is accurate in both directions.
- [ ] Kilogram/pound conversion is accurate in both directions.
- [ ] Gender, goal, and activity pickers display and save every option.
- [ ] Training objective and dietary restrictions accept long and special-character text.
- [ ] Back/Continue navigation preserves entered values.
- [ ] Saving shows a spinner and prevents duplicate submissions.
- [ ] Offline/save failure gives a clear recovery path.
- [ ] Force-quit at this step and relaunch restores the draft and current step.

## Setup onboarding — Preferences

- [ ] Categories expand/collapse correctly.
- [ ] Search filters foods and clear-search restores the list.
- [ ] All, Unset, Liked, and Disliked filters return the correct items.
- [ ] Food state cycles Neutral → Liked → Disliked → Neutral.
- [ ] Custom liked/disliked foods parse comma-separated entries correctly.
- [ ] Cuisine chips and custom cuisines save correctly.
- [ ] Back preserves preference and profile data.
- [ ] Completion works with empty and populated preferences.
- [ ] Offline completion remains blocked and is retryable.
- [ ] Successful completion clears the draft, opens Dashboard, and does not recur after relaunch.

## Global authenticated layout and navigation

- [ ] Footer navigates Training ↔ Dashboard ↔ Meals.
- [ ] Active footer state always matches the visible screen.
- [ ] Header avatar opens Profile; gear opens Settings; logout returns to Login.
- [ ] Day selector appears only where intended and causes no layout jump.
- [ ] Safe areas are correct around the notch, Dynamic Island, and home indicator.
- [ ] Repeated navigation does not build a broken back stack or duplicate screens.
- [ ] Signing out online clears the local session and protected content.
- [ ] Signing out offline still clears the local session after timeout.
- [ ] Offline banner appears promptly, does not cover controls, and disappears after reconnect.
- [ ] Session expiry during an action shows one alert and returns to Login.
- [ ] Dark mode is complete across every screen, modal, alert, chart, and loading state.

### Product tutorial

- [ ] Automatically starts once for a new client.
- [ ] Does not auto-start for nutritionists or guest users.
- [ ] All eight steps target the correct controls across screens.
- [ ] Back, Next, highlighted-target taps, Skip, and Done work.
- [ ] Existing breakfast correctly skips the generate-meal step.
- [ ] Missing targets, rotation/backgrounding, and navigating away do not trap the user.
- [ ] Tutorial does not auto-start again after completion.
- [ ] “Replay App Tutorial” in Settings starts it from the beginning.

## Dashboard

- [ ] Current date/day is correct for the device locale and time zone.
- [ ] Date changes correctly across midnight and Sunday/Monday boundaries.
- [ ] Nutrition tile handles no plan, partial plan, and full plan.
- [ ] Planned and completed calories/macros are accurate.
- [ ] Snack and dessert values are included correctly.
- [ ] Nutrition loading, API failure, and cached/stale data are presented clearly.
- [ ] Tapping nutrition opens Nutrition Detail.
- [ ] Training tile handles no plan, loading, failure, workout day, and rest day.
- [ ] Multiple workouts and long type/distance/notes text do not overflow.
- [ ] Tapping training opens Training.
- [ ] Grocery list warns when there are no meals.
- [ ] Grocery list loading, usage limit, API failure, categorized result, sharing, and close all work.
- [ ] Dashboard actions fail gracefully while offline.
- [ ] No expected “Next Action” UI is missing from the release design.

## Nutrition Detail

- [ ] Opens as a modal from Dashboard and closes by chevron and dismiss gesture.
- [ ] Overview, Calories, and Macros tabs show the correct content.
- [ ] Loading, fetch-error, and no-data states are usable.
- [ ] Partial/completed meals, snacks, dessert, and adjusted macros calculate correctly.
- [ ] Pie charts handle zero, one, many, and very large values.
- [ ] Charts remain understandable without relying only on color.
- [ ] Content scrolls on small screens and in large text.

## Meals

### Screen and navigation

- [ ] Initial skeleton, retryable full error, and cached-data/background-error states work.
- [ ] Empty, partial, full, generating, and generation-error meal cards render correctly.
- [ ] Every day can be selected and today is clearly marked.
- [ ] Previous/current/next week navigation loads the correct dates.
- [ ] “Back to Today” returns to the current day/week.
- [ ] Past-day restrictions match the product rules.
- [ ] Header collapses/expands smoothly without hiding controls.
- [ ] Macro totals, adjusted-meal banner, and over-budget banner are accurate.
- [ ] Dessert can be enabled/disabled; removing an existing dessert gives clear notice.

### Empty and filled meal cards

- [ ] Empty card offers Generate with AI, Log Meal, Meal Prep, and Cancel.
- [ ] The iOS action sheet opens without a crash on a physical iPhone.
- [ ] Filled card shows name, calories, macros, rating, and applicable completion state.
- [ ] Long meal names and large nutrition values do not clip.
- [ ] Rating changes persist after navigation and relaunch.
- [ ] Authenticated users can save a meal; success and error states are clear.
- [ ] Recipe, regenerate, and delete actions target the correct meal.
- [ ] Delete cancel preserves the meal; delete confirm removes it after relaunch.

### Generation and daily actions

- [ ] Generate a full day, remaining meals, and one meal.
- [ ] Streaming placeholders update and are replaced by completed meals.
- [ ] Timeout/API failure removes stuck placeholders and allows retry.
- [ ] Full-day regenerate warns before replacing existing meals.
- [ ] Clear-day cancel preserves meals; confirm clears the intended day.
- [ ] Regenerate reason validates input and is sent correctly.
- [ ] Failed regeneration restores the original meal.
- [ ] Daily limits are enforced: 10 meal generations, 5 recipes, and 3 grocery lists.
- [ ] Limits reset after midnight in the device’s time zone.
- [ ] Offline generation is blocked with useful feedback.

### Completion

- [ ] Completion controls appear only for today.
- [ ] Toggling a meal updates Meals and Dashboard totals immediately.
- [ ] Completion persists after restart.
- [ ] Completing all intended meals shows the celebration once.

### Weekly Analytics modal

- [ ] Empty-state copy is useful.
- [ ] Populated charts match the current week’s meal/training data.
- [ ] Nutrition and training insights are readable in light and dark mode.
- [ ] Modal closes by its intended controls without losing meal data.

### Grocery List modal

- [ ] No-meals warning, loading, usage limit, API error, and success states work.
- [ ] Generated items are complete, categorized, and readable.
- [ ] Native share sheet opens and shares useful text.
- [ ] Canceling the share sheet returns safely to the modal.

### Meal Prep modal

- [ ] Meal type → days → generated options → apply flow works.
- [ ] Individual weekdays, All, and Clear select the correct days.
- [ ] Back preserves state and close cancels without applying.
- [ ] Generated choices apply only to selected slots.
- [ ] Offline, usage-limit, and API-error states are retryable.

### Log Meal modal

- [ ] Correct day and meal type are selectable.
- [ ] Description input handles long text and the keyboard.
- [ ] Macro estimation shows loading and plausible results.
- [ ] Estimation failure provides the intended fallback.
- [ ] Logged meal appears in the selected slot and persists.
- [ ] Saved meals handle loading, error, empty state, and usage count.
- [ ] Selecting a saved meal fills the intended slot.

### Log Snack modal

- [ ] Create, edit, and remove snack flows work.
- [ ] Empty, negative, malformed, decimal, and extreme macros are handled.
- [ ] Over-budget/rebalanced feedback matches the resulting plan.
- [ ] Snack changes update Dashboard and persist.

### Recipe and servings

- [ ] Servings 1–6 can be selected.
- [ ] Recipe loading, API failure, retry, and long-content scrolling work.
- [ ] Ingredient quantities and nutrition adjust as intended for servings.
- [ ] Native sharing works and canceling returns to the recipe.

## Training

- [ ] Loading, empty, and retryable fetch-error states work.
- [ ] Each day can be selected/expanded.
- [ ] Add one through five workouts to a day; the sixth is prevented clearly.
- [ ] Additional workouts can be removed without affecting the wrong entry.
- [ ] Every workout type, intensity, and time option saves correctly.
- [ ] Distance/duration accepts intended values and handles long input.
- [ ] Keyboard dismissal and scrolling work on small screens.
- [ ] Save with a custom name and with a blank name (“Untitled Plan”).
- [ ] Save spinner prevents duplicate requests; success and failure are clear.
- [ ] New Plan resets the editor only after the intended confirmation behavior.
- [ ] Load modal handles empty and populated states and shows the active plan.
- [ ] Loading a plan replaces the editor with the correct data.
- [ ] Delete cancel preserves the plan; confirm removes active and inactive plans correctly.
- [ ] Ten-plan limit is enforced clearly.
- [ ] Active plan persists after restart and appears correctly on Dashboard.
- [ ] Offline save/load actions are safe and retryable.

## Profile — Profile tab

- [ ] Loading and partial/full fetch failures are handled.
- [ ] Existing profile data hydrates every field correctly.
- [ ] Profile/Preferences tabs switch correctly.
- [ ] Direct entry using `?tab=preferences` opens Preferences.
- [ ] Name, age, gender, height, weight, goal, activity, objective, and restrictions save.
- [ ] Invalid/boundary values are rejected consistently with onboarding.
- [ ] Height and weight unit conversions are accurate and do not drift after repeated switches.
- [ ] Profile completion percentage and missing-field tags are accurate.
- [ ] Save loading, success, failure, and offline states work.
- [ ] Saved changes survive restart and appear on the web, if cross-platform sync is supported.

### Macro calculator

- [ ] A complete valid profile produces plausible rest-day and training-day results.
- [ ] Missing/malformed/extreme profile values show safe guidance instead of invalid numbers.
- [ ] Long results scroll and remain readable.
- [ ] Close button and backdrop dismissal work.

## Profile — Preferences tab

- [ ] Existing liked/disliked foods and cuisines hydrate correctly.
- [ ] Search, no-results, filters, and category expansion work.
- [ ] Food-state cycling and cuisine chips save the displayed state.
- [ ] Custom foods/cuisines preserve commas, spacing, and supported special characters.
- [ ] Top and bottom Save actions behave identically.
- [ ] Loading, success, failure, and offline states do not lose edits.
- [ ] Saved preferences affect later meal generation as intended.

## Settings

- [ ] Dark-mode toggle updates immediately and survives restart.
- [ ] Replay App Tutorial starts the product tutorial.
- [ ] Password mismatch and too-short password are rejected.
- [ ] Successful password change clears fields and shows confirmation.
- [ ] Old password no longer works and new password works after logout.
- [ ] Password API/session/offline errors are clear and safe.
- [ ] Privacy Policy opens the correct production page.
- [ ] Terms of Service opens the correct production page.
- [ ] Legal pages are publicly accessible, current, and match App Store metadata.

### Delete Account

- [ ] Cancel leaves the account and data unchanged.
- [ ] Repeated taps cannot submit multiple deletion requests.
- [ ] API/network failure leaves the account usable and provides retry guidance.
- [ ] Successful deletion signs out and returns to Login.
- [ ] Deleted credentials can no longer log in.
- [ ] Personal profile, preferences, meals, training, and saved data are actually removed.
- [ ] Apple-authenticated deletion revokes the Apple token/server authorization as required.
- [ ] A deleted Apple account can follow the intended fresh-signup flow afterward.

## Not-found and dormant routes

- [ ] Unknown paths show a branded not-found screen with a working Home action.
- [ ] `/modal` does not expose Expo template text such as “EditScreenInfo”; remove it if unintended.
- [ ] Direct `/(app)/preferences` navigation is either fully supported or inaccessible.
- [ ] `meals-refactored` cannot be opened as an unintended public route.

## Accessibility and visual checks on every screen

- [ ] Complete all primary flows using VoiceOver.
- [ ] Buttons, icon-only controls, fields, ratings, food states, completion circles, and charts have useful labels, roles, values, and states.
- [ ] VoiceOver focus stays within modals and returns to the triggering control after close.
- [ ] Destructive confirmations and success/error messages are announced.
- [ ] Reading/focus order follows the visual order.
- [ ] All touch targets are at least 44×44 points.
- [ ] Test all supported Dynamic Type sizes, including the largest accessibility size.
- [ ] Test Bold Text, Increase Contrast, Reduce Motion, and Display Zoom.
- [ ] Text is not clipped and controls remain reachable with large text.
- [ ] Light and dark mode have readable contrast.
- [ ] Information is not communicated by color alone.
- [ ] Keyboard focus, Return/Next actions, dismissal, and input types are appropriate.
- [ ] Portrait-only and iPhone-only behavior matches the intended App Store listing.

## Reliability, privacy, and production services

- [ ] Rapidly tap primary actions; no duplicate records, requests, or screens appear.
- [ ] Background/foreground during auth, generation, save, modal, and share operations is safe.
- [ ] Incoming calls, Control Center, and device lock do not corrupt state.
- [ ] Force-quit during a write and relaunch does not produce partial or duplicate data.
- [ ] User A can never see User B’s cached profile, meals, training, or preferences after logout/login.
- [ ] Sensitive tokens, passwords, email-link parameters, and personal data do not appear in visible logs or error messages.
- [ ] Telemetry failures never block auth or core app actions.
- [ ] Confirm test crashes appear in the production Sentry project with the correct build/version.
- [ ] Confirm key production events appear in PostHog and identify users only as intended.
- [ ] App behavior matches the App Privacy questionnaire.
- [ ] No camera, photo, location, microphone, tracking, health, or notification permission prompt appears unexpectedly.
- [ ] App Store metadata does not advertise subscriptions or in-app purchases; none are implemented in this build.

## Final submission gate

- [ ] No crashes, frozen screens, infinite spinners, broken links, or placeholder/template screens remain.
- [ ] Authentication works for email, Google, and Apple on the production build.
- [ ] A new user can complete onboarding and reach Dashboard.
- [ ] A returning user can generate/log meals, create training, edit profile, and sign out.
- [ ] Account deletion is easy to find and completes successfully.
- [ ] Core flows work after reconnecting from offline mode.
- [ ] Legal URLs, support URL, privacy details, screenshots, description, age rating, and review notes are current in App Store Connect.
- [ ] App Review credentials work and include any instructions needed to reach core features.
- [ ] Version `1.0.4` and iOS build number `4` (or the final intended values) match App Store Connect.
- [ ] Release notes identify all user-visible changes.
- [ ] All Critical and High issues are fixed; accepted lower-priority issues are documented.
- [ ] Final build has been smoke-tested after upload to TestFlight.
