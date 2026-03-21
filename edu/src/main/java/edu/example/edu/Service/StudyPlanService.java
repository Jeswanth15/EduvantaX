package edu.example.edu.Service;

import edu.example.edu.Entity.PracticeHistory;
import edu.example.edu.Repository.PracticeHistoryRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class StudyPlanService {

    @Value("${python.service.url}")
    private String pythonServiceUrl;

    private final RestTemplate restTemplate;
    private final PracticeHistoryRepository practiceHistoryRepository;

    public StudyPlanService(RestTemplate restTemplate, PracticeHistoryRepository practiceHistoryRepository) {
        this.restTemplate = restTemplate;
        this.practiceHistoryRepository = practiceHistoryRepository;
    }

    public String generateStudyPlan(Long userId, Long classSubjectId, String moduleName, Integer days) {
        List<PracticeHistory> history = practiceHistoryRepository.findByUserIdOrderByTimestampDesc(userId);
        
        // Filter by class subject and optionally by module
        List<PracticeHistory> subjectHistory = history.stream()
                .filter(h -> classSubjectId.equals(h.getClassSubjectId()))
                .filter(h -> moduleName == null || moduleName.isBlank() || "General".equalsIgnoreCase(moduleName) || moduleName.equalsIgnoreCase(h.getModuleName()))
                .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp())) // recent first
                .toList();

        if (subjectHistory.isEmpty()) {
            return "Not enough test data for " + (moduleName != null && !"General".equalsIgnoreCase(moduleName) ? "module '" + moduleName + "'" : "this subject") + " to generate a study plan. Keep practicing!";
        }

        StringBuilder statsBuilder = new StringBuilder();
        Map<String, List<PracticeHistory>> moduleAttempts = new HashMap<>();
        
        for (PracticeHistory attempt : subjectHistory) {
            String module = attempt.getModuleName() != null ? attempt.getModuleName() : "General";
            moduleAttempts.computeIfAbsent(module, k -> new java.util.ArrayList<>()).add(attempt);
        }

        for (Map.Entry<String, List<PracticeHistory>> entry : moduleAttempts.entrySet()) {
            List<PracticeHistory> attempts = entry.getValue();
            double avgScore = attempts.stream().mapToInt(PracticeHistory::getScore).average().orElse(0.0);
            statsBuilder.append("Module '").append(entry.getKey()).append("': ")
                    .append(attempts.size()).append(" attempts, Average Score = ").append(String.format("%.1f", avgScore)).append("%\n");
        }

        return callPythonStudyPlanService(userId, classSubjectId, moduleName, days, statsBuilder.toString());
    }

    private String callPythonStudyPlanService(Long userId, Long classSubjectId, String moduleName, Integer days, String stats) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("userId", userId);
            requestBody.put("classSubjectId", classSubjectId);
            requestBody.put("moduleName", moduleName);
            requestBody.put("days", days != null ? days : 7);
            requestBody.put("stats", stats);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            String url = pythonServiceUrl + "/generate-study-plan";
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            return response.getBody();
        } catch (Exception e) {
            e.printStackTrace();
            return "Error calling AI service: " + e.getMessage();
        }
    }
}
