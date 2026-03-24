# 🚀 FinanceAI Pro: The Intelligent Financial Operating System

[![Live Preview](https://img.shields.io/badge/Live%20Preview-Vercel-blue?style=for-the-badge&logo=vercel)](https://finance-ai-agent-nine.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge)](https://finance-ai-agent-nine.vercel.app/)

**FinanceAI Pro** is a cutting-edge, AI-powered financial management platform designed for modern professionals. It combines real-time data aggregation, autonomous AI agents, and a resilient "local-first" architecture to provide a seamless, multilingual financial experience.

---

## ✨ Key Features

### 🌍 Global Localization (New!)
*   **Fully Multilingual**: Support for **English, Hindi (हिन्दी), Telugu (తెలుగు), Tamil (தமிழ்), and Malayalam (മലയാളം)**.
*   **Dynamic Translation**: Instant UI switching across the entire platform, including charts, labels, and AI insights.

### 🤖 Autonomous AI Agents
*   **Risk & Sell Agent**: Monitors your portfolio 24/7 for high-risk positions and suggests/executes sells based on your risk appetite.
*   **Stock Monitoring Agent**: Real-time polling (10s intervals) for price shifts with instant toast notifications.
*   **Smart Savings Agent**: Analyzes income/expense patterns to suggest automated surplus transfers.

### 📊 Comprehensive Dashboard
*   **Real-Time Analytics**: Visualise your net worth, asset allocation, and market performance in beautiful, glassmorphic charts.
*   **Investment Portfolio**: Track stocks, mutual funds, and crypto in one place with live P/L feedback.
*   **Tax Optimization**: Compare Old vs. New tax regimes and get personalized recommendations.

### 🛡️ Resilient Architecture
*   **Local-First Persistence**: Data persists in `localStorage` even if the cloud (Firestore) is offline, ensuring your data is always available.
*   **Cloud Sync**: Automatic background synchronization with Google Firebase for multi-device access.
*   **E2E Encryption**: Enterprise-grade security for your sensitive financial data.

---

## 🛠️ Tech Stack

*   **Frontend**: React 18, Vite, TypeScript
*   **Styling**: Material UI (MUI), Framer Motion (Animations)
*   **State Management**: Zustand (Lightweight & Reactive)
*   **Backend**: Firebase (Auth, Firestore, Hosting)
*   **AI Engine**: Google Gemini API, Vertex AI
*   **Financial Data**: Finnhub API (Stocks), Binance API (Crypto)

---

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+
*   npm or yarn

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/saisushanthmoturi/FinanceAI-Agent.git
    cd FinanceAI-Agent
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory and add your keys:
    ```env
    VITE_FIREBASE_API_KEY=your_key
    VITE_GEMINI_API_KEY=your_key
    VITE_FINNHUB_API_KEY=your_key
    ```

4.  **Launch Local Development**
    ```bash
    npm run dev
    ```

---

## 🌐 Live Deployment

The application is deployed on Vercel and can be accessed at:  
👉 **[https://finance-ai-agent-nine.vercel.app/](https://finance-ai-agent-nine.vercel.app/)**

---

## 🤝 Contributing

Contributions are welcome! If you have ideas for new agents or better localization support, feel free to open a PR.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---
*Built with ❤️ by the FinanceAI Team.*
- see the LICENSE file for details.




