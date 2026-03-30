# imports
import json
import numpy as np
import faiss
import pickle
from sentence_transformers import SentenceTransformer
import ollama

# model + paths
model = SentenceTransformer('all-MiniLM-L6-v2')

DATA_PATH = "output/companies_act_dataset.json"
EMBEDDING_PATH = "output/embeddings.npy"
METADATA_PATH = "output/metadata.pkl"
FAISS_PATH = "output/faiss_index.bin"


# =========================
# FUNCTIONS (ALL ABOVE MAIN)
# =========================

def load_data():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def create_embeddings():
    data = load_data()
    texts, metadata = [], []

    for item in data:
        text = f"Section {item['section_number']}: {item['section_title']} {item['content']}"
        texts.append(text)
        metadata.append(item)

    embeddings = model.encode(texts, show_progress_bar=True)
    np.save(EMBEDDING_PATH, embeddings)

    with open(METADATA_PATH, "wb") as f:
        pickle.dump(metadata, f)

    print("✅ Embeddings created!")


def build_faiss():
    embeddings = np.load(EMBEDDING_PATH).astype('float32')
    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(embeddings)
    faiss.write_index(index, FAISS_PATH)
    print("✅ FAISS index built!")


def search(query, top_k=2):
    index = faiss.read_index(FAISS_PATH)

    with open(METADATA_PATH, "rb") as f:
        metadata = pickle.load(f)

    import re
    match = re.search(r'\b\d+\b', query)

    if match:
        section_num = match.group()
        for item in metadata:
            if item["section_number"] == section_num:
                return [item]

    query_vector = model.encode([query]).astype('float32')
    distances, indices = index.search(query_vector, top_k)

    return [metadata[i] for i in indices[0]]


def generate_answer(query, results):
    context = ""
    for r in results:
        context += f"""
Section {r['section_number']}: {r['section_title']}
{r['content'][:800]}
"""

    prompt = f"""
You are a legal expert.

Context:
{context}

Question:
{query}

Give:
Answer:
Explanation:
Key Points:
"""

    response = ollama.chat(
        model='mistral',
        messages=[{"role": "user", "content": prompt}]
    )

    return response['message']['content']


# =========================
# MAIN (ALWAYS LAST)
# =========================
if __name__ == "__main__":

    # Run once then comment
    # create_embeddings()
    # build_faiss()

    query = input("Ask your legal question: ")

    results = search(query, top_k=2)

    answer = generate_answer(query, results)

    print("\n🧠 AI Legal Assistant:\n")
    print(answer)
