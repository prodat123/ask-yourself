import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faStop, faSyncAlt, faUndo } from '@fortawesome/free-solid-svg-icons';

const CameraInput = ({ onTextExtracted }) => {
    const [showCamera, setShowCamera] = useState(false);
    const [loading, setLoading] = useState(false);
    const [extractedText, setExtractedText] = useState(''); // Store the extracted text
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [facingMode, setFacingMode] = useState('user');

    const startCamera = async () => {
        setShowCamera(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode },
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
        }
    };

    const stopCamera = () => {
        setShowCamera(false);
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach((track) => track.stop());
        }
    };

    const toggleCamera = () => {
        setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
        if (showCamera) {
            stopCamera();
            startCamera();
        }
    };

    const capturePhoto = () => {
        if (canvasRef.current && videoRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');

            processImage(dataUrl); // Call the function to process the captured image
        }
    };

    // Process the captured image using Tesseract.js to extract text
    const processImage = (imageDataUrl) => {
        setLoading(true);
        Tesseract.recognize(
            imageDataUrl,
            'eng',
            {
                logger: (m) => console.log(m),
            }
        ).then(({ data: { text } }) => {
            setLoading(false);
            setExtractedText(text.trim()); // Store the extracted text locally
            if (onTextExtracted) onTextExtracted(text.trim()); // Pass extracted text to parent if needed
        }).catch((error) => {
            console.error('Error processing image:', error);
            setLoading(false);
        });
    };

    return (
        <div className="mb-4 w-full max-w-lg mx-auto">
            <label className="block dark:text-white text-gray-700 font-semibold mb-2">Capture Image:</label>
            <div className="flex flex-col items-center">
                {showCamera ? (
                    <>
                        <video ref={videoRef} className="w-full rounded-lg shadow-lg border mb-4" />
                        <div className="flex space-x-4">
                            <button
                                onClick={capturePhoto}
                                className="bg-blue-500 w-10 text-white p-2 rounded-full shadow hover:bg-blue-600 transition-all duration-300"
                            >
                                <FontAwesomeIcon icon={faCamera} />
                            </button>
                            <button
                                onClick={stopCamera}
                                className="bg-red-500 w-10 text-white p-2 rounded-full shadow hover:bg-red-600 transition-all duration-300"
                            >
                                <FontAwesomeIcon icon={faStop} />
                            </button>
                            <button
                                onClick={toggleCamera}
                                className="bg-green-500 w-10 text-white p-2 rounded-full shadow hover:bg-green-600 transition-all duration-300"
                            >
                                <FontAwesomeIcon icon={faUndo} />
                            </button>
                        </div>
                    </>
                ) : (
                    <button
                        onClick={startCamera}
                        className="bg-primary text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-600 transition-all duration-300 flex items-center justify-center w-full"
                    >
                        <FontAwesomeIcon icon={faCamera} className="mr-2" />
                        Open Camera
                    </button>
                )}
            </div>

            {/* Loading Indicator */}
            {loading && (
                <div className="mt-4 text-blue-500">
                    <FontAwesomeIcon icon={faSyncAlt} spin />
                    <span> Processing...</span>
                </div>
            )}

            {/* Display Extracted Text */}
            {extractedText && (
                <div className="mt-4 bg-gray-100 border p-4 rounded shadow">
                    <h3 className="font-bold text-lg mb-2">Extracted Text:</h3>
                    <p>{extractedText}</p>
                </div>
            )}

            {/* Hidden Canvas for Capturing Image */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default CameraInput;
