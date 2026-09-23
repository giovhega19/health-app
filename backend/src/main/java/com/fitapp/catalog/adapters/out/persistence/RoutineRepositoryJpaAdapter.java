package com.fitapp.catalog.adapters.out.persistence;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitapp.catalog.domain.Routine;
import com.fitapp.catalog.domain.RoutineBlock;
import com.fitapp.catalog.domain.RoutineRepository;
import com.fitapp.catalog.domain.TimerSettings;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Component;

/** Real {@link RoutineRepository} adapter over Spring Data JPA / PostgreSQL. */
@Component
public class RoutineRepositoryJpaAdapter implements RoutineRepository {

  private final RoutineJpaRepository jpaRepository;
  private final ObjectMapper objectMapper;

  public RoutineRepositoryJpaAdapter(
      RoutineJpaRepository jpaRepository, ObjectMapper objectMapper) {
    this.jpaRepository = jpaRepository;
    this.objectMapper = objectMapper;
  }

  @Override
  public List<Routine> findAll() {
    return jpaRepository.findAll().stream().map(this::toDomain).toList();
  }

  @Override
  public List<Routine> findUpdatedSince(Instant since) {
    return jpaRepository.findByUpdatedAtAfter(since).stream().map(this::toDomain).toList();
  }

  private Routine toDomain(RoutineEntity entity) {
    try {
      TimerSettings timerDefaults =
          objectMapper.readValue(entity.getTimerDefaultsJson(), TimerSettings.class);
      List<RoutineBlock> blocks =
          objectMapper.readValue(
              entity.getBlocksJson(), new TypeReference<List<RoutineBlock>>() {});
      return new Routine(
          entity.getId(),
          entity.getName(),
          entity.getGoal(),
          entity.getLevel(),
          timerDefaults,
          blocks,
          entity.getVersion(),
          entity.getUpdatedAt());
    } catch (JsonProcessingException e) {
      throw new IllegalStateException("Corrupt routine JSON for id " + entity.getId(), e);
    }
  }
}
