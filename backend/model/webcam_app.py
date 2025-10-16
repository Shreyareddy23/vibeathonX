import cv2
import mediapipe as mp
import requests
import numpy as np

# Initialize MediaPipe FaceMesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(min_detection_confidence=0.5, min_tracking_confidence=0.5)

# OpenCV to capture webcam video
cap = cv2.VideoCapture(0)

# Loop to capture frames
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    # Flip the frame horizontally for a mirror effect
    frame = cv2.flip(frame, 1)

    # Convert to RGB (MediaPipe requires RGB input)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Process the frame to get landmarks
    results = face_mesh.process(rgb_frame)

    # If landmarks are detected
    if results.multi_face_landmarks:
        for landmarks in results.multi_face_landmarks:
            # Draw landmarks on the frame
            mp.solutions.drawing_utils.draw_landmarks(frame, landmarks, mp_face_mesh.FACEMESH_TESSELATION)

            # Extract the x, y, z coordinates of landmarks and prepare for sending to Flask server
            landmarks_data = []
            for landmark in landmarks.landmark:
                landmarks_data.append([landmark.x, landmark.y, landmark.z])

            # Send the landmarks to Flask server (HTTP POST)
            response = requests.post('http://127.0.0.1:5000/predict', json={'landmarks': landmarks_data})

            # If server responds, display the predicted emotion
            if response.status_code == 200:
                emotion = response.json().get('emotion', 'Unknown')

                # Print the emotion to the terminal
                print(f"Predicted Emotion: {emotion}")

                # Display the emotion on the frame
                cv2.putText(frame, f"Emotion: {emotion}", (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    # Display the frame
    cv2.imshow('FaceMesh and Emotion Prediction', frame)

    # Break on 'q' key press
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release the video capture and close OpenCV window
cap.release()
cv2.destroyAllWindows()
