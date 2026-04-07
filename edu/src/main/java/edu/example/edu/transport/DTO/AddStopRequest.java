package edu.example.edu.transport.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddStopRequest {
    private String stopName;
    private Double latitude;
    private Double longitude;
    private Integer stopOrder;
    private Long routeId;
}
