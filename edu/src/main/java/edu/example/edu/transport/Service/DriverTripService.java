package edu.example.edu.transport.Service;

import edu.example.edu.transport.DTO.LocationUpdateRequest;
import edu.example.edu.transport.DTO.DriverTripInfoDTO;
import edu.example.edu.transport.Entity.Bus;
import edu.example.edu.transport.Entity.BusStop;
import edu.example.edu.transport.Entity.Driver;
import edu.example.edu.transport.Entity.Location;
import edu.example.edu.transport.Entity.Trip;
import edu.example.edu.transport.Repository.BusStopRepository;
import edu.example.edu.transport.Repository.DriverRepository;
import edu.example.edu.transport.Repository.LocationRepository;
import edu.example.edu.transport.Repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class DriverTripService {

    @Autowired
    private DriverRepository driverRepository;
    
    @Autowired
    private TripRepository tripRepository;
    
    @Autowired
    private LocationRepository locationRepository;
    
    @Autowired
    private BusStopRepository busStopRepository;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private static final double REACHED_THRESHOLD_KM = 0.05; // 50 meters

    public DriverTripInfoDTO getDriverTripInfo(Long userId) {
        Optional<Driver> optDriver = driverRepository.findByUser_UserId(userId);
        DriverTripInfoDTO dto = new DriverTripInfoDTO();
        
        if (!optDriver.isPresent()) {
            dto.setProfileExists(false);
            dto.setApproved(false);
            return dto;
        }
        
        Driver driver = optDriver.get();
        dto.setProfileExists(true);
        dto.setApproved(driver.isApproved());
        
        Bus bus = driver.getAssignedBus();
        dto.setBus(bus);
        
        if (bus != null && bus.getRoute() != null) {
            dto.setRoute(bus.getRoute());
            dto.setStops(busStopRepository.findByRouteIdOrderByStopOrderAsc(bus.getRoute().getId()));
            
            Optional<Trip> activeTrip = tripRepository.findByBusIdAndStatus(bus.getId(), Trip.TripStatus.IN_PROGRESS);
            activeTrip.ifPresent(dto::setActiveTrip);
        }
        
        return dto;
    }

    public Trip startTrip(Long userId) {
        Driver driver = driverRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException("Driver profile not found"));
                
        if (!driver.isApproved()) {
            throw new RuntimeException("Driver is not approved");
        }
        
        Bus bus = driver.getAssignedBus();
        if (bus == null) {
            throw new RuntimeException("No bus assigned to driver");
        }
        
        // Ensure no active trip exists for this bus
        Optional<Trip> activeTrip = tripRepository.findByBusIdAndStatus(bus.getId(), Trip.TripStatus.IN_PROGRESS);
        if (activeTrip.isPresent()) {
            return activeTrip.get(); // Or throw exception
        }
        
        Trip trip = new Trip();
        trip.setBus(bus);
        trip.setStartTime(LocalDateTime.now());
        trip.setStatus(Trip.TripStatus.IN_PROGRESS);
        
        return tripRepository.save(trip);
    }

    public Trip endTrip(Long userId) {
        Driver driver = driverRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException("Driver profile not found"));
                
        Bus bus = driver.getAssignedBus();
        if (bus == null) {
            throw new RuntimeException("No bus assigned to driver");
        }
        
        Trip activeTrip = tripRepository.findByBusIdAndStatus(bus.getId(), Trip.TripStatus.IN_PROGRESS)
                .orElseThrow(() -> new RuntimeException("No active trip found for this bus"));
                
        activeTrip.setStatus(Trip.TripStatus.COMPLETED);
        activeTrip.setEndTime(LocalDateTime.now());
        
        return tripRepository.save(activeTrip);
    }

    public void updateLocation(Long userId, LocationUpdateRequest request) {
        Driver driver = driverRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException("Driver profile not found"));
                
        Bus bus = driver.getAssignedBus();
        if (bus == null) {
            throw new RuntimeException("No bus assigned to driver");
        }
        
        Trip activeTrip = tripRepository.findByBusIdAndStatus(bus.getId(), Trip.TripStatus.IN_PROGRESS)
                .orElseThrow(() -> new RuntimeException("No active trip found for this bus"));
                
        Location location = new Location();
        location.setBus(bus);
        location.setLatitude(request.getLatitude());
        location.setLongitude(request.getLongitude());
        location.setTimestamp(LocalDateTime.now());
        locationRepository.save(location);
        
        // Broadcast location update via WebSocket
        messagingTemplate.convertAndSend("/topic/bus-location/" + bus.getId(), request);
        
        updateStopProgression(bus.getId(), activeTrip, request.getLatitude(), request.getLongitude());
    }
    
    private void updateStopProgression(Long busId, Trip trip, double lat, double lon) {
        if (trip.getBus().getRoute() == null) return;
        
        List<BusStop> stops = busStopRepository.findByRouteIdOrderByStopOrderAsc(trip.getBus().getRoute().getId());
        if (stops.isEmpty()) return;
        
        // Find next stop to check if reached
        BusStop nextStop = null;
        if (trip.getLastReachedStopId() == null) {
            nextStop = stops.get(0);
        } else {
            for (int i = 0; i < stops.size(); i++) {
                if (stops.get(i).getId().equals(trip.getLastReachedStopId()) && i + 1 < stops.size()) {
                    nextStop = stops.get(i + 1);
                    break;
                }
            }
        }
        
        if (nextStop != null) {
            double distance = calculateDistanceInKm(lat, lon, nextStop.getLatitude(), nextStop.getLongitude());
            if (distance <= REACHED_THRESHOLD_KM) {
                trip.setLastReachedStopId(nextStop.getId());
                tripRepository.save(trip);
            }
        }
    }
    
    // Haversine formula
    private double calculateDistanceInKm(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
