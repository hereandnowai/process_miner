# Process Miner

An AI-powered process mining application for analyzing, optimizing, and monitoring business processes. Features include a dashboard, AI chat assistant, process analyzer, and data upload capabilities.

## Prerequisites

*   A modern web browser (e.g., Chrome, Firefox, Edge, Safari).
*   A valid Google Gemini API Key.

## Getting Started

Follow these steps to set up and run the application locally:

### 1. Clone or Download Files

Ensure you have all the project files (`index.html`, `index.tsx`, `App.tsx`, `components/`, `services/`, `utils/`, `constants.ts`, `types.ts`, `metadata.json`) in a local directory.

### 2. Configure API Key for Local Development

The application expects the Gemini API Key to be available via `process.env.API_KEY`. For local development, you need to provide this key.

Open the `index.html` file and add the following `<script>` block inside the `<head>` section, **before** the `<script type="importmap">` tag:

```html
<script>
  // --- IMPORTANT ---
  // Replace "YOUR_GEMINI_API_KEY_HERE" with your actual Gemini API Key.
  // This configuration is for LOCAL DEVELOPMENT/TESTING ONLY.
  // DO NOT commit your API key to version control.
  window.process = {
    env: {
      API_KEY: "YOUR_GEMINI_API_KEY_HERE"
    }
  };
</script>
```

Your `<head>` section in `index.html` should look something like this after adding the script:

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Process Miner</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = { /* ... existing tailwind config ... */ }
  </script>
  
  <!-- Add API Key script here -->
  <script>
    window.process = {
      env: {
        API_KEY: "YOUR_GEMINI_API_KEY_HERE"
      }
    };
  </script>
  <!-- End API Key script -->

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <!-- ... rest of your head content ... -->
  <script type="importmap">
  {
    "imports": { /* ... your imports ... */ }
  }
  </script>
</head>
```

### 3. Run the Application

You have two main options to run the application:

**Option A: Using a Local Web Server (Recommended)**

This method avoids potential issues with browser security features or ES module loading over the `file://` protocol.

1.  Navigate to the project directory in your terminal.
2.  If you have Node.js installed, you can use `npx` to run a simple HTTP server:
    *   `npx http-server .`
    *   Or, `npx serve .`
3.  Open the URL provided by the server in your browser (e.g., `http://localhost:8080` or `http://localhost:3000`).

Many code editors (like VS Code) also offer live server extensions that can serve the `index.html` file.

**Option B: Opening `index.html` Directly**

1.  Open the `index.html` file directly in your web browser (e.g., by double-clicking it or using "File > Open" in your browser).

While this may work for basic rendering, using a local server is generally more reliable for applications using JavaScript modules and API calls.

## Features Overview

*   **Dashboard**: View key process indicators (KPIs) and quick navigation.
*   **Process Analyzer**: Analyze uploaded process data, view metrics, and generate AI-powered insights and process flow visualizations.
*   **AI Chat Assistant**: Interact with an AI assistant (powered by Google Gemini) to ask questions about your process data. Supports voice input/output (browser permitting).
*   **Data Upload**: Upload process event logs in CSV or JSON format.
*   **About Page**: Information about the application.

## Project Structure

```
/
├── components/          # React components for different pages/UI parts
│   ├── AboutPage.tsx
│   ├── ChatAssistantPage.tsx
│   ├── DashboardPage.tsx
│   ├── DataUploadPage.tsx
│   └── ProcessAnalyzerPage.tsx
├── services/            # Service for interacting with Gemini API
│   └── geminiService.ts
├── utils/               # Utility functions
│   └── processUtils.ts
├── App.tsx              # Main application component, routing, global state
├── constants.ts         # Application-wide constants
├── index.html           # Main HTML file, entry point for the browser
├── index.tsx            # React root rendering logic
├── metadata.json        # Application metadata (name, description, permissions)
├── README.md            # This file
└── types.ts             # TypeScript type definitions
```

## Important Note on API Key Security

The method described above for setting the `API_KEY` in `index.html` (by defining `window.process.env.API_KEY`) is **strictly for local development and testing purposes.**

*   **NEVER commit your actual API key to version control (e.g., Git).**
*   In a production environment, API keys should be managed securely. This typically involves injecting them during a build process or having a backend server handle API requests, where the key is stored as an environment variable on the server.

This application, in its current frontend-only structure, relies on the local setup for the API key. For a production deployment, a different strategy for API key management would be essential.
