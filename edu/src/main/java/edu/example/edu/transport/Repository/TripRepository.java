package edu.example.edu.transport.Repository;

import edu.example.edu.transport.Entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    Optional<Trip> findByBusIdAndStatus(Long busId, Trip.TripStatus status);
}
