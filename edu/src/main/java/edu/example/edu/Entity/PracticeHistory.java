package edu.example.edu.Entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "practice_history")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PracticeHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId; // Can be null if not logged in, or linked to User
    private String topic;
    private String moduleName;
    private Long classSubjectId;
    private int score;
    private int totalQuestions;
    private LocalDateTime timestamp;

    private int correctAnswers;
    private int wrongAnswers;

    // Optional: Store detailed attempt data (JSON) if needed later
}
