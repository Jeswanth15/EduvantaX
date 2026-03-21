package edu.example.edu.Controller;

import edu.example.edu.Entity.PracticeHistory;
import edu.example.edu.Service.PracticeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/practice")
public class PracticeController {

    private final PracticeService practiceService;
    private final edu.example.edu.Service.StudyPlanService studyPlanService;

    public PracticeController(PracticeService practiceService, edu.example.edu.Service.StudyPlanService studyPlanService) {
        this.practiceService = practiceService;
        this.studyPlanService = studyPlanService;
    }

    @PostMapping("/submit")
    public ResponseEntity<PracticeHistory> submitAttempt(@RequestBody PracticeHistory attempt) {
        // Simple submission, assuming frontend sends calculated score/stats
        PracticeHistory saved = practiceService.saveAttempt(attempt);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/history")
    public ResponseEntity<List<PracticeHistory>> getHistory(@RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(practiceService.getHistory(userId));
    }

    @GetMapping("/module/{classSubjectId}/{moduleName}")
    public ResponseEntity<List<PracticeHistory>> getModuleHistory(
            @RequestParam Long userId,
            @PathVariable Long classSubjectId,
            @PathVariable String moduleName) {
        return ResponseEntity.ok(practiceService.getModuleHistory(userId, classSubjectId, moduleName));
    }

    @GetMapping("/study-plan/{userId}/{classSubjectId}")
    public ResponseEntity<String> generateStudyPlan(
            @PathVariable Long userId,
            @PathVariable Long classSubjectId,
            @RequestParam(required = false) String moduleName,
            @RequestParam(required = false) Integer days) {
        String plan = studyPlanService.generateStudyPlan(userId, classSubjectId, moduleName, days);
        return ResponseEntity.ok(plan);
    }
}
