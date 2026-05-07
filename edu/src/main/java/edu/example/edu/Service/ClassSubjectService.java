package edu.example.edu.Service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import edu.example.edu.DTO.ClassSubjectDTO;
import edu.example.edu.Entity.ClassSubject;
import edu.example.edu.Entity.Classroom;
import edu.example.edu.Entity.Subject;
import edu.example.edu.Entity.User;
import edu.example.edu.Repository.ClassSubjectRepository;
import edu.example.edu.Repository.ClassroomRepository;
import edu.example.edu.Repository.SubjectRepository;
import edu.example.edu.Repository.UserRepository;

@Service
public class ClassSubjectService {

    private final ClassSubjectRepository classSubjectRepository;
    private final ClassroomRepository classroomRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    public ClassSubjectService(ClassSubjectRepository classSubjectRepository,
                               ClassroomRepository classroomRepository,
                               SubjectRepository subjectRepository,
                               UserRepository userRepository) {
        this.classSubjectRepository = classSubjectRepository;
        this.classroomRepository = classroomRepository;
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
    }

      private ClassSubjectDTO convertToDTO(ClassSubject cs) {
            ClassSubjectDTO dto = new ClassSubjectDTO();
            dto.setId(cs.getId());

            // Classroom
            dto.setClassroomId(cs.getClassroom().getClassId());
            dto.setClassroomName(cs.getClassroom().getName());
            dto.setClassroomSection(cs.getClassroom().getSection());

            // Subject
            dto.setSubjectId(cs.getSubject().getSubjectId());
            dto.setSubjectName(cs.getSubject().getName());

            // Teacher (may be null)
            if (cs.getTeacher() != null) {
                dto.setTeacherId(cs.getTeacher().getUserId());
                dto.setTeacherName(cs.getTeacher().getName());
            } else {
                dto.setTeacherId(null);
                dto.setTeacherName("N/A");
            }

            return dto;
        }


    // Assign subject to class with role check
    public ClassSubjectDTO assignSubject(ClassSubjectDTO dto) {
        Classroom classroom = classroomRepository.findById(dto.getClassroomId())
                .orElseThrow(() -> new RuntimeException("Classroom not found"));

        Subject subject = subjectRepository.findById(dto.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        User teacher = null;
        if (dto.getTeacherId() != null) {
            teacher = userRepository.findById(dto.getTeacherId())
                    .orElseThrow(() -> new RuntimeException("Teacher not found"));

            // Role check
            if (!teacher.getRole().name().equals("TEACHER")) {
                throw new RuntimeException("User with id " + dto.getTeacherId() + " is not a teacher");
            }
        }

        ClassSubject cs = new ClassSubject();
        cs.setClassroom(classroom);
        cs.setSubject(subject);
        cs.setTeacher(teacher);

        ClassSubject saved = classSubjectRepository.save(cs);
        return convertToDTO(saved);
    }

    // Get all subjects assigned to classes
    public List<ClassSubjectDTO> getSubjects() {
        return classSubjectRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Update teacher for an existing class-subject assignment
    public ClassSubjectDTO updateTeacher(Long id, Long teacherId) {
        ClassSubject cs = classSubjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ClassSubject not found"));

        if (teacherId == null) {
            cs.setTeacher(null);
        } else {
            User teacher = userRepository.findById(teacherId)
                    .orElseThrow(() -> new RuntimeException("Teacher not found"));
            if (!teacher.getRole().name().equals("TEACHER")) {
                throw new RuntimeException("User with id " + teacherId + " is not a teacher");
            }
            cs.setTeacher(teacher);
        }

        ClassSubject saved = classSubjectRepository.save(cs);
        return convertToDTO(saved);
    }

    // Delete subject assignment
    public void deleteSubject(Long id) {
        classSubjectRepository.deleteById(id);
    }
}
