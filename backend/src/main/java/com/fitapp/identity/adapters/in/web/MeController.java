package com.fitapp.identity.adapters.in.web;

import com.fitapp.identity.application.DeleteAccount;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for `DELETE /me` (RF-01.08, CA-01.08.1). Requires a valid bearer access token
 * (`security: bearerAuth`); the user id is the JWT `sub` claim issued by {@code NimbusTokenIssuer}.
 */
@RestController
@RequestMapping("/api/v1/me")
public class MeController {

  private final DeleteAccount deleteAccount;

  public MeController(DeleteAccount deleteAccount) {
    this.deleteAccount = deleteAccount;
  }

  @DeleteMapping
  public ResponseEntity<Void> deleteAccount(@AuthenticationPrincipal Jwt jwt) {
    deleteAccount.execute(UUID.fromString(jwt.getSubject()));
    return ResponseEntity.accepted().build();
  }
}
