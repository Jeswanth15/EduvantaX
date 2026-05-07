package edu.example.edu.transport.Controller;

import edu.example.edu.transport.DTO.LocationUpdateRequest;
import edu.example.edu.transport.DTO.DriverTripInfoDTO;
import edu.example.edu.transport.Entity.Trip;
import edu.example.edu.transport.Service.DriverTripService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/transport/driver")
public class DriverTransportController {

    @Autowired
    private DriverTripService driverTripService;

    @PostMapping("/start-trip/{userId}")
    public ResponseEntity<Trip> startTrip(@PathVariable Long userId) {
        return ResponseEntity.ok(driverTripService.startTrip(userId));
    }

    @PostMapping("/end-trip/{userId}")
    public ResponseEntity<Trip> endTrip(@PathVariable Long userId) {
        return ResponseEntity.ok(driverTripService.endTrip(userId));
    }

    @PostMapping("/location/update/{userId}")
    public ResponseEntity<String> updateLocation(@PathVariable Long userId, @RequestBody LocationUpdateRequest request) {
        driverTripService.updateLocation(userId, request);
        return ResponseEntity.ok("Location updated successfully");
    }

    @GetMapping("/trip-info/{userId}")
    public ResponseEntity<DriverTripInfoDTO> getDriverTripInfo(@PathVariable Long userId) {
        return ResponseEntity.ok(driverTripService.getDriverTripInfo(userId));
    }

    @PostMapping("/propose-stop/{userId}")
    public ResponseEntity<edu.example.edu.transport.Entity.BusStop> proposeStop(
            @PathVariable Long userId,
            @RequestParam String stopName,
            @RequestParam Double lat,
            @RequestParam Double lng) {
        return ResponseEntity.ok(driverTripService.proposeStop(userId, stopName, lat, lng));
    }
}
