package com.fitapp.identity.adapters.in.web;

import jakarta.validation.constraints.NotBlank;

/** Request body for `POST /auth/refresh` / `/auth/logout`, mirrors `RefreshRequest`. */
public record RefreshRequestDto(@NotBlank String refreshToken) {}
