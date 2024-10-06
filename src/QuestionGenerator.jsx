import React, { useState, useEffect } from 'react';
import { HfInference } from '@huggingface/inference';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faCheck, faChevronDown, faClipboard, faClipboardCheck, faCross, faFile, faKeyboard, faUpload, faX } from '@fortawesome/free-solid-svg-icons';
import { addHardQuestion } from './supabase/SupabaseFunctions';
import Tesseract from 'tesseract.js';
import CameraInput from './CameraInput';


const inference = new HfInference(process.env.REACT_APP_HUGGINGFACE_API_KEY); // Replace with your actual API key
const YOUTUBE_API_KEY = "AIzaSyB_GadF5IdYfYYThpnfP13y6oWV34tFahs"; // Replace with your YouTube API key



const QuestionGenerator = () => {
    const [selectedTab, setSelectedTab] = useState('formFields');
    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('easy');
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState([]);
    const [answer, setAnswer] = useState('');
    const [explanation, setExplanation] = useState('');
    const [loading, setLoading] = useState(false);
    const [questionNumber, setQuestionNumber] = useState(1);
    const [firstQuestionGenerated, setFirstQuestionGenerated] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);
    const [showVideos, setShowVideos] = useState(false); // State for showing videos
    const [copied, setCopied] = useState(false);
    const [videos, setVideos] = useState([]);
    const [questionType, setQuestionType] = useState('mcq'); // New state for question type
    const [pdfText, setPdfText] = useState(''); // State to hold the PDF text content
    const [selectedFile, setSelectedFile] = useState('');
    const [correct, setCorrect] = useState('');
    const [feedback, setFeedback] = useState('');
    const [userAnswer, setUserAnswer] = useState('');
    const [inputPlaceholder, setInputPlaceholder] = useState('');
    const [userId, setUserId] = useState(null);
    const [imageText, setImageText] = useState('');

    useEffect(() => {
        // Retrieve user session from session storage
        const id = localStorage.getItem('userId');
        setUserId(id);
    }, []);

    const handleTextExtracted = (imageData) => {
        setImageText(imageData);
        setTopic(imageData);
    };

    const fetchAiContent = async (prompt) => {
        let response = '';
        try {
            for await (const chunk of inference.chatCompletionStream({
                model: "meta-llama/Meta-Llama-3-8B-Instruct",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 500,
            })) {
                response += chunk.choices[0]?.delta?.content || "";
            }
        } catch (error) {
            console.error('Error fetching AI content:', error);
        }
        return response.trim();
    };

    const fetchYouTubeVideos = async (query) => {
        try {
            const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}&maxResults=5`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (response.ok) {
                if (data.items) {
                    return data.items.map(item => ({
                        title: item.snippet.title,
                        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                        thumbnail: item.snippet.thumbnails.default.url,
                    }));
                } else {
                    console.error('Error in YouTube API response:', data);
                    return [];
                }
            } else {
                console.error('YouTube API Error:', data.error);
                return [];
            }
        } catch (error) {
            console.error('Error fetching YouTube videos:', error);
            return [];
        }
    };

    const generateQuestionAndAnswer = async (extractedText = '') => {
        setLoading(true);
        setVideos([]);
    
        // Build the initial prompt based on the extracted text if available
        let prompt = typeof extractedText === 'string' && extractedText.trim() !== '' 
        ? `${questionNumber}. Create a question based on the following questions: "${extractedText}", and provide the answer and an explanation for that answer.`
        : `${questionNumber}. Create a unique ${questionType} question with ${difficulty} level about ${topic} in the subject of ${subject}, and provide ann answer and an explanation for that answer in different lines.`;

        if (pdfText && selectedTab === 'fileUpload') {
            prompt = `${questionNumber}. Here is the content from a PDF file to consider: ${pdfText} and create a unique question based on it and provide the answer and a brief explanation for that answer.`;
        }
    
        if (questionType === 'mcq') {
            prompt += " Include four options, one right and the others wrong.";
            setInputPlaceholder("Choose a letter from A to D")
        } else if (questionType === 'true or false') {
            prompt += " The question should be true or false.";
            setInputPlaceholder("Choose 'true' or 'false'");
        }
    
        try {
            let generatedContent = await fetchAiContent(prompt);
    
            // Log the generated content for debugging
            console.log("Generated Content:", generatedContent);
    
            // Remove all asterisks from the generated content
            let cleanedContent = generatedContent.replace(/\*/g, '');
    
            // Remove the "Question:" prefix and everything before the first colon
            cleanedContent = cleanedContent.replace(/^(.*?:\s*)?Question:\s*/, '');
    
            let questionText = '';
            let formattedOptions = [];
            let formattedAnswer = '';
            let formattedExplanation = '';
    
            if (questionType === 'mcq') {
                // Extract the question by splitting before the first "Options:" or "A)"
                const questionMatch = cleanedContent.match(/(.*?)(?=(Options:|A\)))/s);
                questionText = questionMatch ? questionMatch[0].trim() : 'No question generated.';
    
                // Check if "Options:" exists
                const optionsIndex = cleanedContent.search(/Options:/i);
                if (optionsIndex === -1) {
                    // If "Options:" doesn't exist, find "A)" and split from there
                    const optionsMatch = cleanedContent.match(/A\)/);
                    if (optionsMatch) {
                        const splitContent = cleanedContent.split(/(?=A\))/);
                        const optionsAndRest = splitContent[1]
                            .trim()
                            .split(/(?=Answer:)/);
                        
                        formattedOptions = optionsAndRest[0]
                            .trim()
                            .split(/\n+/)
                            .map(option => option.trim())
                            .filter(option => option);
    
                        // Handle everything after the last option (e.g., after "D)") or after "Answer:"
                        const remainingContent = optionsAndRest[1] || '';
                        const answerMatch = remainingContent.match(/Answer:(.*?)(?=Explanation:|$)/s);
                        formattedAnswer = answerMatch ? answerMatch[1].trim() : 'No answer provided.';
    
                        const explanationMatch = remainingContent.match(/Explanation:(.*)/s);
                        formattedExplanation = explanationMatch ? explanationMatch[1].trim() : 'No explanation provided.';
                    }
                } else {
                    // Extract options
                    const optionsAndRest = cleanedContent.split(/(?=Answer:)/);
                    
                    formattedOptions = optionsAndRest[0]
                        .substring(optionsIndex + 8) // Skip the "Options:" part
                        .trim()
                        .split(/\n+/)
                        .map(option => option.trim())
                        .filter(option => option);
    
                    // Handle everything after the last option (e.g., after "D)") or after "Answer:"
                    const remainingContent = optionsAndRest[1] || '';
                    const answerMatch = remainingContent.match(/Answer:(.*?)(?=Explanation:|$)/s);
                    formattedAnswer = answerMatch ? answerMatch[1].trim() : 'No answer provided.';
    
                    const explanationMatch = remainingContent.match(/Explanation:(.*)/s);
                    formattedExplanation = explanationMatch ? explanationMatch[1].trim() : 'No explanation provided.';
                }
            } else {
                // For non-MCQ question types
                const [rawQuestion, optionsAndAnswer] = cleanedContent.split(/(?=Answer:)/i);
                questionText = rawQuestion.trim();
    
                if (optionsAndAnswer) {
                    formattedAnswer = optionsAndAnswer.includes("Answer:") 
                        ? optionsAndAnswer.split("Answer:")[1].split("Explanation:")[0].trim()
                        : 'No answer provided.';
                    
                    formattedExplanation = optionsAndAnswer.includes("Explanation:")
                        ? optionsAndAnswer.split("Explanation:")[1].trim()
                        : 'No explanation provided.';
                }
            }
    
            const answerWithLineBreaks = formattedAnswer.replace(/(\.\s)/g, '.<br /><br />');
            const explanationWithLineBreaks = formattedExplanation.replace(/(\.\s)/g, '.<br /><br />');
    
            // Add line breaks between each option to display them on separate rows
            const spacedOptions = formattedOptions.join('<br /><br />');
    
            // Ensure that the question is separated from options and displayed properly
            setQuestion(`${questionText}<br /><br />${spacedOptions}` || 'No question generated.');
            setAnswer(answerWithLineBreaks);
            setExplanation(explanationWithLineBreaks);
            setQuestionNumber(prevNumber => prevNumber + 1);
            setFeedback('');
            setUserAnswer('');
            setShowAnswer(false);
            setFirstQuestionGenerated(true);
            setShowVideos(false);
            setCorrect('');  // Reset correct state for the next question
        } catch (error) {
            console.error("Error generating question:", error);
            setQuestion('Error generating question. Please try again.');
            setOptions([]);
            setAnswer('');
            setExplanation('');
            setVideos([]);
        } finally {
            setLoading(false);
        }
    };
    
    
    const handleShowAnswer = async () => {
        setShowAnswer(prev => !prev);
        if (!showAnswer && firstQuestionGenerated) {
            const relatedVideos = await fetchYouTubeVideos(question);
            setVideos(relatedVideos);
            setShowVideos(true);
        }
    };

    const copyToClipboard = () => {
        const contentToCopy = `Question: ${question}\n\nAnswer: ${answer.replace(/<br\s*\/?>/g, '\n')}`;
        navigator.clipboard.writeText(contentToCopy)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 3000); 
            })
            .catch(err => console.error('Failed to copy: ', err));
    };

    const extractTextFromPdf = async (pdfBytes) => {
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        
        // Load PDF document
        const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
        const numPages = pdf.numPages;
        let text = '';
    
        // Extract text from each page
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            text += pageText + '\n'; // Append page text with newline
        }
    
        setPdfText(text);
        setTopic(text);
    };
    
    
    const handlePdfUpload = async (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
        if (file) {
            const pdfBytes = await file.arrayBuffer();
            const text = await extractTextFromPdf(pdfBytes);
            console.log(text);
        }
    };

    const checkAnswer = async() => {
        // Ensure both answers exist and are not empty
        if (questionType === 'mcq') {
            const correctLetter = answer.trim().charAt(0).toLowerCase();
            const selectedLetter = userAnswer.trim().charAt(0).toLowerCase();
            console.log(correctLetter + selectedLetter);
            if (selectedLetter === correctLetter) {
                setFeedback('Correct!');
                setCorrect(true);
            } else {
                setFeedback('Incorrect. Try again.');
                setCorrect(false);
                await addHardQuestion(question, questionType, subject, answer, difficulty, userId);
            }
            handleShowAnswer(); // Show the correct answer/explanation
        } else {
            // For other question types (e.g., text-based answers)
            if (userAnswer.trim().toLowerCase() === answer.trim().toLowerCase()) {
                setFeedback('Correct!');
                setCorrect(true);
            } else {
                setFeedback('Incorrect. Try again.');
                setCorrect(false);
                await addHardQuestion(question, questionType, subject, answer, difficulty, userId);

            }
            handleShowAnswer();
        }
    };

    const saveQuestion = async() => {
        await addHardQuestion(question, questionType, subject, answer, difficulty, userId);
        alert("Question is saved.");
    }

    return (
        <div className={`max-w-3xl mx-auto p-6 flex flex-col shadow-md rounded-lg border border-primary items-center p-4 ${question ? 'h-auto' : 'h-full'}`}>
            <h1 className="text-3xl font-bold mb-4 text-primary text-center dark:text-white">Create Questions with Answers</h1>
            
            {/* Tabs for Form Fields and File Upload */}
            <div className="flex space-x-4 mb-4">
                <button
                    className={`px-4 py-2 rounded-lg ${selectedTab === 'formFields' ? 'bg-primary text-white' : 'bg-gray-200 dark:text-gray-800'}`}
                    onClick={() => setSelectedTab('formFields')}
                >
                    <FontAwesomeIcon icon={faKeyboard} /> Manual
                </button>
                <button
                    className={`px-4 py-2 rounded-lg ${selectedTab === 'fileUpload' ? 'bg-primary text-white' : 'bg-gray-200 dark:text-gray-800'}`}
                    onClick={() => setSelectedTab('fileUpload')}
                >
                    <FontAwesomeIcon icon={faFile} /> PDFs
                </button>
                <button
                    className={`px-4 py-2 rounded-lg ${selectedTab === 'cameraInput' ? 'bg-primary text-white' : 'bg-gray-200 dark:text-gray-800'}`}
                    onClick={() => setSelectedTab('cameraInput')}
                >
                    <FontAwesomeIcon icon={faCamera} /> Camera
                </button>
            </div>

            {/* File Upload Tab */}
            {selectedTab === 'fileUpload' && (
                <div className="mb-4 w-full max-w-lg">
                    <label className="block dark:text-white text-gray-700 font-semibold mb-2">Upload PDF (currently limited to 5 pages):</label>
                    <div className="relative flex items-center">
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handlePdfUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <button className="bg-primary text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-600 transition-all duration-300 flex items-center justify-center w-full">
                            <FontAwesomeIcon icon={faChevronDown} className="mr-2" />
                            Choose File
                        </button>
                    </div>
                    {selectedFile && (
                        <div className="mt-2 text-gray-700 dark:text-white">
                            <p>Selected File: <span className="font-semibold">{selectedFile.name}</span></p>
                        </div>
                    )}

                    {/* Generate Question Button */}
                    {/* <button
                        className={`max-w-lg w-full p-3 mt-4 text-lg font-semibold text-white rounded-lg transition-colors duration-300 ${loading || !topic  ? 'bg-gray-400' : 'bg-primary hover:bg-blue-600'}`}
                        onClick={generateQuestionAndAnswer}
                        disabled={loading || !topic }
                    >            
                        {loading ? 'Generating...' : 'Generate Question'}
                    </button> */}
                </div>
            )}

            {/* Form Fields Tab */}
            {selectedTab === 'formFields' && (
                <>
                    <label className="w-full max-w-lg mb-2 font-semibold">Topic:</label>
                    <input
                        type="text"
                        className="border p-2 w-full rounded-md max-w-lg focus:outline-none focus:border-blue-500 mb-4 dark:bg-gray-800"
                        placeholder="Enter the topic..."
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                    />
                    

                    {/* Generate Question Button */}
                    
                </>
            )}

            {selectedTab === 'cameraInput' && (
                <CameraInput onTextExtracted={handleTextExtracted} />
            )}

            <label className="w-full max-w-lg mb-2 font-semibold">Subject:</label>
            <select
                className="border p-2 w-full rounded-md max-w-lg focus:border-blue-500 mb-4 dark:bg-gray-800"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
            >
                <option value="" disabled>Choose a subject</option>
                <option value="Physics">Physics</option>
                <option value="Biology">Biology</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Business">Business</option>
                <option value="Economics">Economics</option>
                <option value="History">History</option>
                <option value="Maths">Maths</option>
                <option value="English">English</option>
            </select>

            

            {/* Difficulty dropdown */}
            <label className="w-full max-w-lg mb-2 font-semibold">Difficulty:</label>
            <select
                className="border p-2 w-full rounded-md focus:border-blue-500 max-w-lg mb-4 dark:bg-gray-800"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
            >
                <option value="" disabled>Choose a difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="college level">College</option>
                <option value="master">Master</option>
            </select>

            {/* Question Type */}
            <label className="w-full max-w-lg mb-2 font-semibold">Question Type:</label>
            <select
                className="border p-2 w-full rounded-md max-w-lg focus:border-blue-500 mb-4 dark:bg-gray-800"
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
            >
                <option value="" disabled>Choose a question type</option>
                <option value="mcq">Multiple Choice (MCQ)</option>
                {/* <option value="open ended">Open-Ended</option> */}
                <option value="true or false">True or False</option>
            </select>

            <button
                className={`max-w-lg w-full px-4 py-2 mt-4 text-lg font-semibold text-white rounded-lg transition-colors duration-300 ${loading || !topic || !questionType || !difficulty || !subject  ? 'bg-gray-400' : 'bg-primary hover:bg-blue-600'}`}
                onClick={generateQuestionAndAnswer}
                disabled={loading || !topic || !questionType || !difficulty || !subject }
            >            
                {loading ? 'Generating...' : 'Generate Question'}
            </button>

            {question && (
                <div className="mt-4 p-4 border border-gray-300 rounded max-w-lg w-full relative dark:bg-gray-900">
                    <h2 className="text-xl font-semibold">Generated Question:</h2>
                    <p className="mt-2" dangerouslySetInnerHTML={{ __html: question }}></p>

                    {/* Answer Input */}
                    <div className="mt-4">
                        <label htmlFor="userAnswer" className="block text-lg font-semibold mb-2">Your Answer:</label>
                        <div className='relative'>
                            <input
                                id="userAnswer"
                                type="text"
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                className={`w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white 
                                    ${feedback === 'Correct!' ? 'border-green-600' : feedback === 'Incorrect. Try again.' ? 'border-red-600' : 'border-gray-300'}`}
                                placeholder={inputPlaceholder}
                            >

                            </input>
                            {feedback && (
                                <>
                                {feedback === 'Correct!' ? 
                                <div className={`mt-4 text-sm text-white rounded-full font-semibold bg-green-500 w-6 h-6 flex items-center justify-center absolute -top-2 right-2`}>
                                    <FontAwesomeIcon icon={faCheck} />
                                </div>
                                
                                : 
                                <div className={`mt-4 text-sm text-white rounded-full font-semibold bg-red-500 w-6 h-6 flex items-center justify-center absolute -top-2 right-2`}>
                                    <FontAwesomeIcon icon={faX} />
                                </div>
                            
                                }
                                </>
                                
                            )}
                        </div>
                        <button
                            onClick={checkAnswer}
                            className="w-full text-white px-4 py-2 rounded-lg mt-4 bg-primary hover:bg-blue-600 transition-colors duration-300"
                        >
                            Submit Answer
                        </button>
                    </div>

                    {/* Show Answer and Explanation */}
                    {feedback && (
                        <div className="overflow-hidden transition-max-height duration-300 ease-in-out mt-4">
                            <h3 className='text-xl font-semibold'>Answer:</h3>
                            <p dangerouslySetInnerHTML={{ __html: answer }}></p>
                            <h2 className="text-md underline font-semibold mt-2">Explanation</h2>
                            <p dangerouslySetInnerHTML={{ __html: explanation }} />
                        </div>
                    )}

                    {/* Video Section */}
                    {showVideos && videos.length > 0 && (
                        <div className="mt-4 p-6 border border-gray-300 rounded-lg shadow-md w-full max-w-3xl bg-white dark:bg-gray-900">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Related YouTube Videos:</h2>
                            <ul className="space-y-4">
                                {videos.map((video, index) => (
                                    <li key={index} className="flex items-center space-x-4 p-2 border border-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                        <a href={video.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-4 w-full">
                                            <img src={video.thumbnail} alt={video.title} className="w-24 h-16 object-cover rounded-md shadow-sm" />
                                            <span className="text-blue-600 hover:underline dark:text-white">{video.title}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {feedback === "Correct!" && (
                        <button className='w-full bg-green-800 text-white px-4 py-2 mt-4 rounded-lg' onClick={saveQuestion}>
                            Save Question
                        </button>
                    )}
                    

                    {/* Copy Question Button */}
                    <button
                        className="absolute top-2 right-2 rounded p-2"
                        onClick={copyToClipboard}
                    >
                        {copied ? <div className="flex items-center"><FontAwesomeIcon icon={faClipboardCheck} className='mr-1' /> Copied!</div> : <><FontAwesomeIcon icon={faClipboard} /> Copy</>}
                    </button>
                </div>
            )}

            {/* Generate Next Question */}
            {firstQuestionGenerated && (
                <div className="mt-4">
                    
                    <button
                        className="bg-primary text-white px-4 py-2 rounded-lg mb-4 bg-primary hover:bg-blue-600 transition-colors duration-300"
                        onClick={generateQuestionAndAnswer}
                    >
                        {loading ? 'Generating...' : 'Next Question'}
                    </button>
                </div>
            )}

        </div>

    );
};

export default QuestionGenerator;