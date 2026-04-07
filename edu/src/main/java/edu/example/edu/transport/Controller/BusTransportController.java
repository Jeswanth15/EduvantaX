package edu.example.edu.transport.Controller;

import edu.example.edu.transport.DTO.LiveLocationResponse;
import edu.example.edu.transport.Entity.Location;
import edu.example.edu.transport.Repository.LocationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/transport/bus")
public class BusTransportController {

    @Autowired
    private LocationRepository locationRepository;

    @GetMapping("/{busId}/live-location")
    public ResponseEntity<LiveLocationResponse> getLiveLocation(@PathVariable Long busId) {
        java.util.Optional<Location> locationOpt = locationRepository.findFirstByBusIdOrderByTimestampDesc(busId);
        
        if (locationOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Location location = locationOpt.get();
        LiveLocationResponse response = new LiveLocationResponse(
                location.getLatitude(),
                location.getLongitude(),
                location.getTimestamp().toString()
        );
        return ResponseEntity.ok(response);
    }
}
