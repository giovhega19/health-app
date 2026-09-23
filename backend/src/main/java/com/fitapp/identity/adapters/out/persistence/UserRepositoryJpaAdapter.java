package com.fitapp.identity.adapters.out.persistence;

import com.fitapp.identity.domain.User;
import com.fitapp.identity.domain.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;

/** Real {@link UserRepository} adapter over Spring Data JPA / PostgreSQL. */
@Component
public class UserRepositoryJpaAdapter implements UserRepository {

  private final UserJpaRepository jpaRepository;

  public UserRepositoryJpaAdapter(UserJpaRepository jpaRepository) {
    this.jpaRepository = jpaRepository;
  }

  @Override
  public Optional<User> findByEmail(String email) {
    return jpaRepository
        .findByEmailIgnoreCaseAndDeletedAtIsNull(email)
        .map(UserRepositoryJpaAdapter::toDomain);
  }

  @Override
  public Optional<User> findById(UUID id) {
    return jpaRepository.findById(id).map(UserRepositoryJpaAdapter::toDomain);
  }

  @Override
  public User save(User user) {
    UserEntity saved =
        jpaRepository.save(
            new UserEntity(
                user.id(),
                user.email(),
                user.passwordHash(),
                user.acceptedTermsVersion(),
                user.healthDataConsent(),
                user.createdAt(),
                user.deletedAt()));
    return toDomain(saved);
  }

  private static User toDomain(UserEntity entity) {
    return new User(
        entity.getId(),
        entity.getEmail(),
        entity.getPasswordHash(),
        entity.getAcceptedTermsVersion(),
        entity.isHealthDataConsent(),
        entity.getCreatedAt(),
        entity.getDeletedAt());
  }
}
