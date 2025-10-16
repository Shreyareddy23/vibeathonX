#flask for creating web-application, request: to get incoming data from a POST request, jsonify :to send a json response
from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import numpy as np
import torch.nn.functional as F #relu sof
from model import EmotionTransformer  # Assuming the model class is saved as model.py

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the pre-trained emotion model
device = 'cuda' if torch.cuda.is_available() else 'cpu'#compute unified de arc
model = EmotionTransformer(input_dim=1404).to(device)
model.load_state_dict(torch.load('best_model.pth'))#Loads pre-trained model weights from 'best_model.pth'.
model.eval()

# Route to handle emotion prediction
@app.route('/predict', methods=['POST'])#this set ups a POST endpoint at /predict
def predict():
    try:
        # Receive landmarks data from POST request
        data = request.get_json()
        if not data or 'landmarks' not in data:
            print("Error: No landmarks data in request")
            return jsonify({'error': 'No landmarks data provided'}), 400

        landmarks = data['landmarks']
        if not isinstance(landmarks, list):
            print(f"Error: Landmarks must be a list, got {type(landmarks)}")
            return jsonify({'error': 'Landmarks must be a list'}), 400

        # Convert landmarks to numpy array and check shape
        landmarks_array = np.array(landmarks)
        print(f"Received landmarks shape: {landmarks_array.shape}")
        
        # Flatten the landmarks into a single array
        landmarks_flat = landmarks_array.flatten()
        print(f"Flattened landmarks shape: {landmarks_flat.shape}")
        
        if landmarks_flat.shape[0] != 1404:
            print(f"Error: Expected 1404 features, got {landmarks_flat.shape[0]}")
            return jsonify({
                'error': f'Invalid landmarks shape. Expected 1404 features, got {landmarks_flat.shape[0]}',
                'received_shape': landmarks_array.shape,
                'flattened_shape': landmarks_flat.shape
            }), 400

        # Convert to tensor and move to device
        landmarks_tensor = torch.tensor(landmarks_flat, dtype=torch.float32).to(device)
        print(f"Initial tensor shape: {landmarks_tensor.shape}")
        
        # Reshape to match model's expected input
        landmarks_tensor = landmarks_tensor.view(1, 1404)  # Explicitly reshape to [batch_size, sequence_length]
        print(f"Reshaped tensor shape: {landmarks_tensor.shape}")

        # Predict emotion
        with torch.no_grad():
            print(f"Input tensor shape before model: {landmarks_tensor.shape}")
            output = model(landmarks_tensor)

            # Print the raw model output (logits) raw unnormalized o/p by model
            print(f"Raw model output: {output}")

            # Apply softmax to get probabilities
            probabilities = F.softmax(output, dim=1)

            # Print the probabilities
            print(f"Probabilities: {probabilities}")

            # Get the predicted class (index of the highest probability)
            _, predicted = torch.max(probabilities, 1)

        # Get predicted emotion
        emotion = get_emotion_label(predicted.item())
        print(f"Predicted emotion: {emotion}")

        return jsonify({'emotion': emotion})

    except Exception as e:
        print(f"Error in predict endpoint: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 400

# Function to map model output to emotion label
def get_emotion_label(index):
    emotion_labels = ['Anger', 'Disgust', 'Fear', 'Happiness', 'Sadness']  # Removed 'Surprise' to match 5 classes
    # Check if the predicted index is within bounds
    if index < len(emotion_labels):
        return emotion_labels[index]
    else:
        return 'Unknown'  # In case the index is out of range

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True, port=5001)
