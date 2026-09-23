package com.fitapp.catalog.adapters.out.persistence;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface RoutineJpaRepository extends JpaRepository<RoutineEntity, UUID> {

  List<RoutineEntity> findByUpdatedAtAfter(Instant since);

  Optional<RoutineEntity> findTopByOrderByUpdatedAtDesc();
}
