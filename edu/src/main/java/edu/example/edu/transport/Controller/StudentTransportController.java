package edu.example.edu.transport.Controller;

import edu.example.edu.transport.DTO.StudentBusStatusDTO;
import edu.example.edu.transport.Service.TransportAdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/transport/student")
public class StudentTransportController {

    @Autowired
    private TransportAdminService transportService;

    @GetMapping("/{id}/bus-status")
    public ResponseEntity<StudentBusStatusDTO> getBusStatus(@PathVariable Long id) {
        return ResponseEntity.ok(transportService.getStudentBusStatus(id));
    }
}
