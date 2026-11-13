package com.scheduler.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.scheduler.backend.controller.AuthController;
import com.scheduler.backend.dto.LoginRequest;
import com.scheduler.backend.dto.RegisterRequest;
import com.scheduler.backend.security.JwtUtils;
import com.scheduler.core.entity.User;
import com.scheduler.core.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.context.annotation.Import;
import com.scheduler.backend.security.SecurityConfig;
import com.scheduler.backend.security.AuthTokenFilter;
import com.scheduler.backend.security.JwtUtils;
import com.scheduler.backend.security.UserDetailsServiceImpl;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtUtils.class, AuthTokenFilter.class})
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthenticationManager authenticationManager;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    public void setup() {
        // Mock setups
    }

    @Test
    public void testUserRegistrationSuccess() throws Exception {
        Mockito.when(userRepository.existsByUsername("testuser")).thenReturn(false);
        Mockito.when(passwordEncoder.encode("password123")).thenReturn("hashedpwd");

        RegisterRequest request = new RegisterRequest("testuser", "password123", "ROLE_USER");

        mockMvc.perform(post("/api/auth/signup")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    public void testUserRegistrationUsernameTaken() throws Exception {
        Mockito.when(userRepository.existsByUsername("takenuser")).thenReturn(true);

        RegisterRequest request = new RegisterRequest("takenuser", "password123", "ROLE_USER");

        mockMvc.perform(post("/api/auth/signup")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
