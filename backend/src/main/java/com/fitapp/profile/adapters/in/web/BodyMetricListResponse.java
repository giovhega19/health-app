package com.fitapp.profile.adapters.in.web;

import java.util.List;

/** Response body shape for `GET /me/body-metrics` (`{ "items": [...] }`, openapi.yaml). */
public record BodyMetricListResponse(List<BodyMetricDto> items) {}
