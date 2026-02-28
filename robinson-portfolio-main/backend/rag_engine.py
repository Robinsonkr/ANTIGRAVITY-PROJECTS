import os
import tempfile
from dotenv import load_dotenv

# Load environment variables from the .env file in the same directory as this script
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)

from langchain_community.document_loaders import TextLoader  # noqa: E402
from langchain_text_splitters import CharacterTextSplitter  # noqa: E402
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI  # noqa: E402
from langchain_community.vectorstores import FAISS  # noqa: E402
from langchain.chains import create_retrieval_chain  # noqa: E402
from langchain.chains.combine_documents import create_stuff_documents_chain  # noqa: E402
from langchain_core.prompts import ChatPromptTemplate  # noqa: E402

import google.generativeai as genai  # noqa: E402

# Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    print("WARNING: GOOGLE_API_KEY not found. Please check your .env file.")
else:
    # Set it globally in the environment and the SDK
    os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY
    genai.configure(api_key=GOOGLE_API_KEY)
    print(f"Loaded API Key: {GOOGLE_API_KEY[:5]}...{GOOGLE_API_KEY[-5:]}")

KNOWLEDGE_BASE_FILE = os.path.join(os.path.dirname(__file__), "knowledge_base.txt")
INDEX_PATH = os.path.join(tempfile.gettempdir(), "faiss_index")


def initialize_rag():
    print("Initializing RAG engine...")

    # 1. Load data
    if not os.path.exists(KNOWLEDGE_BASE_FILE):
        raise FileNotFoundError(f"Knowledge base file not found: {KNOWLEDGE_BASE_FILE}")

    print(f"Loading knowledge base from {KNOWLEDGE_BASE_FILE}")
    loader = TextLoader(KNOWLEDGE_BASE_FILE, encoding='utf-8')
    documents = loader.load()

    # 2. Split text
    print("Splitting text into chunks...")
    text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    texts = text_splitter.split_documents(documents)

    # 3. Create embeddings and vector store
    print("Creating embeddings and vector store...")
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001", google_api_key=GOOGLE_API_KEY)

    if os.path.exists(INDEX_PATH):
        print(f"Loading existing FAISS index from {INDEX_PATH}")
        vector_store = FAISS.load_local(INDEX_PATH, embeddings, allow_dangerous_deserialization=True)
    else:
        print("Generating new FAISS index...")
        vector_store = FAISS.from_documents(texts, embeddings)
        print(f"Saving FAISS index to {INDEX_PATH}")
        vector_store.save_local(INDEX_PATH)

    # 4. Initialize LLM
    print("Initializing Gemini LLM...")
    llm = ChatGoogleGenerativeAI(model="gemini-flash-latest", google_api_key=GOOGLE_API_KEY, temperature=0.1)

    # 5. Create modern RAG Chain
    print("Creating RAG chain...")
    system_prompt = (
        "You are a helpful AI assistant for Robinson KR's personal portfolio website. "
        "Use the following pieces of retrieved context from Robinson's resume and portfolio to answer the user's question. "
        "If you don't know the answer based on the context, just say that you don't know, don't try to make up an answer. "
        "Keep the answer concise and professional."
        "\n\n"
        "{context}"
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("human", "{input}"),
        ]
    )

    question_answer_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(vector_store.as_retriever(), question_answer_chain)

    print("RAG engine initialization complete.")
    return rag_chain


# Global chain instance
rag_chain = None


def get_answer(query):
    global rag_chain
    try:
        if rag_chain is None:
            rag_chain = initialize_rag()

        print(f"Processing query: {query}")
        result = rag_chain.invoke({"input": query})
        print(f"Response generated: {result['answer'][:50]}...")
        return result["answer"]
    except Exception as e:
        error_msg = f"Error in RAG engine: {str(e)}"
        print(error_msg)
        return f"Sorry, I encountered an error while processing your request. ({str(e)})"
