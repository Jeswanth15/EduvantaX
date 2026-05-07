package edu.example.edu.transport.Repository;

import edu.example.edu.transport.Entity.BusStop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BusStopRepository extends JpaRepository<BusStop, Long> {
    List<BusStop> findByRouteIdAndIsApprovedTrueOrderByStopOrderAsc(Long routeId);
    Optional<BusStop> findFirstByRouteIdAndIsApprovedTrueOrderByStopOrderAsc(Long routeId);
    List<BusStop> findByIsApprovedFalse();
}
