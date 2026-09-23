package com.fitapp.catalog.adapters.out.persistence;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface ExerciseJpaRepository extends JpaRepository<ExerciseEntity, UUID> {

  List<ExerciseEntity> findByUpdatedAtAfter(Instant since);

  Optional<ExerciseEntity> findTopByOrderByUpdatedAtDesc();
}
