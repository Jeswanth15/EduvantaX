package edu.example.edu.transport.Controller;

import edu.example.edu.Entity.User;
import edu.example.edu.transport.DTO.AddStopRequest;
import edu.example.edu.transport.DTO.AssignDriverRequest;
import edu.example.edu.transport.DTO.CreateRouteRequest;
import edu.example.edu.transport.Entity.Bus;
import edu.example.edu.transport.Entity.BusStop;
import edu.example.edu.transport.Entity.Driver;
import edu.example.edu.transport.Entity.Route;
import edu.example.edu.transport.Service.TransportAdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/transport/admin")
public class AdminTransportController {

    @Autowired
    private TransportAdminService adminService;

    @PostMapping("/approve-driver/{userId}")
    public ResponseEntity<Driver> approveDriver(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.approveDriver(userId));
    }

    @PostMapping("/create-bus")
    public ResponseEntity<Bus> createBus(@RequestParam String busNumber, @RequestParam Integer capacity) {
        return ResponseEntity.ok(adminService.createBus(busNumber, capacity));
    }

    @PostMapping("/create-route")
    public ResponseEntity<Route> createRoute(@RequestBody CreateRouteRequest request) {
        return ResponseEntity.ok(adminService.createRoute(request));
    }

    @PostMapping("/add-stop")
    public ResponseEntity<BusStop> addStop(@RequestBody AddStopRequest request) {
        return ResponseEntity.ok(adminService.addStop(request));
    }

    @PostMapping("/assign-driver")
    public ResponseEntity<Driver> assignDriver(@RequestBody AssignDriverRequest request) {
        return ResponseEntity.ok(adminService.assignDriverToBus(request));
    }

    @PostMapping("/assign-bus/{busId}/route/{routeId}")
    public ResponseEntity<Bus> assignBusToRoute(@PathVariable Long busId, @PathVariable Long routeId) {
        return ResponseEntity.ok(adminService.assignBusToRoute(busId, routeId));
    }

    @GetMapping("/buses")
    public ResponseEntity<java.util.List<Bus>> getAllBuses() {
        return ResponseEntity.ok(adminService.getAllBuses());
    }

    @GetMapping("/routes")
    public ResponseEntity<java.util.List<Route>> getAllRoutes() {
        return ResponseEntity.ok(adminService.getAllRoutes());
    }

    @GetMapping("/drivers-list") // Changed name to avoid conflict with UserController /drivers
    public ResponseEntity<java.util.List<Driver>> getAllDrivers() {
        return ResponseEntity.ok(adminService.getAllDrivers());
    }

    @DeleteMapping("/bus/{id}")
    public ResponseEntity<Void> deleteBus(@PathVariable Long id) {
        adminService.deleteBus(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/route/{id}")
    public ResponseEntity<Void> deleteRoute(@PathVariable Long id) {
        adminService.deleteRoute(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/update-student-type")
    public ResponseEntity<User> updateStudentType(@RequestParam Long studentId, @RequestParam String type) {
        return ResponseEntity.ok(adminService.updateStudentType(studentId, type));
    }

    @PostMapping("/assign-student-stop")
    public ResponseEntity<User> assignStudentStop(@RequestParam Long studentId, @RequestParam Long stopId) {
        return ResponseEntity.ok(adminService.assignStudentStop(studentId, stopId));
    }

    @GetMapping("/all-students/{schoolId}")
    public ResponseEntity<List<User>> getAllStudents(@PathVariable Long schoolId) {
        return ResponseEntity.ok(adminService.getAllStudentsBySchool(schoolId));
    }

    @GetMapping("/trip-summary")
    public ResponseEntity<List<edu.example.edu.transport.DTO.TripSummaryDTO>> getTripSummary() {
        return ResponseEntity.ok(adminService.getTripSummaries());
    }
}
