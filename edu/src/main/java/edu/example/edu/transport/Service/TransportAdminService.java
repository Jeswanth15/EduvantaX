package edu.example.edu.transport.Service;

import edu.example.edu.Entity.User;
import edu.example.edu.Repository.UserRepository;
import edu.example.edu.transport.DTO.AddStopRequest;
import edu.example.edu.transport.DTO.AssignDriverRequest;
import edu.example.edu.transport.DTO.CreateRouteRequest;
import edu.example.edu.transport.Entity.Bus;
import edu.example.edu.transport.Entity.BusStop;
import edu.example.edu.transport.Entity.Driver;
import edu.example.edu.transport.Entity.Route;
import edu.example.edu.transport.Entity.Trip;
import edu.example.edu.transport.Entity.Location;
import edu.example.edu.transport.DTO.StudentBusStatusDTO;
import edu.example.edu.transport.Repository.BusRepository;
import edu.example.edu.transport.Repository.BusStopRepository;
import edu.example.edu.transport.Repository.DriverRepository;
import edu.example.edu.transport.Repository.RouteRepository;
import edu.example.edu.transport.Repository.TripRepository;
import edu.example.edu.transport.Repository.LocationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.util.List;

@Service
@Transactional
public class TransportAdminService {

    @Autowired
    private DriverRepository driverRepository;
    
    @Autowired
    private BusRepository busRepository;
    
    @Autowired
    private RouteRepository routeRepository;
    
    @Autowired
    private BusStopRepository busStopRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private LocationRepository locationRepository;

    public Driver approveDriver(Long userId) {
        // Find existing driver entry or create one
        Optional<Driver> optDriver = driverRepository.findByUser_UserId(userId);
        Driver driver;
        if (optDriver.isPresent()) {
            driver = optDriver.get();
        } else {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            if (user.getRole() != User.Role.DRIVER) {
                user.setRole(User.Role.DRIVER);
                userRepository.save(user);
            }
            driver = new Driver();
            driver.setUser(user);
        }
        
        driver.setApproved(true);
        return driverRepository.save(driver);
    }

    public Bus createBus(String busNumber, Integer capacity) {
        Bus bus = new Bus();
        bus.setBusNumber(busNumber);
        bus.setCapacity(capacity);
        return busRepository.save(bus);
    }

    public Route createRoute(CreateRouteRequest request) {
        Route route = new Route();
        route.setRouteName(request.getRouteName());
        return routeRepository.save(route);
    }

    public BusStop addStop(AddStopRequest request) {
        Route route = routeRepository.findById(request.getRouteId())
                .orElseThrow(() -> new RuntimeException("Route not found"));
                
        BusStop stop = new BusStop();
        stop.setStopName(request.getStopName());
        stop.setLatitude(request.getLatitude());
        stop.setLongitude(request.getLongitude());
        stop.setStopOrder(request.getStopOrder());
        stop.setRoute(route);
        return busStopRepository.save(stop);
    }

    public Driver assignDriverToBus(AssignDriverRequest request) {
        Driver driver = driverRepository.findById(request.getDriverId())
                .orElseThrow(() -> new RuntimeException("Driver not found"));
        Bus bus = busRepository.findById(request.getBusId())
                .orElseThrow(() -> new RuntimeException("Bus not found"));
                
        driver.setAssignedBus(bus);
        return driverRepository.save(driver);
    }
    
    public Bus assignBusToRoute(Long busId, Long routeId) {
        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> new RuntimeException("Bus not found"));
        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new RuntimeException("Route not found"));
                
        bus.setRoute(route);
        return busRepository.save(bus);
    }

    public List<Bus> getAllBuses() {
        return busRepository.findAll();
    }

    public List<Route> getAllRoutes() {
        return routeRepository.findAll();
    }

    public List<Driver> getAllDrivers() {
        return driverRepository.findAll();
    }

    @Transactional
    public void deleteBus(Long id) {
        busRepository.deleteById(id);
    }

    @Transactional
    public void deleteRoute(Long id) {
        routeRepository.deleteById(id);
    }

    public User updateStudentType(Long studentId, String type) {
        User user = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        user.setStudentType(type);
        if ("HOSTELLER".equals(type)) {
            user.setAssignedStopId(null);
        }
        return userRepository.save(user);
    }

    public User assignStudentStop(Long studentId, Long stopId) {
        User user = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        if ("HOSTELLER".equals(user.getStudentType())) {
            throw new RuntimeException("Hostellers cannot be assigned a bus stop. Change type to Day Scholar first.");
        }
        
        busStopRepository.findById(stopId)
                .orElseThrow(() -> new RuntimeException("Stop not found"));
        
        user.setAssignedStopId(stopId);
        return userRepository.save(user);
    }

    public List<User> getAllStudentsBySchool(Long schoolId) {
        return userRepository.findBySchool_SchoolIdAndRole(schoolId, User.Role.STUDENT);
    }

    public StudentBusStatusDTO getStudentBusStatus(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        
        if (student.getAssignedStopId() == null) {
            throw new RuntimeException("No bus stop assigned to student");
        }

        BusStop studentStop = busStopRepository.findById(student.getAssignedStopId())
                .orElseThrow(() -> new RuntimeException("Assigned stop not found"));
        
        Route route = studentStop.getRoute();
        // Find a bus assigned to this route
        Bus bus = busRepository.findAll().stream()
                .filter(b -> b.getRoute() != null && b.getRoute().getId().equals(route.getId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No bus currently assigned to this route"));

        StudentBusStatusDTO dto = new StudentBusStatusDTO();
        dto.setBusNumber(bus.getBusNumber());
        dto.setStudentStop(new StudentBusStatusDTO.StopDTO(
            studentStop.getStopName(), studentStop.getLatitude(), studentStop.getLongitude()));

        Optional<Trip> activeTrip = tripRepository.findByBusIdAndStatus(bus.getId(), Trip.TripStatus.IN_PROGRESS);
        
        if (!activeTrip.isPresent()) {
            dto.setStatus(StudentBusStatusDTO.TripStatus.NOT_STARTED);
            return dto;
        }

        Trip trip = activeTrip.get();
        dto.setStatus(StudentBusStatusDTO.TripStatus.IN_PROGRESS);

        // Get latest location
        Optional<Location> lastLoc = locationRepository.findFirstByBusIdOrderByTimestampDesc(bus.getId());
        if (lastLoc.isPresent()) {
            dto.setCurrentLocation(new StudentBusStatusDTO.LocationDTO(
                lastLoc.get().getLatitude(), lastLoc.get().getLongitude()));
            
            // Calculate ETA (Distance / 0.5 km per min)
            double dist = calculateDistanceInKm(lastLoc.get().getLatitude(), lastLoc.get().getLongitude(), 
                                               studentStop.getLatitude(), studentStop.getLongitude());
            dto.setEta(dist / 0.5); // Assumes 30km/h
        }

        // Current and Next stop logic
        List<BusStop> stops = busStopRepository.findByRouteIdOrderByStopOrderAsc(route.getId());
        if (trip.getLastReachedStopId() != null) {
            BusStop lastStop = busStopRepository.findById(trip.getLastReachedStopId()).orElse(null);
            if (lastStop != null) {
                dto.setCurrentStop(new StudentBusStatusDTO.StopDTO(lastStop.getStopName(), lastStop.getLatitude(), lastStop.getLongitude()));
                
                // Find next stop
                for (int i = 0; i < stops.size(); i++) {
                    if (stops.get(i).getId().equals(lastStop.getId()) && i + 1 < stops.size()) {
                        BusStop next = stops.get(i + 1);
                        dto.setNextStop(new StudentBusStatusDTO.StopDTO(next.getStopName(), next.getLatitude(), next.getLongitude()));
                        break;
                    }
                }
            }
        } else if (!stops.isEmpty()) {
            BusStop next = stops.get(0);
            dto.setNextStop(new StudentBusStatusDTO.StopDTO(next.getStopName(), next.getLatitude(), next.getLongitude()));
        }

        // All stops for polyline
        dto.setAllRouteStops(stops.stream()
            .map(s -> new StudentBusStatusDTO.StopDTO(s.getStopName(), s.getLatitude(), s.getLongitude()))
            .collect(java.util.stream.Collectors.toList()));

        return dto;
    }

    public List<edu.example.edu.transport.DTO.TripSummaryDTO> getTripSummaries() {
        java.time.LocalDate today = java.time.LocalDate.now();
        return tripRepository.findAll().stream()
            .filter(trip -> trip.getStartTime() != null && trip.getStartTime().toLocalDate().equals(today))
            .map(trip -> {
            edu.example.edu.transport.DTO.TripSummaryDTO dto = new edu.example.edu.transport.DTO.TripSummaryDTO();
            dto.setTripId(trip.getId());
            dto.setBusNumber(trip.getBus().getBusNumber());
            dto.setStatus(trip.getStatus().name());
            dto.setStartTime(trip.getStartTime());
            dto.setEndTime(trip.getEndTime());
            
            if (trip.getLastReachedStopId() != null) {
                BusStop lastStop = busStopRepository.findById(trip.getLastReachedStopId()).orElse(null);
                if (lastStop != null) {
                    dto.setLastStopName(lastStop.getStopName());
                    dto.setLastLatitude(lastStop.getLatitude());
                    dto.setLastLongitude(lastStop.getLongitude());
                }
            }
            return dto;
        }).collect(java.util.stream.Collectors.toList());
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
