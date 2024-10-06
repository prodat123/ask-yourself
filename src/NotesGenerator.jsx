import React, { useEffect, useState } from 'react';
import { HfInference } from '@huggingface/inference';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboard, faClipboardCheck } from '@fortawesome/free-solid-svg-icons';
import { useLocation, useParams } from 'react-router-dom';
import ClipLoader from 'react-spinners/ClipLoader';

const inference = new HfInference(process.env.REACT_APP_HUGGINGFACE_API_KEY);
const YOUTUBE_API_KEY = 'AIzaSyB_GadF5IdYfYYThpnfP13y6oWV34tFahs'; // Replace with your YouTube API key

const NotesGenerator = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const question = queryParams.get('question');    
    const [topic, setTopic] = useState(question !== '' ? question : '');
    const [complexity, setComplexity] = useState('primary student');
    const [blogContent, setBlogContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const generateBlog = async () => {
        setLoading(true);
        setBlogContent('');

        const prompt = `Extract the topic from this question and write analytical notes about it: "${topic}", with headers and subheaders. Include an introduction, main sections with headers, subheaders, paragraphs, and bullet points, and a conclusion.`;
        console.log(prompt);
        try {
            let response = '';
            for await (const chunk of inference.chatCompletionStream({
                model: "meta-llama/Meta-Llama-3-8B-Instruct",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 1000,
            })) {
                response += chunk.choices[0]?.delta?.content || "";
            }
            const formattedContent = await formatBlogContent(response.trim());
            setBlogContent(formattedContent);
        } catch (error) {
            console.error('Error generating blog content:', error);
            setBlogContent('Error generating blog. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch relevant YouTube videos based on a query
    // const fetchYouTubeVideos = async (query) => {
    //     try {
    //         const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}&maxResults=1`; // Changed maxResults to 1
    //         const response = await fetch(url);
    //         const data = await response.json();
    
    //         if (data.items && data.items.length > 0) {
    //             // Filter out videos that have 'shorts' in the title
    //             const video = data.items
    //                 .filter(video => !video.snippet.title.toLowerCase().includes('shorts'))
    //                 .map(video => ({
    //                     title: video.snippet.title,
    //                     url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
    //                     thumbnail: video.snippet.thumbnails.default.url,
    //                     id: video.id.videoId // Keep the video ID for further checks
    //                 }))[0]; // Fetch only the first video after filtering
                
    //             if (video) {
    //                 // Check if the video is available
    //                 const isAvailable = await checkVideoAvailability(video.id);
    //                 return isAvailable ? video : null;
    //             } else {
    //                 return null; // Return null if no valid video is found
    //             }
    //         } else {
    //             return null; // Return null if no videos are found
    //         }
    //     } catch (error) {
    //         console.error('Error fetching YouTube videos:', error);
    //         return null; // Return null in case of an error
    //     }
    // };
    
    // Function to check video availability using video ID
    // const checkVideoAvailability = async (videoId) => {
    //     try {
    //         const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${YOUTUBE_API_KEY}&part=status`;
    //         const response = await fetch(url);
    //         const data = await response.json();
    
    //         if (data.items && data.items.length > 0) {
    //             const status = data.items[0].status;
    //             // Check if the video is available and not restricted
    //             return status && status.embeddable && status.privacyStatus === 'public';
    //         }
    //         return false; // Video not found
    //     } catch (error) {
    //         console.error('Error checking video availability:', error);
    //         return false; // Assume unavailable if an error occurs
    //     }
    // };
    
    
    
    

    // Modify content by adding videos after specific sections
    const formatBlogContent = async (content) => {
        const lines = content.split('\n').map(line => line.trim()).filter(line => line);
        let formattedLines = [];

        
    
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
    
            if (/^Generated Blog$/.test(line)) {
                formattedLines.push(`<h1 class="font-bold text-3xl my-4">${line}</h1>`);
            } else if (/^### (.+)$/.test(line)) {
                const subSubheadingText = line.replace(/^### /, '');
                formattedLines.push(`<h4 class="font-semibold text-lg my-2">${subSubheadingText}</h4>`);
            } else if (/^## (.+)$/.test(line)) {
                const subheadingText = line.replace(/^## /, '');
                formattedLines.push(`<h3 class="font-semibold text-xl my-2">${subheadingText}</h3>`);
            } else if (/^# (.+)$/.test(line)) {
                const headingText = line.replace(/^# /, '');
                formattedLines.push(`<h2 class="font-bold text-2xl my-2">${headingText}</h2>`);

                // const video = await fetchYouTubeVideos("Video about " + topic + " with the complexity of " + complexity + " for " + headingText);

                // if (video.length > 0) {
                //     formattedLines.push(`
                //         <div class="my-4">
                //             <iframe width="100%" height="315" src="https://www.youtube.com/embed/${video.url.split('v=')[1]}" frameborder="0" allowfullscreen></iframe>
                //         </div>
                //     `);
                // }
            } else if (/^\*\*(.+)\*\*$/.test(line)) {
                const headingText = line.replace(/\*\*/g, '');
                formattedLines.push(`<h2 class="font-bold text-2xl my-2">${headingText}</h2>`);
                
                // const video = await fetchYouTubeVideos("Video about " + topic + " with the complexity of " + complexity + " for " + headingText);

                // if (video.length > 0) {

                //     formattedLines.push(`
                //         <div class="my-4">
                //             <iframe width="100%" height="315" src="https://www.youtube.com/embed/${video.url.split('v=')[1]}" frameborder="0" allowfullscreen></iframe>
                //         </div>
                //     `);
                // }
            } else if (/^\* (.+)$/.test(line)) {
                const listItemText = line.replace(/^\* /, '');
                formattedLines.push(`<li class="my-1 ml-4 list-disc">${listItemText}</li>`);
            } else if (/^\d+\. (.+)$/.test(line)) {
                const orderedListItemText = line.replace(/^\d+\. /, '');
                formattedLines.push(`<li class="my-1 ml-4 list-decimal">${orderedListItemText}</li>`);
            } else {
                formattedLines.push(`<p class="my-2">${line}</p>`);
            }
        }
    
        const cleanedContent = formattedLines.map(line => line.replace(/[#*]/g, '')).join('');
    
        return cleanedContent;
    };

    const stripHtml = (html) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        return tempDiv.textContent || tempDiv.innerText || '';
    };

    const handleCopy = () => {
        if (blogContent) {
            navigator.clipboard.writeText(stripHtml(blogContent))
                .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 3000); 
                })
                .catch((error) => {
                    console.error('Error copying text: ', error);
                });
        }
    };

    useEffect(() => {
        console.log(topic);
        generateBlog();
    }, [topic])
    


    return (
        <div className={`w-full ${blogContent ? 'h-auto' : 'h-screen'} flex items-center flex-col max-w-4xl mx-auto p-6`}>
            <h1 className="text-3xl font-bold text-primary text-center">Notes Generator</h1>
            {loading ? <ClipLoader size={24} color={"#000"} /> : ''}

            {/* <form className="w-full max-w-lg">
                <div className="mb-4">
                    <label className="block font-semibold mb-2">Topic:</label>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Enter blog subject"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                </div>

                <div className="mb-4">
                    <label className="block font-semibold mb-2">Level:</label>
                    <select
                        value={complexity}
                        onChange={(e) => setComplexity(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    >
                        <option value="primary student">Primary School Level</option>
                        <option value="middle school student">Middle School Level</option>
                        <option value="highschooler">High School Level</option>
                        <option value="university student">University Level</option>
                        <option value="master's graduate student">Masters Level</option>
                        <option value="Professional">Professional Level</option>
                    </select>
                </div>

                <button
                    type="button"
                    onClick={generateBlog}
                    disabled={loading || !topic}
                    className={`w-full p-3 mt-4 text-lg font-semibold text-white rounded-lg transition-colors duration-300 ${loading || !topic ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}`}
                >
                    {loading ? 'Generating...' : 'Generate Notes'}
                </button>
            </form> */}

            {blogContent && (
                <div className="blog-content mt-8 relative">
                    <div dangerouslySetInnerHTML={{ __html: blogContent }} className="prose dark:prose-dark max-w-none"></div>
                    <button
                        className="absolute top-2 right-2 rounded p-2"
                        onClick={handleCopy}
                    >
                        {copied ? <div className="flex items-center"><FontAwesomeIcon icon={faClipboardCheck} className='mr-1'/> Copied!</div> : <><FontAwesomeIcon icon={faClipboard} className='mr-1'/> Copy Text</>}
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotesGenerator;
