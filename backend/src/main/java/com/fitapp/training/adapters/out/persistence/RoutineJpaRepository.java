package com.fitapp.training.adapters.out.persistence;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface RoutineJpaRepository extends JpaRepository<RoutineEntity, UUID> {

  @Modifying(clearAutomatically = true)
  @Query("delete from RoutineEntity r where r.userId = :userId")
  void deleteByUserId(@Param("userId") UUID userId);

  @Query(
      "select r from RoutineEntity r where r.userId = :userId and r.updatedAt > :since "
          + "order by r.updatedAt asc, r.id asc")
  List<RoutineEntity> findByUserIdUpdatedSince(
      @Param("userId") UUID userId, @Param("since") Instant since);
}
