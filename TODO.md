# TODO: Fix Checkbox and Forgot Password Styling and Functionality

## Steps to Complete

1. **Update src/components/Login/Login.jsx** ✅
   - Change forgot password button to navigate to a separate page instead of modal.
   - Remove modal-related state and JSX.

2. **Create ForgotPassword Component** ✅
   - Create src/components/ForgotPassword/ForgotPassword.jsx with form for email input.
   - Create src/components/ForgotPassword/ForgotPassword.css with consistent styling.
   - Add routing in src/App.js for /forgot-password.

3. **Update src/components/Login/Login.css** ✅
   - Add styles for `.remember-me` container to align checkbox and forgot password button.
   - Style `.checkbox-label` and `.checkmark` for a custom checkbox that matches the form inputs (border-radius, padding, etc.).
   - Style `.forgot-password-btn` as a link-like button to fit the design.

4. **Test the Changes** ✅
   - Run the application and navigate to the login page.
   - Verify the checkbox toggles and looks consistent with other elements.
   - Click the forgot password button and ensure it navigates to the forgot password page.
   - Verify the forgot password page loads with the form.
   - Check responsiveness on mobile if possible.

## Notes
- Ensure all new styles use the same color variables and font family as existing elements.
- The forgot password form now appears on a separate page for better UX.
