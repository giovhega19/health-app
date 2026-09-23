package com.fitapp.identity.adapters.in.web;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Request body for `POST /auth/register` / `/auth/guest/upgrade`, mirrors `RegisterRequest`. */
public record RegisterRequestDto(
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8) String password,
    @NotBlank String acceptedTermsVersion,
    boolean healthDataConsent) {}
