package edu.example.edu.transport.DTO;

import edu.example.edu.transport.Entity.BusStop;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BusStatusResponse {
    private Long busId;
    private String tripStatus; // e.g., "NOT_STARTED", "IN_PROGRESS"
    private Double currentLatitude;
    private Double currentLongitude;
    private String currentStopName;
    private String nextStopName;
    private Double estimatedMinutes;
    private List<BusStop> stops;
}
