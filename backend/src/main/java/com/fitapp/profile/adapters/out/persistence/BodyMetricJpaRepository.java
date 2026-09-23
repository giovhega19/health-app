package com.fitapp.profile.adapters.out.persistence;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface BodyMetricJpaRepository extends JpaRepository<BodyMetricEntity, UUID> {

  Optional<BodyMetricEntity> findByUserIdAndDate(UUID userId, LocalDate date);

  @Modifying(clearAutomatically = true)
  @Query("delete from BodyMetricEntity m where m.userId = :userId")
  void deleteByUserId(@Param("userId") UUID userId);

  @Query(
      "select m from BodyMetricEntity m where m.userId = :userId "
          + "and (:from is null or m.date >= :from) and (:to is null or m.date <= :to) "
          + "order by m.date asc")
  List<BodyMetricEntity> findByUserIdAndRange(
      @Param("userId") UUID userId, @Param("from") LocalDate from, @Param("to") LocalDate to);

  @Query(
      "select m from BodyMetricEntity m where m.userId = :userId and m.updatedAt > :since "
          + "order by m.updatedAt asc, m.id asc")
  List<BodyMetricEntity> findByUserIdUpdatedSince(
      @Param("userId") UUID userId, @Param("since") Instant since);
}
