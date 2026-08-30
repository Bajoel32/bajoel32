# github.io
Modern jewelry store e-commerce equipped with an AI RAG Chatbot, plus a standalone Admin Hub for dynamic RAG knowledge management and custom function calling.

🪙 Jewelry Store E-Commerce with AI Chatbot & Admin Hub
A modern e-commerce platform for a jewelry store featuring an AI-powered Chatbot driven by RAG (Retrieval-Augmented Generation), along with a separate Admin Hub designed for managing AI knowledge bases, dynamic custom functions, and store operations.

🌟 Key Features
🛍️ E-Commerce & Customer-Facing
Gold & Jewelry Catalog: Showcases collections, purity/carat levels, weights, and transparent real-time price updates.

Smart AI Chatbot Assistant:

Answers customer inquiries regarding products, price estimations, warranties, and personalized recommendations.

Utilizes RAG to deliver precise answers based on the latest store inventory and policies.

Function Calling / Custom Actions: Capable of triggering real-time actions such as checking stock availability, tracking order status, and facilitating direct purchases through chat.

⚙️ Standalone Admin Hub
A dedicated control panel for administrators to manage e-commerce operations alongside the AI knowledge infrastructure:

RAG Data Management (Knowledge Base):

Upload, edit, and delete reference documents (FAQs, return policies, material specs, etc.).

Automatic synchronization with vector databases to ensure AI responses remain accurate and up to date.

Custom Function & Tool Calling Configuration:

Configure and update custom API endpoints exposed to the AI Chatbot.

Dynamically adjust parameters, execution rules, and access permissions for each AI function.

E-Commerce & Chat Analytics:

Manage product inventory, gold pricing, and transactions.

Monitor customer-AI conversation histories for performance analysis and quality assurance.

🏗️ System Architecture



_______________________________________________________________________________________________

[ Customer Client ] ──► [ E-Commerce App + AI Chatbot ]
                                │
                                ▼
                       [ RAG & Vector DB ] ◄──┐
                                              │ (Update Knowledge & Functions)
[ Admin / Manager ] ──► [    Admin Hub    ] ──┘

_______________________________________________________________________________________________


🛠️ Tech Stack (Customizable)
Frontend: React.js / Next.js / Vue.js, Tailwind CSS

Backend: Node.js (Express) / Python (FastAPI / Django)

AI & RAG: LangChain / LlamaIndex, OpenAI API / Gemini API

Vector Database: Pinecone / Qdrant / ChromaDB / Pgvector

Database: PostgreSQL / MongoDB
