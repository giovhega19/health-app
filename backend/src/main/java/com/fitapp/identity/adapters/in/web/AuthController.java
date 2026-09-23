package com.fitapp.identity.adapters.in.web;

import com.fitapp.identity.application.AuthTokensResult;
import com.fitapp.identity.application.IssueTokensForUser;
import com.fitapp.identity.application.LoginUser;
import com.fitapp.identity.application.LoginUserCommand;
import com.fitapp.identity.application.LoginUserResult;
import com.fitapp.identity.application.LogoutUser;
import com.fitapp.identity.application.RefreshAccessToken;
import com.fitapp.identity.application.RegisterUser;
import com.fitapp.identity.application.RegisterUserCommand;
import com.fitapp.identity.application.RegisterUserResult;
import com.fitapp.identity.application.RequestPasswordReset;
import com.fitapp.identity.application.ResetPassword;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for `/auth/*` (`packages/api-contract/openapi.yaml`, tag {@code identity}).
 * Public (`security: []`): only routes HTTP to the use cases, no business logic here
 * (04-arquitectura.md §4.1).
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

  private final RegisterUser registerUser;
  private final LoginUser loginUser;
  private final IssueTokensForUser issueTokensForUser;
  private final RefreshAccessToken refreshAccessToken;
  private final LogoutUser logoutUser;
  private final RequestPasswordReset requestPasswordReset;
  private final ResetPassword resetPassword;

  public AuthController(
      RegisterUser registerUser,
      LoginUser loginUser,
      IssueTokensForUser issueTokensForUser,
      RefreshAccessToken refreshAccessToken,
      LogoutUser logoutUser,
      RequestPasswordReset requestPasswordReset,
      ResetPassword resetPassword) {
    this.registerUser = registerUser;
    this.loginUser = loginUser;
    this.issueTokensForUser = issueTokensForUser;
    this.refreshAccessToken = refreshAccessToken;
    this.logoutUser = logoutUser;
    this.requestPasswordReset = requestPasswordReset;
    this.resetPassword = resetPassword;
  }

  @PostMapping("/register")
  public ResponseEntity<AuthTokensDto> register(@Valid @RequestBody RegisterRequestDto request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(registerAndIssueTokens(request));
  }

  /**
   * Same body/behaviour as {@link #register}: in H1 the backend has no server-side "guest" state
   * (guest data only ever lives on the device, `specs/F01-perfil-onboarding/plan.md` §1), so
   * "upgrading" a guest is, from the server's point of view, exactly a registration — the client is
   * the one that, right after this call succeeds, pushes its local data via `POST /sync/push`
   * (openapi.yaml description of `upgradeGuestToAccount`).
   */
  @PostMapping("/guest/upgrade")
  public ResponseEntity<AuthTokensDto> upgradeGuestToAccount(
      @Valid @RequestBody RegisterRequestDto request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(registerAndIssueTokens(request));
  }

  @PostMapping("/login")
  public AuthTokensDto login(@Valid @RequestBody LoginRequestDto request) {
    LoginUserResult result =
        loginUser.execute(new LoginUserCommand(request.email(), request.password()));
    return toDto(issueTokensForUser.issue(result.userId(), result.email()));
  }

  @PostMapping("/refresh")
  public AuthTokensDto refresh(@Valid @RequestBody RefreshRequestDto request) {
    return toDto(refreshAccessToken.execute(request.refreshToken()));
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(@Valid @RequestBody RefreshRequestDto request) {
    logoutUser.execute(request.refreshToken());
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/password/forgot")
  public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequestDto request) {
    requestPasswordReset.execute(request.email());
    return ResponseEntity.accepted().build();
  }

  @PostMapping("/password/reset")
  public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequestDto request) {
    resetPassword.execute(request.token(), request.newPassword());
    return ResponseEntity.ok().build();
  }

  private AuthTokensDto registerAndIssueTokens(RegisterRequestDto request) {
    RegisterUserResult result =
        registerUser.execute(
            new RegisterUserCommand(
                request.email(),
                request.password(),
                request.acceptedTermsVersion(),
                request.healthDataConsent()));
    return toDto(issueTokensForUser.issue(result.userId(), result.email()));
  }

  private static AuthTokensDto toDto(AuthTokensResult result) {
    return new AuthTokensDto(
        result.accessToken(),
        result.refreshToken(),
        new UserSummaryDto(result.userId(), result.email()));
  }
}
