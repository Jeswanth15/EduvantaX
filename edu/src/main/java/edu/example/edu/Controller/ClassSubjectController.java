package edu.example.edu.Controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import edu.example.edu.DTO.ClassSubjectDTO;
import edu.example.edu.Service.ClassSubjectService;

@RestController
@RequestMapping("/api/class-subjects")
public class ClassSubjectController {

    private final ClassSubjectService classSubjectService;

    public ClassSubjectController(ClassSubjectService classSubjectService) {
        this.classSubjectService = classSubjectService;
    }

    // Assign subject
    @PostMapping("/assign")
    @PreAuthorize("hasAnyAuthority('SCHOOLADMIN','PRINCIPAL')")
    public ClassSubjectDTO assignSubject(@RequestBody ClassSubjectDTO dto) {
        return classSubjectService.assignSubject(dto);
    }

    // Get all subjects
    @GetMapping("/get")
    @PreAuthorize("hasAnyAuthority('STUDENT','TEACHER','SCHOOLADMIN','PRINCIPAL')")
    public List<ClassSubjectDTO> getSubjects() {
        return classSubjectService.getSubjects();
    }

    // Update teacher on an existing assignment
    @PutMapping("/update/{id}")
    @PreAuthorize("hasAnyAuthority('SCHOOLADMIN','PRINCIPAL')")
    public ClassSubjectDTO updateTeacher(@PathVariable Long id,
                                         @RequestParam(required = false) Long teacherId) {
        return classSubjectService.updateTeacher(id, teacherId);
    }

    // Delete subject
    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasAnyAuthority('SCHOOLADMIN','PRINCIPAL','ADMIN')")
    public String deleteSubject(@PathVariable Long id) {
        classSubjectService.deleteSubject(id);
        return "Class subject deleted successfully";
    }
}
