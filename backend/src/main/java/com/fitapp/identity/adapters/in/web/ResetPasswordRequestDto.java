package com.fitapp.identity.adapters.in.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Request body for `POST /auth/password/reset`, mirrors `ResetPasswordRequest`. */
public record ResetPasswordRequestDto(
    @NotBlank String token, @NotBlank @Size(min = 8) String newPassword) {}
