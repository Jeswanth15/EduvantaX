import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export const generateQuestions = async (content, difficulty, fileLinks = null, moduleName = null, classSubjectId = null) => {
    try {
        const payload = {
            content,
            difficulty,
            count: 5
        };
        if (fileLinks) payload.fileLinks = fileLinks;
        if (moduleName) payload.moduleName = moduleName;
        if (classSubjectId) payload.classSubjectId = classSubjectId;

        const response = await axios.post(`${API_URL}/questions/generate`, payload);
        return response.data;
    } catch (error) {
        console.error("Error generating questions:", error);
        throw error;
    }
};

export const submitPracticeResult = async (result) => {
    try {
        const response = await axios.post(`${API_URL}/practice/submit`, result);
        return response.data;
    } catch (error) {
        console.error("Error submitting practice:", error);
        throw error;
    }
};

export const getPracticeHistory = async (userId) => {
    try {
        const response = await axios.get(`${API_URL}/practice/history`, {
            params: { userId }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching history:", error);
        throw error;
    }
};
