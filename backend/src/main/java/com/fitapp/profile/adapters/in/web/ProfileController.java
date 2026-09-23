package com.fitapp.profile.adapters.in.web;

import com.fitapp.profile.application.GetBodyMetrics;
import com.fitapp.profile.application.GetProfile;
import com.fitapp.profile.application.UpsertProfile;
import com.fitapp.profile.application.UpsertProfileCommand;
import com.fitapp.profile.domain.BodyMetric;
import com.fitapp.profile.domain.ProfileSnapshot;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for `/me/profile` and `/me/body-metrics` (`packages/api-contract/openapi.yaml`,
 * tag {@code profile}). Requires a valid bearer access token; the user id is the JWT `sub` claim.
 */
@RestController
public class ProfileController {

  private final GetProfile getProfile;
  private final UpsertProfile upsertProfile;
  private final GetBodyMetrics getBodyMetrics;

  public ProfileController(
      GetProfile getProfile, UpsertProfile upsertProfile, GetBodyMetrics getBodyMetrics) {
    this.getProfile = getProfile;
    this.upsertProfile = upsertProfile;
    this.getBodyMetrics = getBodyMetrics;
  }

  @GetMapping("/api/v1/me/profile")
  public UserProfileDto getMyProfile(@AuthenticationPrincipal Jwt jwt) {
    return toDto(getProfile.execute(userId(jwt)));
  }

  @PutMapping("/api/v1/me/profile")
  public UserProfileDto updateMyProfile(
      @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody UserProfileDto request) {
    UUID userId = userId(jwt);
    upsertProfile.execute(
        new UpsertProfileCommand(
            userId,
            request.birthDate(),
            request.gender(),
            request.heightCm(),
            request.goal(),
            request.level(),
            request.daysPerWeek(),
            request.minutesPerSession(),
            request.equipment() == null ? List.of() : request.equipment(),
            request.unitSystem(),
            request.targetWeightKg(),
            request.parqFlagged()));
    return toDto(getProfile.execute(userId));
  }

  @GetMapping("/api/v1/me/body-metrics")
  public BodyMetricListResponse getMyBodyMetrics(
      @AuthenticationPrincipal Jwt jwt,
      @RequestParam(required = false) LocalDate from,
      @RequestParam(required = false) LocalDate to) {
    return new BodyMetricListResponse(
        getBodyMetrics.execute(userId(jwt), from, to).stream()
            .map(ProfileController::toDto)
            .toList());
  }

  private static UUID userId(Jwt jwt) {
    return UUID.fromString(jwt.getSubject());
  }

  private static UserProfileDto toDto(ProfileSnapshot snapshot) {
    return new UserProfileDto(
        snapshot.id(),
        snapshot.birthDate(),
        snapshot.gender(),
        snapshot.heightCm(),
        snapshot.goal(),
        snapshot.level(),
        snapshot.daysPerWeek(),
        snapshot.minutesPerSession(),
        snapshot.equipment(),
        snapshot.unitSystem(),
        snapshot.targetWeightKg(),
        snapshot.parqFlagged(),
        snapshot.healthConsentAt(),
        snapshot.updatedAt());
  }

  private static BodyMetricDto toDto(BodyMetric metric) {
    return new BodyMetricDto(
        metric.id(), metric.date(), metric.weightKg(), metric.waistCm(), metric.updatedAt());
  }
}
