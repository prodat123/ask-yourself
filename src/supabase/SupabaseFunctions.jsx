// supabaseFunctions.js
import supabase from './SupabaseClient';

export const addUser = async (userData) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .insert([
                { email: userData.email, password: userData.password } // Adjust according to your table structure
            ])
            .select(); // This ensures that the inserted data is returned

        if (error) {
            console.error('Error adding user:', error);
            return { error };
        }

        return { data }; // Return the newly created user data
    } catch (err) {
        console.error('Error in addUser:', err);
        return { error: err.message };
    }
};


// Function to add a new hard question
export const addHardQuestion = async (questionText, questionType, questionSubject, correctAnswer, difficultyLevel, userId = null) => {
    const { data, error } = await supabase
        .from('hard_questions') // Hard questions table
        .insert([
            {
                question_text: questionText,
                question_type: questionType,
                question_subject: questionSubject,
                correct_answer: correctAnswer,
                difficulty_level: difficultyLevel,
                user_id: userId,  // Optional userId
            }
        ]);

    if (error) {
        console.error('Error adding hard question:', error.message);
        return null;
    }

    return data; // Return the added question (assuming one question)
};

// Function to add a new hard question
export const addWorksheet = async (worksheetName, questions, answers, subject, userId) => {
    const { data, error } = await supabase
        .from('worksheets') // Hard questions table
        .insert([
            {
                worksheetName: worksheetName,
                questions: questions,
                answers: answers,
                subject: subject,
                user_id: userId,  // Optional userId
            }
        ]);

    if (error) {
        console.error('Error adding worksheet:', error.message);
        return null;
    }

    return data; // Return the added question (assuming one question)
};

// Function to retrieve hard questions by user ID
export const getWorksheetsByUserId = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('worksheets')
            .select('*')
            .eq('user_id', userId); // Filter by user_id

        if (error) {
            console.error('Error fetching worksheets:', error.message);
            return null;
        }

        return data; // Return the list of hard questions for the specified user
    } catch (err) {
        console.error('Error in getWorksheetsByUserId:', err);
        return null;
    }
};


// Function to retrieve hard questions by user ID
export const getHardQuestionsByUserId = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('hard_questions')
            .select('*')
            .eq('user_id', userId); // Filter by user_id

        if (error) {
            console.error('Error fetching hard questions:', error.message);
            return null;
        }

        return data; // Return the list of hard questions for the specified user
    } catch (err) {
        console.error('Error in getHardQuestionsByUserId:', err);
        return null;
    }
};

// Function to delete a question by ID
export const deleteQuestion = async (questionId) => {
    try {
        const { data, error } = await supabase
            .from('hard_questions') // Replace with your table name if different
            .delete()
            .eq('id', questionId); // Filter by question ID

        if (error) {
            console.error('Error deleting question:', error.message);
            return { error };
        }

        return { data }; // Return the deleted question data (if needed)
    } catch (err) {
        console.error('Error in deleteQuestion:', err);
        return { error: err.message };
    }
};

export const deleteWorksheet = async (worksheetId) => {
    try {
        const { data, error } = await supabase
            .from('worksheets') // Replace with your table name if different
            .delete()
            .eq('id', worksheetId); // Filter by question ID

        if (error) {
            console.error('Error deleting worksheet:', error.message);
            return { error };
        }

        return { data }; // Return the deleted question data (if needed)
    } catch (err) {
        console.error('Error in deleteWorksheet:', err);
        return { error: err.message };
    }
};