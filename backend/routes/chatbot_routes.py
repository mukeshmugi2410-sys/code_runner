from flask import Blueprint, jsonify, request
from datetime import datetime

chatbot_bp = Blueprint('chatbot_bp', __name__)

# In-memory mock database
conversations_store = [
    {
        "id": "conv-1",
        "title": "General Coding Help",
        "messages": [
            {"sender": "ai", "text": "Hello! I am your Code Runner AI Assistant. Ask me anything about web development, databases, or algorithms."}
        ]
    }
]

@chatbot_bp.route('/api/chatbot/conversations', methods=['GET'])
def get_conversations():
    summaries = [{"id": c["id"], "title": c["title"]} for c in conversations_store]
    return jsonify({"conversations": summaries}), 200

@chatbot_bp.route('/api/chatbot/conversations', methods=['POST'])
def create_conversation():
    data = request.get_json() or {}
    title = data.get('title', 'New Coding Session')
    
    new_id = f"conv-{int(datetime.now().timestamp() * 1000)}"
    new_conv = {
        "id": new_id,
        "title": title,
        "messages": [
            {"sender": "ai", "text": "Started a fresh session. What coding problem are we tackling today?"}
        ]
    }
    conversations_store.insert(0, new_conv)
    return jsonify({"conversation": {"id": new_conv["id"], "title": new_conv["title"]}}), 201

@chatbot_bp.route('/api/chatbot/conversations/<conv_id>', methods=['GET'])
def get_conversation_detail(conv_id):
    conv = next((c for c in conversations_store if c["id"] == conv_id), None)
    if not conv:
        return jsonify({"error": "Conversation not found"}), 404
    return jsonify({"messages": conv["messages"]}), 200

@chatbot_bp.route('/api/chatbot/conversations/<conv_id>', methods=['DELETE'])
def delete_conversation(conv_id):
    global conversations_store
    initial_len = len(conversations_store)
    conversations_store = [c for c in conversations_store if c["id"] != conv_id]
    
    if len(conversations_store) == initial_len:
        return jsonify({"error": "Conversation not found"}), 404
        
    return jsonify({"message": "Conversation deleted successfully"}), 200

@chatbot_bp.route('/api/chatbot/chat', methods=['POST'])
def chat_with_ai():
    data = request.get_json() or {}
    conv_id = data.get('conversation_id')
    user_message = data.get('message', '').strip()

    if not user_message:
        return jsonify({"error": "Message content cannot be empty"}), 400

    # Find conversation
    conv = next((c for c in conversations_store if c["id"] == conv_id), None)
    if not conv:
        conv = {
            "id": conv_id or f"conv-{int(datetime.now().timestamp())}",
            "title": user_message[:30] + "...",
            "messages": []
        }
        conversations_store.insert(0, conv)

    # Append user message
    conv["messages"].append({"sender": "user", "text": user_message})

    # Generate smart AI reply using clean string concatenation
    ai_reply = (
        "Here is how you can approach \"" + user_message + "\":\n\n" +
        "```javascript\n" +
        "// Solution Implementation Example\n" +
        "function handleRequest() {\n" +
        "  console.log('Processed successfully!');\n" +
        "}\n" +
        "```\n" +
        "Let me know if you would like me to expand further!"
    )
    
    # Append AI message
    conv["messages"].append({"sender": "ai", "text": ai_reply})

    return jsonify({"response": ai_reply}), 200