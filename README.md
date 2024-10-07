# Study Ascension (studyascension.online)
This website follows the "Intelligent Tutoring System" path and was made using the React Framework(Javascript), Tailwindcss, Supabase(Open-source Database), Youtube API, and HuggingFace API. Currently, the website is still in its demo stage whereas once it gets publicized, edits will be made to the code to make it more secure for users to operate.  

## Problem:
Students currently find it hard to study outside of school because there is a lack of available resources that are effective at teaching. Moreover, group education is also challenging if the student is not at the same level as other students in the class, which may cause them to feel left behind. 

## Solution: 
A website that uses AI text generation and databases to create questions that allow students to study at their own pace. The questions will adapt to the students' current understanding of the subject and explain the topic in detail to them. They can also test themselves with worksheets that are based on past mistakes and challenges to determine their improvement in the subject.

## Impact:
I hope to introduce Study Ascension as a potential solution to help education systems better prepare their students for exams and universities. As a student myself, I see a lot of wasted potential from talented students who are unable to perform their best because they do not understand classroom teachings. With this product, I hope to not only use AI for the progression of education, but make a solution that is compatible with all students no matter their skill level and educational background. 

## Main Features

### Question Generator:
1. Questions are generated based on an input written topic, and a selection of subject, difficulty, and type.
2. When the questions are loaded, the user can input their answer. If their answer is correct, they are prompted with the option to save the question and if they are wrong, the question is automatically saved into the database.
3. Answers also come with videos which are related to the question using the Youtube API.

### Question List and Notes:
1. The user will be able to view their past mistakes or questions that they saved along with their answers.
2. There is a "Generate Notes" button which will allow the user to create new notes based on the question. 

### Worksheet Generator:
1. Users will be able to select a subject that they have done in the past week and generate a worksheet based on the questions of that subject.
2. Users will also be able to save the worksheet for future reference in case they want to practice again.

## Current Limitations
1. There are a limited number of API calls with the free version of HuggingFace API and the Youtube API.
2. There are not a lot of visuals in notes and worksheets.

## Expansion Plans
1. Add more features such as an answering tool. (This is already currently in the works as seen in the src folder of this project)
2. Enable open-ended questions and answers.
3. Create a gamified system similar to Duolingo in order to engage students and motivate them to study even more. 
