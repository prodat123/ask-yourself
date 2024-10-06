import React, { useState, useEffect } from 'react';

import axios from 'axios';

const API_URL = 'http://localhost:3003/api';

// Fetch all answers
export const getAllAnswers = async () => {
    try {
        const response = await axios.get(`${API_URL}/answers`);
        return response.data;
    } catch (error) {
        console.error('Error fetching all answers:', error);
        throw error;
    }
};

const ResultsDisplay = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const data = await getAllAnswers();
                setResults(data);
            } catch (err) {
                setError('Failed to fetch results.');
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, []);

    const deleteAllAnswers = async () => {
        try {
            await axios.delete('http://localhost:3003/api/answers');
            alert('All data deleted successfully');
        } catch (error) {
            console.error('Error deleting data:', error);
            alert('There was an error deleting the data.');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-4">All Submitted Answers</h1>
            <button 
                onClick={deleteAllAnswers} 
                className="px-4 py-2 mb-2 bg-red-500 text-white rounded"
            >
                Delete All Answers
            </button>
            <table className="min-w-full bg-white border border-gray-200 rounded-md dark:bg-gray-900">
                <thead>
                    <tr>
                        <th className="py-2 px-4 border-b">ID</th>
                        <th className="py-2 px-4 border-b">Question</th>
                        <th className="py-2 px-4 border-b">Answer</th>
                        <th className="py-2 px-4 border-b">Correct</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map(result => (
                        <tr key={result.id}>
                            <td className="py-2 px-4 border-b">{result.id}</td>
                            <td className="py-2 px-4 border-b">{result.question}</td>
                            <td className="py-2 px-4 border-b">{result.answer}</td>
                            <td className="py-2 px-4 border-b">{result.correct}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ResultsDisplay;
