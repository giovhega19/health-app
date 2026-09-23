package com.fitapp.identity.domain;

import java.util.Optional;

/** Out port for {@link PasswordResetToken} persistence (RF-01.01). */
public interface PasswordResetTokenRepository {

  PasswordResetToken save(PasswordResetToken token);

  Optional<PasswordResetToken> findByTokenHash(String tokenHash);
}
