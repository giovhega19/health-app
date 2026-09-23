package com.fitapp.identity.adapters.in.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import com.fitapp.identity.domain.EmailAlreadyRegisteredException;
import com.fitapp.identity.domain.InvalidCredentialsException;
import com.fitapp.shared.web.ApiExceptionHandler;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * RF-01.01 {@link AuthController} — HTTP wiring for `/auth/*`
 * (`packages/api-contract/openapi.yaml`, tag {@code identity}): status codes, request/response DTO
 * shapes, and that the use case results are correctly assembled into `AuthTokensDto`. {@code
 * standaloneSetup} (same approach as {@code CatalogControllerTest}) with the real {@link
 * ApiExceptionHandler} registered so the RFC 9457 mapping of domain exceptions (CA-01.01.1's
 * "already registered"/"invalid credentials" cases) is also exercised through the actual HTTP
 * layer.
 */
@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

  private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

  @Mock private RegisterUser registerUser;
  @Mock private LoginUser loginUser;
  @Mock private IssueTokensForUser issueTokensForUser;
  @Mock private RefreshAccessToken refreshAccessToken;
  @Mock private LogoutUser logoutUser;
  @Mock private RequestPasswordReset requestPasswordReset;
  @Mock private ResetPassword resetPassword;

  private MockMvc mockMvc;

  @BeforeEach
  void setUp() {
    AuthController controller =
        new AuthController(
            registerUser,
            loginUser,
            issueTokensForUser,
            refreshAccessToken,
            logoutUser,
            requestPasswordReset,
            resetPassword);
    mockMvc =
        MockMvcBuilders.standaloneSetup(controller)
            .setControllerAdvice(new ApiExceptionHandler())
            .build();
  }

  @Test
  void registerReturns201WithFreshTokens() throws Exception {
    UUID userId = UUID.randomUUID();
    when(registerUser.execute(any(RegisterUserCommand.class)))
        .thenReturn(new RegisterUserResult(userId, "new@fitapp.test"));
    when(issueTokensForUser.issue(userId, "new@fitapp.test"))
        .thenReturn(
            new AuthTokensResult("access-token", "refresh-token", userId, "new@fitapp.test"));

    mockMvc
        .perform(
            post("/api/v1/auth/register")
                .contentType("application/json")
                .content(
                    OBJECT_MAPPER.writeValueAsString(
                        new RegisterRequestDto("new@fitapp.test", "Sup3rSecret!", "1.0", true))))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.accessToken").value("access-token"))
        .andExpect(jsonPath("$.refreshToken").value("refresh-token"))
        .andExpect(jsonPath("$.user.id").value(userId.toString()))
        .andExpect(jsonPath("$.user.email").value("new@fitapp.test"));
  }

  @Test
  void registerRejectsADuplicateEmailWith409() throws Exception {
    when(registerUser.execute(any(RegisterUserCommand.class)))
        .thenThrow(new EmailAlreadyRegisteredException("dup@fitapp.test"));

    mockMvc
        .perform(
            post("/api/v1/auth/register")
                .contentType("application/json")
                .content(
                    OBJECT_MAPPER.writeValueAsString(
                        new RegisterRequestDto("dup@fitapp.test", "Sup3rSecret!", "1.0", true))))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("EMAIL_ALREADY_REGISTERED"));
  }

  @Test
  void registerRejectsAnInvalidBodyWith422() throws Exception {
    mockMvc
        .perform(
            post("/api/v1/auth/register")
                .contentType("application/json")
                .content(
                    OBJECT_MAPPER.writeValueAsString(
                        new RegisterRequestDto("not-an-email", "short", "", true))))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
  }

  @Test
  void guestUpgradeBehavesExactlyLikeRegister() throws Exception {
    UUID userId = UUID.randomUUID();
    when(registerUser.execute(any(RegisterUserCommand.class)))
        .thenReturn(new RegisterUserResult(userId, "guest@fitapp.test"));
    when(issueTokensForUser.issue(userId, "guest@fitapp.test"))
        .thenReturn(
            new AuthTokensResult("access-token", "refresh-token", userId, "guest@fitapp.test"));

    mockMvc
        .perform(
            post("/api/v1/auth/guest/upgrade")
                .contentType("application/json")
                .content(
                    OBJECT_MAPPER.writeValueAsString(
                        new RegisterRequestDto("guest@fitapp.test", "Sup3rSecret!", "1.0", true))))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.user.email").value("guest@fitapp.test"));
  }

  @Test
  void loginReturns200WithTokensOnCorrectCredentials() throws Exception {
    UUID userId = UUID.randomUUID();
    when(loginUser.execute(new LoginUserCommand("user@fitapp.test", "Sup3rSecret!")))
        .thenReturn(new LoginUserResult(userId, "user@fitapp.test"));
    when(issueTokensForUser.issue(userId, "user@fitapp.test"))
        .thenReturn(
            new AuthTokensResult("access-token", "refresh-token", userId, "user@fitapp.test"));

    mockMvc
        .perform(
            post("/api/v1/auth/login")
                .contentType("application/json")
                .content(
                    OBJECT_MAPPER.writeValueAsString(
                        new LoginRequestDto("user@fitapp.test", "Sup3rSecret!"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.accessToken").value("access-token"));
  }

  @Test
  void loginRejectsWrongCredentialsWith401() throws Exception {
    when(loginUser.execute(any(LoginUserCommand.class)))
        .thenThrow(new InvalidCredentialsException());

    mockMvc
        .perform(
            post("/api/v1/auth/login")
                .contentType("application/json")
                .content(
                    OBJECT_MAPPER.writeValueAsString(
                        new LoginRequestDto("user@fitapp.test", "wrong-password"))))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("AUTH_INVALID_CREDENTIALS"));
  }

  @Test
  void refreshReturns200WithARotatedTokenPair() throws Exception {
    UUID userId = UUID.randomUUID();
    when(refreshAccessToken.execute("raw-refresh-token"))
        .thenReturn(
            new AuthTokensResult(
                "new-access-token", "new-refresh-token", userId, "user@fitapp.test"));

    mockMvc
        .perform(
            post("/api/v1/auth/refresh")
                .contentType("application/json")
                .content(
                    OBJECT_MAPPER.writeValueAsString(new RefreshRequestDto("raw-refresh-token"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.accessToken").value("new-access-token"))
        .andExpect(jsonPath("$.refreshToken").value("new-refresh-token"));
  }

  @Test
  void logoutReturns204AndRevokesTheToken() throws Exception {
    mockMvc
        .perform(
            post("/api/v1/auth/logout")
                .contentType("application/json")
                .content(
                    OBJECT_MAPPER.writeValueAsString(new RefreshRequestDto("raw-refresh-token"))))
        .andExpect(status().isNoContent());

    verify(logoutUser).execute("raw-refresh-token");
  }

  @Test
  void forgotPasswordAlwaysReturns202() throws Exception {
    mockMvc
        .perform(
            post("/api/v1/auth/password/forgot")
                .contentType("application/json")
                .content(
                    OBJECT_MAPPER.writeValueAsString(
                        new ForgotPasswordRequestDto("user@fitapp.test"))))
        .andExpect(status().isAccepted());

    verify(requestPasswordReset).execute("user@fitapp.test");
  }

  @Test
  void resetPasswordReturns200OnASuccessfulRedemption() throws Exception {
    mockMvc
        .perform(
            post("/api/v1/auth/password/reset")
                .contentType("application/json")
                .content(
                    OBJECT_MAPPER.writeValueAsString(
                        new ResetPasswordRequestDto("raw-token", "N3wSup3rSecret!"))))
        .andExpect(status().isOk());

    verify(resetPassword).execute(eq("raw-token"), eq("N3wSup3rSecret!"));
  }
}
