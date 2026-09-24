package com.fitapp.training.adapters.out.persistence;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitapp.training.domain.Routine;
import com.fitapp.training.domain.RoutineBlock;
import com.fitapp.training.domain.RoutineRepository;
import com.fitapp.training.domain.TimerSettings;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
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
  public Optional<Routine> findById(UUID id) {
    return jpaRepository.findById(id).map(this::toDomain);
  }

  @Override
  public Routine save(Routine routine) {
    try {
      RoutineEntity saved =
          jpaRepository.save(
              new RoutineEntity(
                  routine.id(),
                  routine.userId(),
                  routine.name(),
                  routine.description(),
                  routine.goal(),
                  routine.level(),
                  routine.source(),
                  objectMapper.writeValueAsString(routine.timerDefaults()),
                  objectMapper.writeValueAsString(routine.blocks()),
                  routine.version(),
                  routine.updatedAt()));
      return toDomain(saved);
    } catch (JsonProcessingException e) {
      throw new IllegalStateException("Cannot serialize routine " + routine.id(), e);
    }
  }

  @Override
  public void deleteById(UUID id) {
    jpaRepository.deleteById(id);
  }

  @Override
  public List<Routine> findByUserIdUpdatedSince(UUID userId, Instant since, int limit) {
    return jpaRepository.findByUserIdUpdatedSince(userId, since).stream()
        .limit(limit)
        .map(this::toDomain)
        .toList();
  }

  @Override
  public void deleteByUserId(UUID userId) {
    jpaRepository.deleteByUserId(userId);
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
          entity.getUserId(),
          entity.getName(),
          entity.getDescription(),
          entity.getGoal(),
          entity.getLevel(),
          entity.getSource(),
          timerDefaults,
          blocks,
          entity.getVersion(),
          entity.getUpdatedAt());
    } catch (JsonProcessingException e) {
      throw new IllegalStateException("Corrupt routine JSON for id " + entity.getId(), e);
    }
  }
}
