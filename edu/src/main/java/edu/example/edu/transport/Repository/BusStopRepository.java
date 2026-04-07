package edu.example.edu.transport.Repository;

import edu.example.edu.transport.Entity.BusStop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BusStopRepository extends JpaRepository<BusStop, Long> {
    List<BusStop> findByRouteIdOrderByStopOrderAsc(Long routeId);
    Optional<BusStop> findFirstByRouteIdOrderByStopOrderAsc(Long routeId);
}
