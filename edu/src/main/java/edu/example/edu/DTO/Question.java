package edu.example.edu.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Question {
    private String questionText;
    private List<String> options;
    private String correctOption;
    private String type; // MCQ, TRUE/FALSE, SHORT_ANSWER
    private String difficulty; // EASY, MEDIUM, HARD
}
