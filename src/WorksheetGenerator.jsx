import React, { useEffect, useState } from 'react';
import { HfInference } from '@huggingface/inference';
import { addWorksheet, deleteWorksheet, getHardQuestionsByUserId, getWorksheetsByUserId } from './supabase/SupabaseFunctions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faFileCirclePlus, faRedo, faX } from '@fortawesome/free-solid-svg-icons';

const inference = new HfInference(process.env.REACT_APP_HUGGINGFACE_API_KEY);

function WorksheetGenerator() {
    const [questions, setQuestions] = useState([]);
    const [uniqueSubjects, setUniqueSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [loading, setLoading] = useState(true);
    const [worksheet, setWorksheet] = useState({ questions: '', answers: '' });
    const [worksheets, setWorksheets] = useState([]); // State for past worksheets
    const userId = localStorage.getItem('userId');
    const [activeSubTab, setActiveSubTab] = useState('questions');
    const [activeTab, setActiveTab] = useState('create');
    const [selectedWorksheet, setSelectedWorksheet] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [worksheetName, setWorksheetName] = useState('');


    const fetchAiContent = async (prompt) => {
        let response = '';
        try {
            for await (const chunk of inference.chatCompletionStream({
                model: "meta-llama/Meta-Llama-3-8B-Instruct",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 1500,
            })) {
                response += chunk.choices[0]?.delta?.content || "";
            }
        } catch (error) {
            console.error('Error fetching AI content:', error);
        }
        return response.trim();
    };

    const fetchHardQuestions = async () => {
        setLoading(true);
        const fetchedQuestions = await getHardQuestionsByUserId(userId);
    
        if (fetchedQuestions) {
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0); // Set the time to midnight
    
            // Calculate the date a week ago (7 days prior)
            const weekAgo = new Date(today);
            weekAgo.setUTCDate(today.getUTCDate() - 7);
    
            // Filter questions from the past week
            let filteredQuestions = fetchedQuestions.filter(question => {
                const questionDate = new Date(question.created_at);
                return questionDate >= weekAgo && questionDate < today;
            });
    
            // Get unique subjects from the filtered questions
            const subjects = [...new Set(filteredQuestions.map(q => q.question_subject))];
            setUniqueSubjects(subjects);
    
            console.log(filteredQuestions);
            setQuestions(filteredQuestions);
        } else {
            console.error('Failed to fetch questions');
        }
    
        setLoading(false);
    };    
    

    const filterQuestionsBySubject = () => {
        return questions.filter(q => q.question_subject === selectedSubject);
    };

    const formatWorksheetContent = (content) => {
        // Remove all asterisks from the content
        const cleanContent = content.replace(/\*/g, '').trim();

        const questionBlocks = cleanContent.split(/(?:Question \d+)/).filter(line => line.trim());
        let formattedQuestions = [];
        let formattedAnswers = [];

        questionBlocks.forEach((block, index) => {
            const questionMatch = block.match(/(.*?)(A\).+?)(B\).+?)(C\).+?)(D\).+?)(Answer:)(.*?)\n(Explanation:)(.*)/s);
            
            if (questionMatch) {
                const questionText = questionMatch[1].trim();
                const optionA = questionMatch[2].trim();
                const optionB = questionMatch[3].trim();
                const optionC = questionMatch[4].trim();
                const optionD = questionMatch[5].trim();
                const answer = questionMatch[7].trim();
                const explanation = questionMatch[9].trim();

                formattedQuestions.push(`
                    <h3 class="font-bold text-xl my-2">Question ${index}: ${questionText}</h3>
                    <ul class="list-disc ml-6 list-none">
                        <li>${optionA}</li>
                        <li>${optionB}</li>
                        <li>${optionC}</li>
                        <li>${optionD}</li>
                    </ul>
                `);

                formattedAnswers.push(`
                    <p class="font-bold my-1">Answer: ${answer}</p>
                    <p class="italic my-1">Explanation: ${explanation}</p>
                `);
            }
        });

        return { questions: formattedQuestions.join(''), answers: formattedAnswers.join('') };
    };

    const generateWorksheet = async () => {
        setLoading(true);
        const filteredQuestions = filterQuestionsBySubject();
        console.log(filteredQuestions);
        // Ensure there are questions to process
        if (filteredQuestions.length === 0) {
            console.error('No questions available for the selected subject.');
            setLoading(false);
            return;
        }

        const prompt = `Create exactly 10 new(using the seed: ${Math.floor(Math.random() * 1000)}), short, MCQ questions for a worksheet with the same topics as these questions: ${filteredQuestions.map(question => question.question_text).join(', ')} and with this subject: ${selectedSubject}. 
        For each question, provide the answer and an explanation. Ensure the order is: one question, then answer, and finally explanations.`;

        try {
            const aiResponse = await fetchAiContent(prompt);
            if (aiResponse) {
                console.log('AI Response:', aiResponse);
                const formattedContent = formatWorksheetContent(aiResponse);
                setWorksheet(formattedContent);  // Store the generated worksheet content
            }
        } catch (error) {
            console.error('Error generating worksheet:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHardQuestions();
        fetchWorksheets();
    }, [userId]);

    const { questions: formattedQuestions = '', answers: formattedAnswers = '' } = worksheet;

    const saveWorksheet = async () => {
        try {
            await addWorksheet(worksheetName, worksheet.questions, worksheet.answers, selectedSubject, userId);
            alert('Worksheet saved successfully!'); // Display alert on successful save
            setIsModalOpen(false);
            fetchWorksheets();
        } catch (error) {
            console.error('Error saving worksheet:', error);
            alert('Failed to save worksheet. Please try again.'); // Display alert on error
        }
    };
    

    const fetchWorksheets = async () => {
        const fetchedWorksheets = await getWorksheetsByUserId(userId);
        if (fetchedWorksheets) {
            setWorksheets(fetchedWorksheets);
        } else {
            console.error('Failed to fetch past worksheets');
        }
    };

    const handleWorksheetClick = (worksheet) => {
        setSelectedWorksheet(worksheet);
    };

    const handleBackToWorksheets = () => {
        setSelectedWorksheet(null); // Reset the selected worksheet to view the list again
    };

    const handleDeleteWorksheet = async (e, worksheetId) => {
        e.stopPropagation();
        const confirmed = window.confirm("Are you sure you want to delete this worksheet?");
        
        if (confirmed) {
            try {
                // Assuming you have a separate function that handles the actual deletion from your backend
                const result = await deleteWorksheet(worksheetId);
                
                if (result && !result.error) {
                    // Update state to remove the deleted worksheet
                    setWorksheets(worksheets.filter((worksheet) => worksheet.id !== worksheetId));
                    console.log('Worksheet deleted successfully');
                } else {
                    console.error('Failed to delete worksheet');
                }
            } catch (error) {
                console.error('Error occurred while deleting worksheet:', error);
            }
        }
    };
    

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md border border-primary">
            <h1 className="text-3xl font-bold text-center text-primary">Custom Worksheet</h1>
            <p className='text-center my-4'>(Use the questions you did in the past week to generate new worksheets)</p>
            <div className="mb-4 flex items-center justify-center">
                {/* Main Tabs for Create and Past Worksheets */}
                <button
                    onClick={() => {
                        setActiveTab('create');
                        setSelectedWorksheet(null); // Reset selection when switching tabs
                    }}
                    className={`mr-2 p-2 rounded-lg font-semibold ${activeTab === 'create' ? 'bg-primary text-white' : ''}`}
                >
                    Create Worksheet
                </button>
                <button
                    onClick={() => {
                        setActiveTab('view');
                        setSelectedWorksheet(null); // Reset selection when switching tabs
                    }}
                    className={`p-2 rounded-lg font-semibold ${activeTab === 'view' ? 'bg-primary text-white' : ''}`}
                >
                    View Past Worksheets
                </button>
            </div>
            
            {activeTab === 'create' ? (
                <>
                    {loading ? (
                        <p className="text-center text-black">Loading questions...</p>
                    ) : (
                        <>
                            <div className="mb-4">
                                <label className="block text-lg font-semibold mb-2">Select a Subject:</label>
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="w-full p-2 border rounded-lg"
                                >
                                    <option value="">-- Select a Subject --</option>
                                    {uniqueSubjects.map((subject) => (
                                        <option key={subject} value={subject}>{subject}</option>
                                    ))}
                                </select>
                            </div>
                            {!worksheet.questions && (
                                <button
                                    onClick={generateWorksheet}
                                    className={`w-full py-2 text-lg text-white rounded-lg transition ${!selectedSubject ? 'bg-gray-400' : 'bg-primary hover:bg-blue-700'}`}
                                    disabled={!selectedSubject}
                                >
                                    <FontAwesomeIcon icon={faFileCirclePlus} /> Generate Worksheet
                                </button>
                            )}
                            {worksheet.questions && (
                                <>
                                    {/* Sub Tabs for Questions and Answers */}
                                    <div className="w-full mb-4 flex items-center justify-center">
                                        <button
                                            onClick={() => setActiveSubTab('questions')}
                                            className={`mr-2 p-2 rounded-lg font-semibold ${activeSubTab === 'questions' ? 'bg-primary text-white' : ''}`}
                                        >
                                            Questions
                                        </button>
                                        <button
                                            onClick={() => setActiveSubTab('answers')}
                                            className={`p-2 rounded-lg font-semibold ${activeSubTab === 'answers' ? 'bg-primary text-white' : ''}`}
                                        >
                                            Answers
                                        </button>
                                    </div>
                                    {/* Section to view questions and answers while creating the worksheet */}
                                    <div className="mt-4">
                                        {activeSubTab === 'questions' ? (
                                            <>
                                                <h3 className="font-semibold">Questions:</h3>
                                                <div dangerouslySetInnerHTML={{ __html: worksheet.questions }} />
                                            </>
                                        ) : (
                                            <>
                                                <h3 className="font-semibold">Answers:</h3>
                                                <div dangerouslySetInnerHTML={{ __html: worksheet.answers }} />
                                            </>
                                        )}
                                    </div>
                                    <button className='w-full px-4 py-2 bg-primary rounded-lg text-white mt-4' onClick={() => setIsModalOpen(true)}>Save Worksheet</button>
                                    <button
                                        onClick={generateWorksheet}
                                        className="w-full py-2 mt-4 text-white bg-accent rounded-lg hover:bg-blue-300 transition"
                                        disabled={!selectedSubject}
                                    >
                                        <FontAwesomeIcon icon={faRedo} /> Regenerate Worksheet
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </>
            ) : (
                <div>
                    {selectedWorksheet ? (
                        // Display selected worksheet details with subtabs for questions/answers
                        <div>
                            <button onClick={handleBackToWorksheets} className="mb-4 text-blue-500 underline">
                               <FontAwesomeIcon icon={faArrowLeft} /> Back to Worksheets
                            </button>
                            <h2 className="font-bold text-lg">{selectedWorksheet.title}</h2>
                            {/* <p className='text-center'>{selectedWorksheet.created_at}</p> Assuming there's a created_at field */}

                            {/* Sub Tabs for Questions and Answers */}
                            <div className="mb-4 flex justify-center items-center">
                                <button
                                    onClick={() => setActiveSubTab('questions')}
                                    className={`mr-2 p-2 rounded-lg font-semibold ${activeSubTab === 'questions' ? 'bg-primary text-white' : ''}`}
                                >
                                    Questions
                                </button>
                                <button
                                    onClick={() => setActiveSubTab('answers')}
                                    className={`p-2 rounded-lg font-semibold ${activeSubTab === 'answers' ? 'bg-primary text-white' : ''}`}
                                >
                                    Answers
                                </button>
                            </div>

                            {activeSubTab === 'questions' ? (
                                <div className="mt-4">
                                    {/* <h3 className="font-semibold">Questions:</h3> */}
                                    <div dangerouslySetInnerHTML={{ __html: selectedWorksheet.questions }} />
                                </div>
                            ) : (
                                <div className="mt-4">
                                    {/* <h3 className="font-semibold">Answers:</h3> */}
                                    <div dangerouslySetInnerHTML={{ __html: selectedWorksheet.answers }} />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Past Worksheets</h2>
                            {worksheets.length === 0 ? (
                                <p className="text-center text-black">No past worksheets found.</p>
                            ) : (
                                <ul className="mt-4">
                                    {worksheets.map((worksheet) => (
                                        <li key={worksheet.id} className="relative mb-2 border p-2 rounded cursor-pointer hover:bg-gray-100" onClick={() => handleWorksheetClick(worksheet)}>
                                            <h3 className="font-bold">{worksheet.worksheetName}</h3>
                                            <p>Created at: {new Date(worksheet.created_at).toLocaleDateString()}</p> {/* Assuming there's a created_at field */}
                                            <button className='absolute right-4 top-5 text-red-500' onClick={(e) => handleDeleteWorksheet(e, worksheet.id)}><FontAwesomeIcon icon={faX} /></button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            )}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-md w-80">
                        <h2 className="text-lg font-semibold mb-4">Save Worksheet</h2>
                        <input
                            type="text"
                            value={worksheetName}
                            onChange={(e) => setWorksheetName(e.target.value)}
                            className="w-full p-2 border rounded mb-4"
                            placeholder="Enter Worksheet Name"
                        />
                        <button
                            onClick={saveWorksheet}
                            className="w-full py-2 bg-primary text-white rounded hover:bg-blue-700 transition"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="w-full py-2 mt-2 text-gray-600 bg-gray-300 rounded hover:bg-gray-400 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default WorksheetGenerator;
