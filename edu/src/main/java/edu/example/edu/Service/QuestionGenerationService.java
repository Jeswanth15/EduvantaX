package edu.example.edu.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.example.edu.DTO.Question;
import edu.example.edu.DTO.QuestionGenerationRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class QuestionGenerationService {

    @Value("${python.service.url}")
    private String pythonServiceUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public QuestionGenerationService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public List<Question> generateQuestions(QuestionGenerationRequest request) {
        try {
            return generateQuestionsFromPython(request);
        } catch (Exception e) {
            System.err.println("Python RAG service call failed: " + e.getMessage());
            return generateFallbackQuestions(request.getContent());
        }
    }

    private List<Question> generateQuestionsFromPython(QuestionGenerationRequest request) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String url = pythonServiceUrl + "/generate-questions";
        
        // Ensure moduleName and classSubjectId are present
        if (request.getModuleName() == null || request.getClassSubjectId() == null) {
            throw new RuntimeException("moduleName and classSubjectId are required for Python RAG");
        }

        HttpEntity<QuestionGenerationRequest> entity = new HttpEntity<>(request, headers);

        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

        if (response.getStatusCode().is2xxSuccessful()) {
            return objectMapper.readValue(response.getBody(), new TypeReference<List<Question>>() {});
        } else {
            System.err.println("Python service error: " + response.getStatusCode() + " - " + response.getBody());
            throw new RuntimeException("Python service returned status: " + response.getStatusCode());
        }
    }

    public void ingestFile(String fileLink, String moduleName, String classSubjectId) {
        try {
            String url = pythonServiceUrl + "/ingest?file_path=" + fileLink + 
                         "&moduleName=" + moduleName + 
                         "&classSubjectId=" + classSubjectId;
            restTemplate.postForEntity(url, null, String.class);
        } catch (Exception e) {
            System.err.println("Failed to ingest file into Python service: " + e.getMessage());
        }
    }



    // Fallback: Simple keyword-based question generation
    private List<Question> generateFallbackQuestions(String content) {
        List<Question> questions = new ArrayList<>();
        String[] sentences = content.split("[.!?]");

        for (String sentence : sentences) {
            sentence = sentence.trim();
            if (sentence.length() < 20)
                continue; // Skip short sentences

            // Generate a simple "Explain..." question
            if (questions.size() < 5) {
                questions.add(new Question(
                        "Explain the concept discussed in this sentence: \"" + sentence + "\"",
                        Collections.emptyList(),
                        "",
                        "SHORT_ANSWER",
                        "EASY"));
            }

            // Generate a TRUE/FALSE question based on the sentence
            if (questions.size() < 10) {
                questions.add(new Question(
                        "True or False: " + sentence,
                        List.of("True", "False"),
                        "True", // Assumption: Input content is factually true
                        "TRUE_FALSE",
                        "EASY"));
            }
        }
        return questions;
    }
}
