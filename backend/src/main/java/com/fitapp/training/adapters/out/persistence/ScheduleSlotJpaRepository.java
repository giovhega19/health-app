package com.fitapp.training.adapters.out.persistence;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface ScheduleSlotJpaRepository extends JpaRepository<ScheduleSlotEntity, UUID> {

  @Modifying(clearAutomatically = true)
  @Query("delete from ScheduleSlotEntity s where s.userId = :userId")
  void deleteByUserId(@Param("userId") UUID userId);

  @Query(
      "select s from ScheduleSlotEntity s where s.userId = :userId and s.updatedAt > :since "
          + "order by s.updatedAt asc, s.id asc")
  List<ScheduleSlotEntity> findByUserIdUpdatedSince(
      @Param("userId") UUID userId, @Param("since") Instant since);
}
