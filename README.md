HyperHealth Voice

HyperHealth Voice is an AI-powered system designed to empower doctors by enabling them to extract actionable insights from patient reports using natural voice commands. By leveraging knowledge graphs, vector embeddings, and advanced AI, it simplifies healthcare data accessibility and enhances decision-making.
🚀 Features

    Voice Command Support: Interact with patient data effortlessly using natural voice queries.
    PDF Report Parsing: Upload medical reports in PDF format and automatically convert them into structured data.
    Intelligent Search: Utilize Neo4j vector search for precise, context-aware answers to complex medical queries.
    Knowledge Graph Insights: Visualize relationships between symptoms, treatments, and patient history for better understanding.

🛠️ How It Works
Architecture

    Frontend: Built with Next.js for an intuitive and responsive user interface.
    Backend: Powered by the Modus API Framework to enable AI and database interactions.
    Data Processing:
        Vector Embeddings: Generated using Hypermode's hosted mini-LLM model to semantically represent patient data for efficient vector search.
        Neo4j Knowledge Graph: Models relationships between patient details, symptoms, and medical history.

Voice Search

Converts natural language voice commands into actionable queries, delivering instant and context-aware results.
📂 Key Files

    GenerateEmbedding.ts
        Generates embeddings for patient data using Hypermode's hosted mini-LLM model.
    GraphSearch.ts
        Executes Cypher queries on the Neo4j database.
        Includes dedicated classes for managing Patient and Doctor data.

