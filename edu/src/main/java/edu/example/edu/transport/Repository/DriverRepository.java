package edu.example.edu.transport.Repository;

import edu.example.edu.transport.Entity.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {
    Optional<Driver> findByUser_UserId(Long userId);
    Optional<Driver> findByAssignedBus_Id(Long busId);
}
