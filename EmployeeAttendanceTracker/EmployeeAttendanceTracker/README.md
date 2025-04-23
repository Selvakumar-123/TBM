# Employee Attendance Tracker

A web application for tracking employee attendance with form-based check-ins, signature capture, and PDF report generation.

## Features

- Record employee attendance with name, company, and supervisor information
- Touch-enabled signature drawing functionality
- View attendance records in a sortable table
- Generate PDF reports filtered by date
- Data stored in Firebase Firestore

## Deployment Guide for Railway

### Prerequisites

1. A Railway account (sign up at [railway.app](https://railway.app/))
2. Firebase project with Firestore enabled

### Steps to Deploy

1. Fork or clone this repository to your GitHub account

2. Log into Railway and create a new project:
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account and select this repository
   - Railway will automatically detect the configuration

3. Set up the required environment variables:
   - Go to your project settings in Railway
   - Add the following environment variables:

   ```
   FIREBASE_API_KEY=your-api-key
   FIREBASE_AUTH_DOMAIN=your-auth-domain
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-storage-bucket
   FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   FIREBASE_APP_ID=your-app-id
   NODE_ENV=production
   ```

4. Deploy your application:
   - Railway will automatically build and deploy your application
   - Once deployment is complete, you can access your application via the generated domain

### Manual Deployment with Railway CLI

If you prefer to use the Railway CLI for deployment:

1. Install the Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Link your project:
   ```bash
   railway link
   ```

4. Deploy your project:
   ```bash
   railway up
   ```

## Development

### Prerequisites

- Node.js 20 or higher
- npm or yarn

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/employee-attendance-tracker.git
   cd employee-attendance-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your Firebase credentials

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`.