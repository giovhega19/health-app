package com.fitapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/** Entry point of the FitApp backend (Spring Modulith monolith, see 04-arquitectura.md §4). */
@SpringBootApplication
public class FitAppApplication {

  public static void main(String[] args) {
    SpringApplication.run(FitAppApplication.class, args);
  }
}
