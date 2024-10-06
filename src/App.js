import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun, faFileAlt, faSave, faPen, faBars, faTimes } from '@fortawesome/free-solid-svg-icons'; 
import { BrowserRouter as Router, Route, Routes, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import WorksheetGenerator from './WorksheetGenerator';
import AuthForm from './AuthForm';
import QuestionGenerator from './QuestionGenerator';
import NotesGenerator from './NotesGenerator';
import './App.css';
import QuestionList from './QuestionList';

const App = () => {
    const [darkMode, setDarkMode] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userEmail, setUserEmail] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for dropdown
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('userEmail');

    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }, [darkMode]);

    // Persist login state by checking localStorage on page load
    useEffect(() => {  
        if (email && userId) {
            setIsLoggedIn(true);
            setUserEmail(email);
        } else {
            setIsLoggedIn(false);
        }
    }, [userId]);

    // Track route changes and store the last visited path
    const location = useLocation();
    useEffect(() => {
        if (isLoggedIn && location.pathname !== '/auth') {
            localStorage.setItem('lastVisitedPath', location.pathname);
        }
    }, [location, isLoggedIn]);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Sign out function
    const handleSignOut = () => {
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        setIsLoggedIn(false);
        setUserEmail(null);
        setIsDropdownOpen(false); // Close dropdown after signing out
    };

    return (
        <div className={`min-h-screen flex flex-col ${darkMode ? 'dark:bg-gray-900 dark:text-white' : 'bg-white text-gray-900'}`}>
            <header className="w-full bg-background dark:bg-gray-700 p-4 shadow-md">
                <div className="flex items-center justify-between">
                    {/* Logo Section */}
                    <div className="flex items-center">
                        <img src={require('./studyascensionlogo.png')} width={50} height={40} alt="Study Ascension Logo" />
                        <h1 className='text-lg text-primary dark:text-white ml-2'>Study Ascension</h1>
                    </div>

                    {/* Hamburger Icon for Mobile */}
                    <div className="md:hidden">
                        <button onClick={toggleMobileMenu}>
                            <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} className="text-2xl" />
                        </button>
                    </div>

                    {/* Links Section */}
                    <nav className="hidden md:flex space-x-4">
                        <Link to={'/questions'} className="px-4 py-2 rounded flex items-center hover:bg-gray-300">
                            <FontAwesomeIcon icon={faPen} />
                            <span className="ml-2">Generate Questions</span>
                        </Link>
                        <Link to={'/worksheets'} className="px-4 py-2 rounded flex items-center hover:bg-gray-300">
                            <FontAwesomeIcon icon={faFileAlt} />
                            <span className="ml-2">Custom Worksheet</span>
                        </Link>
                        <Link to={'/list'} className="px-4 py-2 rounded flex items-center hover:bg-gray-300">
                            <FontAwesomeIcon icon={faSave} />
                            <span className="ml-2">Saved Questions</span>
                        </Link>
                        <div className="relative flex items-center">
                            {isLoggedIn && (
                                <div className="flex items-center">
                                    <div 
                                        className="flex items-center space-x-2 text-white bg-primary px-4 py-2 rounded-lg cursor-pointer"
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)} // Toggle dropdown
                                    >
                                        <span>{userEmail}</span>
                                    </div>
                                    {isDropdownOpen && (
                                        <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
                                            <button
                                                className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 w-full text-left"
                                                onClick={handleSignOut}
                                            >
                                                Sign Out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </nav>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <nav className="md:hidden mt-4 flex flex-col space-y-2">
                        <Link to={'/questions'} className="px-4 py-2 rounded flex items-center hover:bg-gray-300">
                            <FontAwesomeIcon icon={faPen} />
                            <span className="ml-2">Generate Questions</span>
                        </Link>
                        <Link to={'/worksheets'} className="px-4 py-2 rounded flex items-center hover:bg-gray-300">
                            <FontAwesomeIcon icon={faFileAlt} />
                            <span className="ml-2">Custom Worksheet</span>
                        </Link>
                        <Link to={'/list'} className="px-4 py-2 rounded flex items-center hover:bg-gray-300">
                            <FontAwesomeIcon icon={faSave} />
                            <span className="ml-2">Saved Questions</span>
                        </Link>
                    </nav>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-grow p-6">
                <div className="rounded-lg p-4">
                    <Routes>
                        {/* Redirect based on login state */}
                        <Route path="/" element={isLoggedIn ? <Navigate to="/questions" /> : <Navigate to="/auth" />} />
                        <Route path="/questions" element={isLoggedIn ? <QuestionGenerator /> : <Navigate to="/auth" />} />
                        <Route path="/list" element={isLoggedIn ? <QuestionList /> : <Navigate to="/auth" />} />
                        <Route path="/worksheets" element={isLoggedIn ? <WorksheetGenerator /> : <Navigate to="/auth" />} />
                        <Route path="/notes" element={isLoggedIn ? <NotesGenerator /> : <Navigate to="/auth" />} />
                        <Route path="/auth" element={<AuthForm setIsLoggedIn={setIsLoggedIn} />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

export default App;
