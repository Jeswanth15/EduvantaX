package edu.example.edu.transport.Repository;

import edu.example.edu.transport.Entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {
    List<Location> findTop2ByBusIdOrderByTimestampDesc(Long busId);
    Optional<Location> findFirstByBusIdOrderByTimestampDesc(Long busId);
}
