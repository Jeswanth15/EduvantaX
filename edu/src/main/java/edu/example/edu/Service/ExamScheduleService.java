package edu.example.edu.Service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import edu.example.edu.DTO.ExamScheduleDTO;
import edu.example.edu.Entity.Classroom;
import edu.example.edu.Entity.ExamSchedule;
import edu.example.edu.Entity.Subject;
import edu.example.edu.Repository.ClassSubjectRepository;
import edu.example.edu.Repository.ClassroomRepository;
import edu.example.edu.Repository.ExamScheduleRepository;
import edu.example.edu.Repository.SubjectRepository;

@Service
public class ExamScheduleService {

    @Autowired
    private ExamScheduleRepository examScheduleRepository;

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private ClassSubjectRepository classSubjectRepository;

    // ➕ Create or Update Exam Schedule
    public ExamScheduleDTO saveExamSchedule(ExamScheduleDTO dto) {
        Classroom classroom = classroomRepository.findById(dto.getClassroomId())
                .orElseThrow(() -> new RuntimeException("Classroom not found"));
        Subject subject = subjectRepository.findById(dto.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        ExamSchedule schedule = new ExamSchedule();
        schedule.setExamScheduleId(dto.getExamScheduleId());
        schedule.setClassroom(classroom);
        schedule.setSubject(subject);
        schedule.setExamDate(dto.getExamDate());
        schedule.setStartTime(dto.getStartTime());
        schedule.setEndTime(dto.getEndTime());
        schedule.setRoomNo(dto.getRoomNo());

        ExamSchedule saved = examScheduleRepository.save(schedule);
        return convertToDTO(saved);
    }

    // 📜 Get all Exam Schedules
    public List<ExamScheduleDTO> getAllExamSchedules() {
        return examScheduleRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // 🏫 Get Exam Schedules by Classroom
    public List<ExamScheduleDTO> getExamSchedulesByClassroom(Long classroomId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));
        return examScheduleRepository.findByClassroom(classroom).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ❌ Delete Exam Schedule
    public void deleteExamSchedule(Long id) {
        examScheduleRepository.deleteById(id);
    }

    // 🔄 Conversion Helper
    private ExamScheduleDTO convertToDTO(ExamSchedule schedule) {
         ExamScheduleDTO dto = new ExamScheduleDTO();
            dto.setExamScheduleId(schedule.getExamScheduleId());
            dto.setClassroomId(schedule.getClassroom().getClassId());
            dto.setClassroomName(schedule.getClassroom().getName() + " - " + schedule.getClassroom().getSection()); // ✅ NEW
            dto.setSubjectId(schedule.getSubject().getSubjectId());
            dto.setSubjectName(schedule.getSubject().getName());  // ✅ NEW

            dto.setExamDate(schedule.getExamDate());
            dto.setStartTime(schedule.getStartTime());
            dto.setEndTime(schedule.getEndTime());
            dto.setRoomNo(schedule.getRoomNo());

            // Set classSubjectId
            classSubjectRepository.findByClassroomAndSubject(schedule.getClassroom(), schedule.getSubject())
                .stream().findFirst()
                .ifPresent(cs -> dto.setClassSubjectId(cs.getId()));

            return dto;
    }
}
