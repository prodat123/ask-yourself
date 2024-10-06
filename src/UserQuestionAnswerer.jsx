import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { HfInference } from '@huggingface/inference';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKeyboard, faCamera, faUpload, faSyncAlt } from '@fortawesome/free-solid-svg-icons';

const inference = new HfInference("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"); // Replace with your actual API key

const UserQuestionAnswerer = () => {
    const [question, setQuestion] = useState('');
    const [text, setText] = useState('');
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [isImage, setIsImage] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [image, setImage] = useState(null);
    const [isBackCamera, setIsBackCamera] = useState(true); // Track which camera is active (front or back)

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleQuestionChange = (e) => setQuestion(e.target.value);

    const startCamera = async () => {
        setShowCamera(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: isBackCamera ? { exact: "environment" } : "user" } // Toggle between front and back
            });
            videoRef.current.srcObject = stream;
        } catch (error) {
            console.error('Error accessing camera:', error);
        }
    };

    const stopCamera = () => {
        const stream = videoRef.current?.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setShowCamera(false);
    };

    const capturePhoto = () => {
        const context = canvasRef.current.getContext('2d');
        const video = videoRef.current;

        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;

        // Draw the video frame to the canvas
        context.drawImage(video, 0, 0, canvasRef.current.width, canvasRef.current.height);

        const imageUrl = canvasRef.current.toDataURL('image/png');
        setImage(imageUrl);
        stopCamera(); // Stop the camera after capturing the photo
        processImage(imageUrl);
    };

    const processImage = async (imageUrl) => {
        setLoading(true);
        try {
            const { data: { text } } = await Tesseract.recognize(imageUrl, 'eng', {
                tessedit_char_whitelist: '0123456789+-*/=()abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', // Whitelist math symbols and text
                logger: info => console.log(info)
            });
            setText(text);
            await fetchAnswer(text);
        } catch (error) {
            console.error('Error processing image:', error);
        }
        setLoading(false);
    };

    const handleImageUpload = async (e) => {
        setLoading(true);
        const file = e.target.files[0];
        if (file) {
            const { data: { text } } = await Tesseract.recognize(file, 'eng', {
                tessedit_char_whitelist: '0123456789+-*/=()abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', // Whitelist math symbols and text
                logger: info => console.log(info)
            });
            setText(text);
            await fetchAnswer(text);
        }
        setLoading(false);
    };

    const fetchAnswer = async (questionText) => {
        try {
            const response = await inference.chatCompletionStream({
                model: "meta-llama/Meta-Llama-3-8B-Instruct",
                messages: [{ role: "user", content: questionText }],
                max_tokens: 500,
            });

            let answerText = '';
            for await (const chunk of response) {
                answerText += chunk.choices[0]?.delta?.content || "";
            }
            setAnswer(answerText.trim());
        } catch (error) {
            console.error('Error fetching answer:', error);
        }
    };

    const handleSubmit = async () => {
        if (question) {
            setLoading(true);
            let fullQuestion = "Answer this question as accurately as possible: " + question; 
            await fetchAnswer(fullQuestion);
            setLoading(false);
        }
    };

    const toggleImageInput = () => {
        setIsImage(prev => !prev);
        setText(''); // Clear text when switching modes
        setAnswer(''); // Clear answer when switching modes
        stopCamera(); // Stop camera when switching modes
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const flipCamera = () => {
        setIsBackCamera(prev => !prev);
        stopCamera(); // Stop the current camera stream
        startCamera(); // Restart the camera with the new facing mode
    };

    return (
        <div className={`flex flex-col items-center p-4 ${text || answer ? 'h-auto' : 'h-screen'}`}>
            <h1 className="text-3xl font-bold mb-4 text-blue-500">Answer Questions</h1>

            {/* Icon Tabs */}
            <div className="flex space-x-4 mb-4">
                <button
                    onClick={() => setIsImage(false)}
                    className={`p-4 ${!isImage ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-full`}
                >
                    <FontAwesomeIcon icon={faKeyboard} size="2x" />
                </button>
                <button
                    onClick={() => setIsImage(true)}
                    className={`p-4 ${isImage ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-full`}
                >
                    <FontAwesomeIcon icon={faCamera} size="2x" />
                </button>
            </div>

            {isImage ? (
                <div className="flex flex-col items-center w-full">
                    {showCamera ? (
                        <>
                            {/* Responsive Video Container */}
                            <div className="relative w-full h-96 overflow-hidden mb-4 border rounded">
                                <video ref={videoRef} autoPlay className="absolute top-0 left-0 w-full h-full object-cover" />
                            </div>
                            <button
                                className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
                                onClick={capturePhoto}
                            >
                                Capture Photo
                            </button>
                            <button
                                className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
                                onClick={flipCamera}
                            >
                                <FontAwesomeIcon icon={faSyncAlt} className="mr-2" />
                                Flip Camera
                            </button>
                            <canvas ref={canvasRef} style={{ display: 'none' }} />
                        </>
                    ) : (
                        <>
                            <button
                                className="bg-blue-500 w-full font-semibold text-white px-4 py-2 rounded mb-4"
                                onClick={startCamera}
                            >
                                Open Camera
                            </button>
                            <div className="relative mb-4">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    ref={fileInputRef}
                                    className="hidden"
                                />
                                <button
                                    onClick={triggerFileInput}
                                    className="bg-blue-500 font-semibold text-white px-4 py-2 rounded flex items-center space-x-2"
                                >
                                    <FontAwesomeIcon icon={faUpload} />
                                    <span>Upload Image</span>
                                </button>
                            </div>
                        </>
                    )}
                    {loading && <p>Loading...</p>}
                    {text && (
                        <div className="mt-4 p-4 border rounded w-full max-w-lg">
                            <h2 className="text-xl font-semibold">Extracted Text:</h2>
                            <p>{text}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-full max-w-lg">
                    <textarea
                        className="border focus:outline-none p-2 w-full rounded-md focus:border-blue-500 max-w-lg mb-4 dark:bg-gray-800"
                        placeholder="Enter your question..."
                        value={question}
                        onChange={handleQuestionChange}
                        rows="4"
                    />
                    <button
                        className="bg-blue-500 w-full p-3 mt-4 text-lg font-semibold text-white rounded-lg transition-colors duration-300"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'Generate Answer'}
                    </button>
                </div>
            )}

            {answer && (
                <div className="mt-4 p-4 border rounded w-full max-w-lg">
                    <h2 className="text-xl font-semibold">Answer:</h2>
                    <p>{answer}</p>
                </div>
            )}
        </div>
    );
};

export default UserQuestionAnswerer;
