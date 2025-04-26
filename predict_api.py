# predict_api.py
from flask import Flask, request, jsonify
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import os

app = Flask(__name__)

# Load model once when server starts
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, "love_model")
tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForSequenceClassification.from_pretrained(model_path)

# API route
@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()

    if not data or 'text' not in data:
        return jsonify({"error": "No input text provided"}), 400

    user_input_text = data['text']

    # Tokenize input text
    inputs = tokenizer(user_input_text, return_tensors="pt", truncation=True, max_length=512)

    # Make prediction
    with torch.no_grad():
        outputs = model(**inputs)
        predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
        predicted_class_idx = torch.argmax(predictions, dim=-1).item()

    # Emotion labels
    emotion_labels = ['admiration', 'amusement', 'anger', 'annoyance', 'approval', 'caring', 
                      'confusion', 'curiosity', 'desire', 'disappointment', 'disapproval', 
                      'disgust', 'embarrassment', 'excitement', 'fear', 'gratitude', 'grief', 
                      'joy', 'love', 'nervousness', 'optimism', 'pride', 'realization', 
                      'relief', 'remorse', 'sadness', 'surprise', 'neutral']

    predicted_emotion = emotion_labels[predicted_class_idx]

    return jsonify({"predicted_emotion": predicted_emotion})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
