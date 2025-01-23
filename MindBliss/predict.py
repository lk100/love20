from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import sys
import json

# Check if the argument is passed
if len(sys.argv) < 2:
    print(json.dumps({"error": "No input text provided"}))
    sys.exit(1)

# Load the saved model and tokenizer
model_path = "./love_model"
tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForSequenceClassification.from_pretrained(model_path)

# Get the user's input text
user_input_text = sys.argv[1]

# Tokenize input text
inputs = tokenizer(user_input_text, return_tensors="pt", truncation=True, max_length=512)

# Make prediction
with torch.no_grad():
    outputs = model(**inputs)
    predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
    predicted_class_idx = torch.argmax(predictions, dim=-1).item()

# Map index to emotion label
emotion_labels = ['admiration', 'amusement', 'anger', 'annoyance', 'approval', 'caring', 
                   'confusion', 'curiosity', 'desire', 'disappointment', 'disapproval', 
                   'disgust', 'embarrassment', 'excitement', 'fear', 'gratitude', 'grief', 
                   'joy', 'love', 'nervousness', 'optimism', 'pride', 'realization', 
                   'relief', 'remorse', 'sadness', 'surprise', 'neutral']


predicted_emotion = emotion_labels[predicted_class_idx]

# Output the prediction as JSON
response = {
    "predicted_emotion": predicted_emotion
}

# Print the response to stdout
print(json.dumps(response))
