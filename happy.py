import torch
import pandas as pd
import numpy as np
from transformers import RobertaTokenizer, RobertaForSequenceClassification
from sklearn.metrics import precision_recall_fscore_support

# Load trained model and tokenizer
model_path = "love_model"  # Update if different
tokenizer = RobertaTokenizer.from_pretrained(model_path)
model = RobertaForSequenceClassification.from_pretrained(model_path)
model.eval()

# Load GoEmotions dataset
df = pd.read_csv("data/full_dataset/goemotions_1.csv")  # Update path if needed

# List of all 28 emotions
emotion_labels = [
    'admiration', 'amusement', 'anger', 'annoyance', 'approval', 'caring', 'confusion', 'curiosity', 'desire',
    'disappointment', 'disapproval', 'disgust', 'embarrassment', 'excitement', 'fear', 'gratitude', 'grief', 'joy',
    'love', 'nervousness', 'optimism', 'pride', 'realization', 'relief', 'remorse', 'sadness', 'surprise', 'neutral'
]

# Extract text and labels
texts = df['text'].tolist()
true_labels = df[emotion_labels].values  # Multi-label classification

# Get predictions for each text
predictions = []
for text in texts:
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        logits = model(**inputs).logits
    predicted_label = (logits.sigmoid() > 0.5).cpu().numpy().astype(int)  # Apply threshold (0.5)
    predictions.append(predicted_label)

# Convert lists to NumPy arrays
true_labels = np.array(true_labels)
predictions = np.array(predictions).squeeze()

# Compute Precision, Recall, and F1-score
precision, recall, f1, _ = precision_recall_fscore_support(true_labels, predictions, average=None)

# Create DataFrame for results
results_df = pd.DataFrame({
    "Emotion": emotion_labels,
    "Precision": precision,
    "Recall": recall,
    "F1-Score": f1
})

# Display results
print(results_df)

# Save results to CSV
results_df.to_csv("emotion_evaluation_results.csv", index=False)
