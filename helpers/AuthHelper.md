[HELPER: AuthHelper]

# Provides authentication and authorization helper methods

[HELPER-ACTION: loginWithCredentials]
[HELPER-PARAMS: username: string, password: string]

## Logs in to the application using provided credentials

This method should:

- Navigate to the login page if not already there
- Fill in the username field with the provided username
- Fill in the password field with the provided password
- Click the login button
- Wait for the dashboard or main page to load

The method should handle common selectors found in authentication flows.

[HELPER-ACTION: loginAsRole]
[HELPER-PARAMS: role: 'admin' | 'user' | 'guest', testDataPath?: string]

## Logs in with predefined credentials for a specific user role

This method should:

- Use predefined test credentials based on the role
- Support optional custom test data path for flexibility
- Perform the login flow
- Verify the role-specific dashboard appears

[HELPER-ACTION: logoutUser]

## Logs out the currently logged-in user

This method should:

- Click on the user menu or profile icon
- Select the logout option
- Wait for redirect to login page
- Verify logout was successful by checking for login form visibility
