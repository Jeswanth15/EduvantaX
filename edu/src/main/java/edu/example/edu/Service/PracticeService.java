package edu.example.edu.Service;

import edu.example.edu.Entity.PracticeHistory;
import edu.example.edu.Repository.PracticeHistoryRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PracticeService {

    private final PracticeHistoryRepository practiceHistoryRepository;

    public PracticeService(PracticeHistoryRepository practiceHistoryRepository) {
        this.practiceHistoryRepository = practiceHistoryRepository;
    }

    public PracticeHistory saveAttempt(PracticeHistory attempt) {
        if (attempt.getTimestamp() == null) {
            attempt.setTimestamp(LocalDateTime.now());
        }
        return practiceHistoryRepository.save(attempt);
    }

    public List<PracticeHistory> getHistory(Long userId) {
        if (userId != null) {
            return practiceHistoryRepository.findByUserIdOrderByTimestampDesc(userId);
        }
        return practiceHistoryRepository.findAllByOrderByTimestampDesc();
    }

    public List<PracticeHistory> getModuleHistory(Long userId, Long classSubjectId, String moduleName) {
        if (userId == null || classSubjectId == null || moduleName == null) {
            return List.of();
        }
        return practiceHistoryRepository.findByUserIdAndClassSubjectIdAndModuleNameOrderByTimestampDesc(userId, classSubjectId, moduleName);
    }
}
