package edu.example.edu.Controller;

import edu.example.edu.DTO.Question;
import edu.example.edu.DTO.QuestionGenerationRequest;
import edu.example.edu.Service.QuestionGenerationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
public class QuestionGenerationController {

    private final QuestionGenerationService questionGenerationService;

    public QuestionGenerationController(QuestionGenerationService questionGenerationService) {
        this.questionGenerationService = questionGenerationService;
    }

    @PostMapping("/generate")
    public ResponseEntity<List<Question>> generateQuestions(@RequestBody QuestionGenerationRequest request) {
        // Ingest files if provided
        if (request.getFileLinks() != null && !request.getFileLinks().isEmpty() && 
            request.getModuleName() != null && request.getClassSubjectId() != null) {
            for (String link : request.getFileLinks()) {
                questionGenerationService.ingestFile(link, request.getModuleName(), request.getClassSubjectId());
            }
        }

        List<Question> questions = questionGenerationService.generateQuestions(request);
        return ResponseEntity.ok(questions);
    }
}
