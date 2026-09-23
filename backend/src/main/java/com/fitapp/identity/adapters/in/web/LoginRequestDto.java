package com.fitapp.identity.adapters.in.web;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Request body for `POST /auth/login`, mirrors `LoginRequest`. */
public record LoginRequestDto(@NotBlank @Email String email, @NotBlank String password) {}
