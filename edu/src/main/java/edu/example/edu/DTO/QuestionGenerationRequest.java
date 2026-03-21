package edu.example.edu.DTO;

import lombok.Data;

@Data
public class QuestionGenerationRequest {
    private String content;
    private String difficulty; // EASY, MEDIUM, HARD
    private int count; // Optional, can be used to limit logic if needed
    private java.util.List<String> fileLinks;
    private String moduleName;
    private String classSubjectId;
}
