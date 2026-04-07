package edu.example.edu.transport.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TripSummaryDTO {
    private Long tripId;
    private String busNumber;
    private String status;
    private String lastStopName;
    private Double lastLatitude;
    private Double lastLongitude;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
