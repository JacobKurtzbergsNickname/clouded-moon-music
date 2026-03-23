# Changes — Auth0 Setup (2026-03-08)

## What was done

We prepared the project for Auth0 authentication by configuring the necessary URLs and settings.

## Why

Auth0 is being added as the authentication provider for the Clouded Moon Music API. Before any login or user management code can be written, the application needs to know *where* to send users during sign-in and sign-out flows. This change puts those addresses in place.

## What changed

### 1. New environment variables (`.env`)

The following settings were added to the project's local configuration file:

- **AUTH0_DOMAIN** — The address of our Auth0 tenant (to be filled in with the real value from the Auth0 dashboard).
- **AUTH0_CLIENT_ID** — The application identifier assigned by Auth0.
- **AUTH0_CLIENT_SECRET** — The secret key for secure communication with Auth0.
- **AUTH0_AUDIENCE** — The identifier for our API, used to request access tokens.
- **AUTH0_CALLBACK_URL** — `http://localhost:3456/callback` — Where Auth0 redirects a user *after* they log in.
- **AUTH0_LOGOUT_URL** — `http://localhost:3456` — Where Auth0 redirects a user *after* they log out.
- **AUTH0_BASE_URL** — `http://localhost:3456` — The root address of the application.

> **Note:** The application runs on port **3456**, not the default 3000. All URLs have been configured accordingly. The same URLs must be entered in the Auth0 dashboard under "Allowed Callback URLs" and "Allowed Logout URLs".

### 2. New configuration file (`src/config/auth0.config.ts`)

A dedicated configuration module was created, following the same pattern used by the existing database configs (`postgres.config.ts`, `mongodb.config.ts`). It:

- Reads all Auth0 values from environment variables.
- Falls back to sensible defaults using the application's port.
- Provides a `validate()` helper that lists any missing required settings, making it easy to catch misconfigurations early.

## What to do next in the Auth0 dashboard

In your Auth0 application settings, update the following fields to match this project's port:

- **Allowed Callback URLs** → `http://localhost:3456/callback`
- **Allowed Logout URLs** → `http://localhost:3456`

## Impact

- No existing functionality was changed.
- The application still starts and runs exactly as before.
- These settings are a **prerequisite** for the next step: installing the Auth0 SDK and wiring up login/logout routes.
