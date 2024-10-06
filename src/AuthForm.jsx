import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from './supabase/SupabaseClient';
import { addUser } from './supabase/SupabaseFunctions';

const AuthForm = ({ setIsLoggedIn }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Check if the user is already logged in
        const userId = localStorage.getItem('userId');
        if (userId) {
            setIsLoggedIn(true); // Automatically set user as logged in
            const previousPath = localStorage.getItem('lastVisitedPath') || '/questions'; // Default to '/questions' if no path is stored
            navigate(previousPath); // Redirect to the stored URL
        }
    }, [setIsLoggedIn, navigate]);

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const { data, error } = await addUser({ email, password });

            if (error) {
                setError(error.message);
                return;
            }

            localStorage.setItem('userId', data[0].id);
            setMessage('Registration successful!');
            setIsLoggedIn(true);

            // Redirect to /questions after successful registration
            navigate('/questions');

        } catch (err) {
            console.error('Error during registration:', err);
            setError('Error during registration');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .eq('password', password)
                .single();

            if (error || !data) {
                setError('Invalid email or password');
                return;
            }

            setIsLoggedIn(true);
            setMessage('Login successful!');
            localStorage.setItem('userEmail', data.email);
            localStorage.setItem('userId', data.id);

            // Redirect to /questions after successful login
            navigate('/questions');

        } catch (err) {
            console.error('Error during login:', err);
            setError('Error during login');
        }
    };

    // Do not render the form if the userId exists
    const userId = localStorage.getItem('userId');
    if (userId) {
        return null; // or a loading spinner
    }

    return (
        <div className="flex items-center justify-center min-h-screen dark:bg-gray-800">
            <div className="bg-white border border-primary dark:bg-gray-900 p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-4">{isRegistering ? 'Register' : 'Login'}</h2>
                {message && <p className="text-green-500 text-center mb-4">{message}</p>}
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <form onSubmit={isRegistering ? handleRegister : handleLogin}>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300" htmlFor="email">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300" htmlFor="password">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white rounded-md py-2 hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-500"
                    >
                        {isRegistering ? 'Register' : 'Login'}
                    </button>
                </form>
                <div className="text-center mt-4">
                    <button
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-blue-500 hover:underline"
                    >
                        {isRegistering ? 'Already have an account? Login' : 'Don’t have an account? Register'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthForm;
