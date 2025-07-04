from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from .faq_service import faq_rag_chat
from .after_service_service import after_service_chat
from integrates.milvus import get_milvus_client

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)


def classify_route(message: str) -> str:
    # Step 1: try matching FAQ via Milvus
    try:
        milvus = get_milvus_client()
        embedding = milvus.embed_query(message)
        results = milvus.search_similar(embedding, top_k=1)
        if results and results[0]["score"] >= 0.85:
            print(f"[Milvus matched FAQ] score={results[0]['score']:.2f}")
            return "faq"
    except Exception as e:
        print(f"[Milvus fallback triggered] {e}")

    # Step 2: fallback to LLM if no good match
    system_prompt = (
        "Bạn là AI phân loại câu hỏi của người dùng thành một trong hai loại: `faq` hoặc `after_service`.\n\n"
        "- `faq`: là những câu hỏi tra cứu thông tin như chính sách, hoàn tiền, hành lý, giờ chạy...\n"
        "- `after_service`: là những yêu cầu xử lý sau bán như: đổi vé, huỷ vé, bị trừ tiền nhiều lần, xuất hoá đơn, khiếu nại...\n\n"
        "Chỉ trả về một trong hai loại trên, không giải thích gì thêm.\n\n"
    )

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=message),
    ]

    response = llm.invoke(messages)
    print(f"[LLM classify fallback] result={response.content.strip()}")
    return response.content.strip().lower()


def chat_service(message: str, chat_history: list[dict], chat_id: str = None) -> dict:
    route = classify_route(message)
    if route == "faq":
        return faq_rag_chat(message=message, chat_id=chat_id)
    elif route == "after_service":
        return after_service_chat(message)
