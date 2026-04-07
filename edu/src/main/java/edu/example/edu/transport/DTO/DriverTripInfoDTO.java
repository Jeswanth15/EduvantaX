package edu.example.edu.transport.DTO;

import edu.example.edu.transport.Entity.Bus;
import edu.example.edu.transport.Entity.BusStop;
import edu.example.edu.transport.Entity.Route;
import edu.example.edu.transport.Entity.Trip;
import lombok.Data;
import java.util.List;

@Data
public class DriverTripInfoDTO {
    private Bus bus;
    private Route route;
    private List<BusStop> stops;
    private Trip activeTrip;
    private boolean profileExists;
    private boolean approved;
}
