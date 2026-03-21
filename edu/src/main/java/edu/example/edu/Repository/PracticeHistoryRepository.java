package edu.example.edu.Repository;

import edu.example.edu.Entity.PracticeHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PracticeHistoryRepository extends JpaRepository<PracticeHistory, Long> {
    List<PracticeHistory> findByUserIdOrderByTimestampDesc(Long userId);

    List<PracticeHistory> findByUserIdAndClassSubjectIdAndModuleNameOrderByTimestampDesc(Long userId, Long classSubjectId, String moduleName);

    List<PracticeHistory> findAllByOrderByTimestampDesc();
}
