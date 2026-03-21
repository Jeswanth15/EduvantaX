package edu.example.edu.DTO;

import java.time.LocalDate;
import java.time.LocalTime;

import lombok.Data;

@Data
public class ExamScheduleDTO {
    private Long examScheduleId;
    private Long classroomId;
    private Long subjectId;
    private String subjectName;
    private String classroomName;
    private Long classSubjectId;

    private LocalDate examDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String roomNo;
}
