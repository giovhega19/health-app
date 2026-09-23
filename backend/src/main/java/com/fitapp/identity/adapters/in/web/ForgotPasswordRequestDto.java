package com.fitapp.identity.adapters.in.web;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Request body for `POST /auth/password/forgot`, mirrors `ForgotPasswordRequest`. */
public record ForgotPasswordRequestDto(@NotBlank @Email String email) {}
