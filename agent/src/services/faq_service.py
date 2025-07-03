import os
import sys
import json
from typing import List, Dict
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

# Add the parent directory to the path
sys.path.append(
    os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "..",
        )
    )
)


from integrates.milvus import get_milvus_client

llm = ChatOpenAI(model_name="gpt-4o-mini", temperature=0)

PROMPT_TEMPLATE = """System: Bạn là trợ lý ảo của Vexere tên là SniT. Bạn sẽ trả lời câu hỏi của người dùng dựa trên dữ liệu FAQ đặt trong thẻ <context>...</context>.
Sử dụng những thông tin được cung cấp để trả lời câu hỏi người dùng đặt bên trong thẻ <question>...</question>.
Nếu không có thông tin nào phù hợp, chỉ cần trả lời "Xin lỗi, tôi không có thông tin về câu hỏi này."
<context>
{context}
</context>
<question>
{question}
</question>
Trả lời bằng tiếng Việt, không sử dụng tiếng Anh hay bất kỳ ngôn ngữ nào khác."""


def format_context(documents: List[Dict]) -> str:
    context_parts = []
    for i, doc in enumerate(documents):
        context_parts.append(
            f"Câu trả lời thứ {i+1} được tìm thấy trong DB: {doc['answer']}"
        )
    return "\n\n".join(context_parts)


def retrieve_relevant_docs(query: str, top_k: int = 3) -> List[Dict]:
    print(f"Searching for query: '{query}' with top_k: {top_k}")

    try:
        # Get Milvus client instance
        milvus_client = get_milvus_client()
        print(f"Milvus client connected: {milvus_client.connected}")
        print(f"Milvus embeddings available: {milvus_client.embeddings is not None}")

        if not milvus_client.connected:
            raise Exception("Milvus client is not connected to cloud")

        if not milvus_client.embeddings:
            raise Exception("OpenAI embeddings not available")

        # First, convert query to embedding
        query_embedding = milvus_client.embed_query(query)

        # Then perform vector search using the embedding
        vector_results = milvus_client.search_similar(query_embedding, top_k)
        print(f"Vector search returned {len(vector_results)} results")

        if not vector_results:
            print("No results found in Milvus Cloud")
            return []

        return vector_results

    except Exception as e:
        print(f"Error retrieving documents from Milvus: {e}")
        raise e


def generate_answer_with_llm(context: str, question: str) -> str:
    if not llm:
        return "Xin lỗi, hệ thống AI hiện không khả dụng."

    try:
        prompt = PromptTemplate(
            template=PROMPT_TEMPLATE, input_variables=["context", "question"]
        )
        formatted_prompt = prompt.format(context=context, question=question)
        response = llm.invoke(formatted_prompt)

        # Extract content from response properly
        if hasattr(response, "content"):
            return response.content
        else:
            return str(response)

    except Exception as e:
        print(f"Error generating answer with LLM: {e}")
        return "Xin lỗi, đã có lỗi xảy ra khi tạo câu trả lời."


def faq_rag_chat(message: str) -> dict:
    """Main RAG chat function using Milvus Cloud vector search"""
    try:
        if not message or not message.strip():
            return {
                "success": False,
                "message": "Vui lòng nhập câu hỏi của bạn.",
                "user_question": message,
            }

        # TODO: Retrieve relevant documents from Milvus Cloud
        try:
            relevant_docs = retrieve_relevant_docs(message, top_k=1)
        except Exception as e:
            return {
                "success": False,
                "error": f"Lỗi kết nối Milvus Cloud: {str(e)}",
                "message": "Xin lỗi, hệ thống tìm kiếm đang gặp sự cố. Vui lòng thử lại sau.",
                "user_question": message,
            }

        if not relevant_docs:
            return {
                "success": True,
                "message": "Xin lỗi, tôi không tìm thấy thông tin phù hợp với câu hỏi của bạn. Vui lòng liên hệ tổng đài 1900 6484 để được hỗ trợ tốt hơn.",
                "user_question": message,
                "relevant_docs_count": 0,
            }

        # TODO: Generate answer using LLM
        try:
            context = format_context(relevant_docs)
            print(f"Context sent to LLM: {context[:200]}...")
            answer = generate_answer_with_llm(context=context, question=message)
        except Exception as e:
            print(f"Error generating answer with LLM: {e}")
            # Fallback to simple answer from the most relevant document
            answer = f"Dựa trên thông tin FAQ: {relevant_docs[0]['answer']}"

        return {
            "success": True,
            "message": answer,
            "user_question": message,
            "relevant_docs_count": len(relevant_docs),
        }

    except Exception as e:
        print(f"Error in rag_chat: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Xin lỗi, đã có lỗi xảy ra khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.",
            "user_question": message,
        }
