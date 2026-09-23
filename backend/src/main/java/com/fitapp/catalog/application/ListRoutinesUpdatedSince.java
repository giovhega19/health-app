package com.fitapp.catalog.application;

import com.fitapp.catalog.domain.Routine;
import com.fitapp.catalog.domain.RoutineRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * In-port / use case for {@code GET /catalog/routines?updatedSince=} (RF-02.03, RF-02.06,
 * CA-02.06.1), analogous to {@link ListExercisesUpdatedSince}.
 */
@Component
public final class ListRoutinesUpdatedSince {
  private final RoutineRepository routineRepository;

  public ListRoutinesUpdatedSince(RoutineRepository routineRepository) {
    this.routineRepository = routineRepository;
  }

  public List<Routine> execute(Instant updatedSince) {
    return updatedSince == null
        ? routineRepository.findAll()
        : routineRepository.findUpdatedSince(updatedSince);
  }
}
