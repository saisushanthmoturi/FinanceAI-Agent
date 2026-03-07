FinanceAI-Agent - Corporate Finance Intelligence Platform
A comprehensive AI-powered financial analytics and automation platform designed for modern finance professionals and enterprises.

🎯 Overview
FinanceAI-Agent is an end-to-end financial intelligence platform that combines real-time data aggregation, AI-driven insights, and intelligent automation to deliver comprehensive financial management capabilities. The platform integrates multiple financial services, AI models, and data sources to provide actionable insights and automated financial decision-making. Login.tsx:173-182

✨ Key Features
📊 Real-Time Financial Monitoring
Stock Monitoring: Autonomous stock monitoring agent with real-time alerts every 10 seconds
Account Aggregation: Integration with Setu API for real-time bank account data synchronization .env.example:19-21
Multi-Asset Support: Comprehensive tracking across stocks, bank accounts, and investment portfolios
🤖 AI-Powered Intelligence
Financial Health Scoring: AI-driven health assessment using Gemini API Dashboard.tsx:86-94
Tax Optimization: Intelligent tax recommendations and regime comparison TaxOptimization.tsx:1-10
Dynamic AI Agents: Customizable autonomous agents for various financial tasks DynamicAgentsHub.tsx:1-5
🏢 Enterprise-Grade Features
Multi-User Support: Separate watchlists and financial data per user
Advanced Analytics: BigQuery integration for historical analysis and trend detection .env.example:28-29
Voice Assistant: Conversational AI with Dialogflow CX integration .env.example:23-26
🏗️ Architecture
State Management
The application uses Zustand for global state management, providing a lightweight and efficient solution for managing user authentication, dashboard data, and UI preferences across the application. Dashboard.tsx:40-42

AI Services Integratio

The platform integrates three complementary Google Cloud AI services:

Gemini API: For natural language processing and financial analysis .env.example:13-14
Vertex AI: For custom machine learning models and predictions .env.example:10-11
BigQuery: For financial analytics and data warehousing .env.example:28-29
🚀 Getting Started
Prerequisites
Node.js 18+
Firebase project
Google Cloud Platform account
API keys for integrated services
Installation
Clone the repository
git clone https://github.com/saisushanthmoturi/FinanceAI-Agent.git  
cd FinanceAI-Agent
Install dependencies
npm install
Environment Configuration
Copy the environment template and configure your API keys:
cp .env.example .env
Required environment variables: .env.example:1-34

Configuration
Firebase Setup
Configure Firebase Authentication and Firestore:

VITE_FIREBASE_API_KEY=your_firebase_api_key  
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com  
VITE_FIREBASE_PROJECT_ID=your_project_id
Google Cloud Services
Set up Google Cloud Platform services:

VITE_GOOGLE_CLOUD_PROJECT_ID=your_gcp_project_id  
VITE_VERTEX_AI_LOCATION=us-central1  
VITE_GEMINI_API_KEY=your_gemini_api_key  
VITE_BIGQUERY_DATASET_ID=financial_analytics
Financial Data APIs
Configure financial data providers:

VITE_FINNHUB_API_KEY=your_finnhub_api_key_here  
VITE_AA_API_KEY=your_aa_api_key  
VITE_AA_BASE_URL=https://api.setu.co
📱 Core Components
Dashboard
The main dashboard provides comprehensive financial overview with:

Real-time account aggregation
Financial health scoring
AI-powered recommendations
Quick action buttons for various features Dashboard.tsx:295-415
Tax Optimization
Advanced tax planning tools featuring:

Old vs New tax regime comparison
Personalized tax-saving recommendations
Investment suggestions
Loan benefits calculator TaxOptimization.tsx:4-9
Dynamic Agents Hub
Central management system for AI agents:

Pre-built agent templates
Custom agent creation (coming soon)
Agent marketplace
Real-time agent monitoring DynamicAgentsHub.tsx:165-184
🔧 Development
Running the Application
# Development mode  
npm run dev  
  
# Production build  
npm run build  
  
# Preview production build  
npm run preview
Feature Flags
Enable/disable features using environment variables: .env.example:31-34

VITE_ENABLE_VOICE=true  
VITE_ENABLE_AUTONOMOUS_ACTIONS=true  
VITE_ENABLE_SCENARIO_SIMULATION=true
📊 Data Flow
The application follows a structured data flow pattern:

Data Sources: External APIs (Finnhub, Account Aggregator, Gemini)
Service Layer: Business logic and data transformation
State Management: Zustand store for global state
UI Components: React components consuming state

🔒 Security & Compliance
Enterprise-grade security with Firebase Authentication
Data encryption in transit and at rest
Compliance with financial data regulations
Role-based access control for multi-user environments
🤝 Contributing
Fork the repository
Create a feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request
📄 License
This project is licensed under the MIT License - see the LICENSE file for details.




