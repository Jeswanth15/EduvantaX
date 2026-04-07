package edu.example.edu.transport.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LiveLocationResponse {
    private Double latitude;
    private Double longitude;
    private String timestamp;
}
