package com.fitapp.training.adapters.out.persistence;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface CustomExerciseJpaRepository extends JpaRepository<CustomExerciseEntity, UUID> {

  @Modifying(clearAutomatically = true)
  @Query("delete from CustomExerciseEntity e where e.userId = :userId")
  void deleteByUserId(@Param("userId") UUID userId);

  @Query(
      "select e from CustomExerciseEntity e where e.userId = :userId and e.updatedAt > :since "
          + "order by e.updatedAt asc, e.id asc")
  List<CustomExerciseEntity> findByUserIdUpdatedSince(
      @Param("userId") UUID userId, @Param("since") Instant since);
}
