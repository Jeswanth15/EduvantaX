package edu.example.edu.transport.Service;

import edu.example.edu.Entity.User;
import edu.example.edu.Repository.UserRepository;
import edu.example.edu.transport.DTO.BusStatusResponse;
import edu.example.edu.transport.Entity.Bus;
import edu.example.edu.transport.Entity.BusStop;
import edu.example.edu.transport.Entity.Location;
import edu.example.edu.transport.Entity.Trip;
import edu.example.edu.transport.Repository.BusStopRepository;
import edu.example.edu.transport.Repository.LocationRepository;
import edu.example.edu.transport.Repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

@Service
public class StudentBusService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private BusStopRepository busStopRepository;
    
    @Autowired
    private TripRepository tripRepository;
    
    @Autowired
    private LocationRepository locationRepository;

    public BusStatusResponse getBusStatus(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
                
        if (!"DAY_SCHOLAR".equalsIgnoreCase(student.getStudentType())) {
            throw new RuntimeException("Trip not available for hostellers");
        }
        
        if (student.getAssignedStopId() == null) {
            throw new RuntimeException("No stop assigned to this student");
        }
        
        BusStop stop = busStopRepository.findById(student.getAssignedStopId())
                .orElseThrow(() -> new RuntimeException("Assigned stop not found"));
                
        if (stop.getRoute() == null) {
            throw new RuntimeException("Stop is not assigned to any route");
        }
        
        // Find if any bus on this route has an active trip
        // In this simple model, we assume 1 bus per route or we find the active trip for the route.
        // Let's assume the trip has a bus, and the bus is assigned to the stop's route.
        // Since we didn't add a query for this, let's fetch trips and filter manually, or we should have a query.
        // Actually, we can get the active trips. We don't have a direct query. Let me use a basic approach finding from bus.
        // We really just need the Trip that is IN_PROGRESS for a bus mapped to this Route.
        // For simplicity, let's just do a naive check.
        // To be safe without a new query method, we could inject BusRepository and find buses for this route.
        // But let's assume we can fetch all IN_PROGRESS trips? No, let's just find the first bus for the route.
        
        // Ideally we need busRepository.findByRouteId(route.getId()).
        // For now, let's do a workaround.
        // To keep it simple, I will add a method to BusStop or assume the caller provides busId? No, the student just wants bus status.
        return calculateBusStatusForStop(stop);
    }
    
    @Autowired
    private edu.example.edu.transport.Repository.BusRepository busRepository;
    
    private BusStatusResponse calculateBusStatusForStop(BusStop stop) {
        Long routeId = stop.getRoute().getId();
        
        // Find bus assigned to this route?
        // Let's assume we just iterate buses and find one with this route.
        List<Bus> buses = busRepository.findAll().stream()
                .filter(b -> b.getRoute() != null && b.getRoute().getId().equals(routeId))
                .toList();
                
        if (buses.isEmpty()) {
            return new BusStatusResponse(null, "NO_BUS_ASSIGNED_TO_ROUTE", null, null, null, null, null, null);
        }
        
        Bus bus = buses.get(0); // Take first bus
        Optional<Trip> optTrip = tripRepository.findByBusIdAndStatus(bus.getId(), Trip.TripStatus.IN_PROGRESS);
        
        if (optTrip.isEmpty()) {
            return new BusStatusResponse(bus.getId(), "NOT_STARTED", null, null, null, null, null, null);
        }
        
        Trip trip = optTrip.get();
        Optional<Location> currentLocOpt = locationRepository.findFirstByBusIdOrderByTimestampDesc(bus.getId());
        
        if (currentLocOpt.isEmpty()) {
            return new BusStatusResponse(bus.getId(), "IN_PROGRESS_NO_LOCATION", null, null, null, null, null, null);
        }
        
        Location currentLoc = currentLocOpt.get();
        
        // Find next stop name
        List<BusStop> stops = busStopRepository.findByRouteIdAndIsApprovedTrueOrderByStopOrderAsc(routeId);
        BusStop nextStop = null;
        String currentStopName = "In Transit";
        
        if (trip.getLastReachedStopId() == null) {
            if (!stops.isEmpty()) nextStop = stops.get(0);
        } else {
            for (int i = 0; i < stops.size(); i++) {
                if (stops.get(i).getId().equals(trip.getLastReachedStopId())) {
                    currentStopName = stops.get(i).getStopName();
                    if (i + 1 < stops.size()) {
                        nextStop = stops.get(i + 1);
                    }
                    break;
                }
            }
        }
        
        Double etaMinutes = null;
        if (nextStop != null) {
            double distanceToStop = calculateDistanceInKm(currentLoc.getLatitude(), currentLoc.getLongitude(), 
                                                        nextStop.getLatitude(), nextStop.getLongitude());
            
            // Calculate speed from last 2 locations
            List<Location> lastLocs = locationRepository.findTop2ByBusIdOrderByTimestampDesc(bus.getId());
            double speedKmH = 20.0; // default speed 20km/h
            if (lastLocs.size() == 2) {
                Location loc1 = lastLocs.get(0); // latest
                Location loc2 = lastLocs.get(1); // previous
                
                double dist = calculateDistanceInKm(loc1.getLatitude(), loc1.getLongitude(), loc2.getLatitude(), loc2.getLongitude());
                double hours = Duration.between(loc2.getTimestamp(), loc1.getTimestamp()).toMillis() / 3600000.0;
                if (hours > 0) {
                    speedKmH = dist / hours;
                    if (speedKmH <= 0 || speedKmH > 100) speedKmH = 20.0; // realistic guard
                }
            }
            
            etaMinutes = (distanceToStop / speedKmH) * 60.0;
        }
        
        return new BusStatusResponse(
                bus.getId(),
                "IN_PROGRESS",
                currentLoc.getLatitude(),
                currentLoc.getLongitude(),
                currentStopName,
                nextStop != null ? nextStop.getStopName() : "Final Stop Reached",
                etaMinutes,
                stops
        );
    }
    
    private double calculateDistanceInKm(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
