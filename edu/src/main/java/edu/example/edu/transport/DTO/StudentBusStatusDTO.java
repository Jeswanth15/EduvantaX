package edu.example.edu.transport.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentBusStatusDTO {
    public enum TripStatus { NOT_STARTED, IN_PROGRESS, COMPLETED }

    private TripStatus status;
    private String busNumber;
    private LocationDTO currentLocation;
    private StopDTO studentStop;
    private StopDTO currentStop;
    private StopDTO nextStop;
    private java.util.List<StopDTO> allRouteStops;
    private Double eta; // in minutes

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class LocationDTO {
        private Double latitude;
        private Double longitude;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class StopDTO {
        private String stopName;
        private Double latitude;
        private Double longitude;
    }
}
