import json
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

# Define the model name
MODEL_NAME = 'sentiment_ananalysis/emotion_model'  # Corrected model path

# Load tokenizer and model
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)

# Emotion labels (adjust based on your model)
emotion_labels = ['happy', 'sad', 'angry', 'fearful']

# Function to predict emotion from text input
def predict_emotion(text):
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=128)
    with torch.no_grad():
        outputs = model(**inputs)
    
    logits = outputs.logits
    predicted_class = torch.argmax(logits, dim=-1).item()  # Get the class with the highest score
    emotion = emotion_labels[predicted_class]  # Get the corresponding emotion label
    return emotion

if __name__ == "__main__":
    import sys
    text_input = sys.argv[1]  # Input is passed from Node.js
    predicted_emotion = predict_emotion(text_input)
    
    # Only output the result as JSON, no extra logging
    result = {"emotion": predicted_emotion}
    print(json.dumps(result))  # Ensure only JSON is printed
