import os
import cv2
import mediapipe as mp
from flask import Flask, render_template, request, send_file, redirect, url_for
from werkzeug.utils import secure_filename

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'output'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Initialize MediaPipe Pose Solutions
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

def process_video(input_path, output_path):
    # Open the uploaded video
    cap = cv2.VideoCapture(input_path)
    
    # Get video properties
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    # Define the codec and create VideoWriter object
    # 'mp4v' is widely compatible for web output
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    # Setup MediaPipe Pose instance
    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while cap.isOpened():
            ret, frame = cap.get()
            if not ret:
                break

            # Recolor image to RGB for MediaPipe
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            
            # Make detection
            results = pose.process(image)
            
            # Recolor back to BGR for OpenCV rendering
            image.flags.writeable = True
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
            
            # Draw skeleton landmarks on the frame
            if results.pose_landmarks:
                mp_drawing.draw_landmarks(
                    image, 
                    results.pose_landmarks, 
                    mp_pose.POSE_CONNECTIONS,
                    mp_drawing.DrawingSpec(color=(245,117,66), thickness=2, circle_radius=2),
                    mp_drawing.DrawingSpec(color=(245,66,230), thickness=2, circle_radius=2)
                )
            
            # Write the processed frame to the output file
            out.write(image)

    cap.release()
    out.release()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_video():
    if 'video' not in request.files:
        return redirect(request.url)
    
    file = request.files['video']
    if file.filename == '':
        return redirect(request.url)
    
    if file:
        filename = secure_filename(file.filename)
        input_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        output_filename = "processed_" + filename
        output_path = os.path.join(OUTPUT_FOLDER, output_filename)
        
        file.save(input_path)
        
        # Process the video (this might take a moment depending on length)
        process_video(input_path, output_path)
        
        return send_file(output_path, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
