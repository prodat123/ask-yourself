import React, { useState, useEffect } from 'react';
import { getHardQuestionsByUserId, deleteQuestion } from './supabase/SupabaseFunctions'; // Import deleteQuestion function
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNoteSticky, faX } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

const QuestionList = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1); // State for current page
    const questionsPerPage = 5; // Number of questions per page
    const userId = localStorage.getItem("userId");

    useEffect(() => {
        const fetchQuestions = async () => {
            setLoading(true);
            setError(null);

            try {
                const data = await getHardQuestionsByUserId(userId);
                if (data) {
                    setQuestions(data);
                } else {
                    setError('No questions found.');
                }
            } catch (err) {
                setError('Failed to load questions.');
                console.error('Error fetching questions:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchQuestions();
    }, [userId]);

    // Function to handle deletion of a question
    const handleDelete = async (questionId) => {
        const confirmed = window.confirm("Are you sure you want to delete this question?");
        if (confirmed) {
            const result = await deleteQuestion(questionId);
            if (result && !result.error) {
                // Remove deleted question from state
                setQuestions(questions.filter((question) => question.id !== questionId));
                console.log('Question deleted successfully');
            } else {
                console.error('Failed to delete question');
            }
        }
    };

    // Calculate the index range for questions on the current page
    const indexOfLastQuestion = currentPage * questionsPerPage;
    const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
    const currentQuestions = questions.slice(indexOfFirstQuestion, indexOfLastQuestion);

    const totalPages = Math.ceil(questions.length / questionsPerPage);

    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handlePageSelect = (e) => {
        const selectedPage = Number(e.target.value);
        if (selectedPage >= 1 && selectedPage <= totalPages) {
            setCurrentPage(selectedPage);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-20 text-gray-500">Loading questions...</div>;
    }

    if (error) {
        return <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg border border-primary">
            <h1 className="text-3xl font-bold text-primary mb-6 text-center">Saved Questions</h1>

            <div className="flex justify-between items-center mb-4">
                <button 
                    onClick={prevPage} 
                    disabled={currentPage === 1}
                    className="bg-primary text-white px-4 py-2 rounded-lg disabled:bg-gray-300"
                >
                    Previous
                </button>

                {/* Page Selection */}
                <div className="flex items-center space-x-2">
                    <span>Page</span>
                    <input 
                        type="number" 
                        value={currentPage} 
                        onChange={handlePageSelect} 
                        min="1" 
                        max={totalPages}
                        className="w-16 text-center border border-gray-300 rounded-lg"
                    />
                    <span>of {totalPages}</span>
                </div>

                <button 
                    onClick={nextPage} 
                    disabled={currentPage === totalPages}
                    className="bg-primary text-white px-4 py-2 rounded-lg disabled:bg-gray-300"
                >
                    Next
                </button>
            </div>
            <ul className="space-y-4">
                {currentQuestions.map((question, index) => (
                    <li key={question.id} className="p-4 bg-gray-100 rounded-lg shadow-md relative">
                        {/* Question Text */}
                        <p className="text-gray-700">
                            <strong className="text-gray-900">Question {(indexOfFirstQuestion + index + 1)}:</strong> 
                            <p dangerouslySetInnerHTML={{ __html: question.question_text }}></p>
                        </p>

                        {/* Correct Answer */}
                        <div className="text-gray-700 mt-2">
                            <strong className="text-gray-900 mr-1">Answer:</strong> 
                            <span dangerouslySetInnerHTML={{ __html: question.correct_answer }}></span>
                        </div>
                        <Link
                            to={{
                                pathname: '/notes',
                                search: `?question=${encodeURIComponent(question.question_text)}`, // Use the variable dynamically
                            }}
                            className="relative text-center mt-3 lg:absolute lg:bottom-2 lg:right-2 px-4 py-2 rounded flex items-center justify-center hover:bg-gray-300"
                        >
                            <FontAwesomeIcon icon={faNoteSticky} />
                            <span className="ml-2">Generate Notes</span>
                        </Link>
                        {/* Delete Button */}
                        <button 
                            onClick={() => handleDelete(question.id)} 
                            className="absolute top-2 right-2 text-red-500 px-2 py-1 rounded-lg text-xs"
                        >
                            <FontAwesomeIcon icon={faX} />
                        </button>
                    </li>
                ))}
            </ul>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4">
                <button 
                    onClick={prevPage} 
                    disabled={currentPage === 1}
                    className="bg-primary text-white px-4 py-2 rounded-lg disabled:bg-gray-300"
                >
                    Previous
                </button>

                {/* Page Selection */}
                <div className="flex items-center space-x-2">
                    <span>Page</span>
                    <input 
                        type="number" 
                        value={currentPage} 
                        onChange={handlePageSelect} 
                        min="1" 
                        max={totalPages}
                        className="w-16 text-center border border-gray-300 rounded-lg"
                    />
                    <span>of {totalPages}</span>
                </div>

                <button 
                    onClick={nextPage} 
                    disabled={currentPage === totalPages}
                    className="bg-primary text-white px-4 py-2 rounded-lg disabled:bg-gray-300"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default QuestionList;
