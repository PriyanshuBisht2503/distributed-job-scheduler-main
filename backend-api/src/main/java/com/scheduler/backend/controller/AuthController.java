package com.scheduler.backend.controller;

import com.scheduler.backend.dto.LoginRequest;
import com.scheduler.backend.dto.LoginResponse;
import com.scheduler.backend.dto.RegisterRequest;
import com.scheduler.backend.security.JwtUtils;
import com.scheduler.backend.security.UserDetailsImpl;
import com.scheduler.core.entity.User;
import com.scheduler.core.entity.UserRole;
import com.scheduler.core.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtUtils jwtUtils;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String role = userDetails.getAuthorities().iterator().next().getAuthority();

        return ResponseEntity.ok(new LoginResponse(jwt, userDetails.getId(), userDetails.getUsername(), role));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity.badRequest().body("Error: Username is already taken!");
        }

        UserRole role = UserRole.ROLE_VIEWER;
        if (signUpRequest.getRole() != null) {
            String roleStr = signUpRequest.getRole().toUpperCase();
            if (roleStr.startsWith("ROLE_")) {
                roleStr = roleStr.substring(5);
            }
            try {
                role = UserRole.valueOf("ROLE_" + roleStr);
            } catch (IllegalArgumentException e) {
                role = UserRole.ROLE_VIEWER;
            }
        }

        User user = User.builder()
                .username(signUpRequest.getUsername())
                .passwordHash(encoder.encode(signUpRequest.getPassword()))
                .role(role)
                .build();

        userRepository.save(user);

        return ResponseEntity.ok("User registered successfully!");
    }
}
