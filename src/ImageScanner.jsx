// ImageScanner.jsx
import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import { HfInference } from '@huggingface/inference';

const inference = new HfInference("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"); // Replace with your actual API key

const ImageScanner = () => {
    const [image, setImage] = useState(null);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [answer, setAnswer] = useState('');

    const handleImageUpload = async (e) => {
        setLoading(true);
        const file = e.target.files[0];
        if (file) {
            const { data: { text } } = await Tesseract.recognize(file, 'eng', { logger: info => console.log(info) });
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

    return (
        <div className="flex flex-col items-center p-4">
            <h1 className="text-3xl font-bold mb-4">Image Scanner</h1>
            <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="mb-4"
            />
            {loading && <p>Loading...</p>}
            {text && (
                <div className="mt-4 p-4 border rounded w-full max-w-lg">
                    <h2 className="text-xl font-semibold">Extracted Text:</h2>
                    <p>{text}</p>
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

export default ImageScanner;
    