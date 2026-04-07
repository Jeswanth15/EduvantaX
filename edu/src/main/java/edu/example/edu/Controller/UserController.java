
// package edu.example.edu.Controller;

// import java.nio.file.AccessDeniedException;
// import java.util.List;
// import java.util.Optional;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.security.access.prepost.PreAuthorize;
// import org.springframework.security.crypto.password.PasswordEncoder;
// import org.springframework.web.bind.annotation.DeleteMapping;
// import org.springframework.web.bind.annotation.GetMapping;
// import org.springframework.web.bind.annotation.PathVariable;
// import org.springframework.web.bind.annotation.PostMapping;
// import org.springframework.web.bind.annotation.PutMapping;
// import org.springframework.web.bind.annotation.RequestBody;
// import org.springframework.web.bind.annotation.RequestMapping;
// import org.springframework.web.bind.annotation.RequestParam;
// import org.springframework.web.bind.annotation.RestController;

// import edu.example.edu.Config.JwtUtil;
// import edu.example.edu.DTO.LoginDTO;
// import edu.example.edu.DTO.RegisterDTO;
// import edu.example.edu.DTO.UserDTO;
// import edu.example.edu.Entity.School;
// import edu.example.edu.Entity.User;
// import edu.example.edu.Repository.SchoolRepository;
// import edu.example.edu.Repository.UserRepository;
// import edu.example.edu.Service.UserService;

// @RestController
// @RequestMapping("/api/users")
// public class UserController {

//     private final UserService userService;

//     @Autowired
//     private UserRepository userRepository;

//     @Autowired
//     private SchoolRepository schoolRepository;

//     @Autowired
//     private PasswordEncoder passwordEncoder;

//     @Autowired
//     private JwtUtil jwtUtil;

//     public UserController(UserService userService) {
//         this.userService = userService;
//     }

//     @PostMapping("/register")
//     public UserDTO register(@RequestBody RegisterDTO dto) {
//         User user = new User();
//         user.setName(dto.getName());
//         user.setEmail(dto.getEmail());
//         user.setPassword(passwordEncoder.encode(dto.getPassword()));
//         user.setRole(User.Role.valueOf(dto.getRole().toUpperCase()));

//         if (dto.getSchoolId() != null) {
//             School school = schoolRepository.findById(dto.getSchoolId())
//                     .orElseThrow(() -> new RuntimeException("School not found with ID: " + dto.getSchoolId()));
//             user.setSchool(school);
//         } else {
//             user.setSchool(null);
//         }

//         userRepository.save(user);

//         UserDTO userDTO = new UserDTO();
//         userDTO.setUserId(user.getUserId());
//         userDTO.setName(user.getName());
//         userDTO.setEmail(user.getEmail());
//         userDTO.setRole(user.getRole().name());
//         userDTO.setSchoolId(user.getSchool() != null ? user.getSchool().getSchoolId() : null);
//         userDTO.setApprovalStatus(user.getApprovalStatus().name());
//         return userDTO;
//     }

//     @PostMapping("/login")
//     public String login(@RequestBody LoginDTO dto) {
//         Optional<User> optionalUser = userRepository.findByEmail(dto.getEmail());
//         User user = optionalUser.orElseThrow(() -> new RuntimeException("Invalid credentials"));

//         if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
//             throw new RuntimeException("Invalid credentials");
//         }

//         Long schoolId = user.getSchool() != null ? user.getSchool().getSchoolId() : null;

//         // New: obtain classroomId if user has classroom (may be null)
//         Long classroomId = null;
//         try {
//             if (user.getClassroom() != null) {
//                 classroomId = user.getClassroom().getClassId();
//             }
//         } catch (Exception e) {
//             // if User entity doesn't expose getClassroom or it's null, keep classroomId null
//             classroomId = null;
//         }

//         return jwtUtil.generateToken(
//                 user.getUserId(),
//                 user.getEmail(),
//                 user.getRole().name(),
//                 schoolId,
//                 classroomId,   // NEW param added
//                 user.getName()
//         );
//     }

//     // ------------------- UserService endpoints -------------------
//     @GetMapping
//     @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOLADMIN','PRINCIPAL')")
//     public List<UserDTO> getAllUsers() {
//         return userService.getAllUsers();
//     }

//     @GetMapping("/{id}")
//     @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOLADMIN','PRINCIPAL','TEACHER','STUDENT')")
//     public UserDTO getUserById(@PathVariable Long id) {
//         return userService.getUserById(id);
//     }

//     @DeleteMapping("/{id}")
//     @PreAuthorize("hasAnyAuthority('ADMIN')")
//     public String deleteUser(@PathVariable Long id) {
//         userService.deleteUser(id);
//         return "User deleted successfully with ID: " + id;
//     }

//     @GetMapping("/pending/{schoolId}")
//     @PreAuthorize("hasAnyAuthority('SCHOOLADMIN','PRINCIPAL')")
//     public List<UserDTO> getPendingUsers(@PathVariable Long schoolId) {
//         return userService.getPendingUsersBySchool(schoolId);
//     }

//     @PutMapping("/{userId}/approve/{adminSchoolId}")
//     @PreAuthorize("hasAnyAuthority('SCHOOLADMIN','PRINCIPAL')")
//     public UserDTO approveUser(@PathVariable Long userId, @PathVariable Long adminSchoolId) throws AccessDeniedException {
//         return userService.approveUser(userId, adminSchoolId);
//     }

//     @PutMapping("/{userId}/reject/{adminSchoolId}")
//     @PreAuthorize("hasAnyAuthority('SCHOOLADMIN','PRINCIPAL')")
//     public UserDTO rejectUser(@PathVariable Long userId, @PathVariable Long adminSchoolId) throws AccessDeniedException {
//         return userService.rejectUser(userId, adminSchoolId);
//     }

//     @PutMapping("/{userId}/role/{principalId}")
//     @PreAuthorize("hasAnyAuthority('PRINCIPAL','ADMIN')")
//     public UserDTO updateUserRole(
//             @PathVariable Long userId,
//             @PathVariable Long principalId,
//             @RequestBody String newRole) throws AccessDeniedException {

//         User user = userRepository.findById(userId)
//                 .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

//         User.Role roleEnum = User.Role.valueOf(newRole.toUpperCase());
//         user.setRole(roleEnum);
//         userRepository.save(user);

//         UserDTO userDTO = new UserDTO();
//         userDTO.setUserId(user.getUserId());
//         userDTO.setName(user.getName());
//         userDTO.setEmail(user.getEmail());
//         userDTO.setRole(user.getRole().name());
//         userDTO.setSchoolId(user.getSchool().getSchoolId());
//         userDTO.setApprovalStatus(user.getApprovalStatus().name());

//         return userDTO;
//     }

//     @PostMapping("/bulk-register")
//     @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOLADMIN','PRINCIPAL')")
//     public List<UserDTO> bulkRegister(@RequestBody List<RegisterDTO> usersDto) {
//         return userService.bulkRegister(usersDto);
//     }

//     @PostMapping("/forgot-password")
//     @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOLADMIN','PRINCIPAL','TEACHER','STUDENT')")
//     public String forgotPassword(
//             @RequestParam String email,
//             @RequestParam String newPassword) {
//         return userService.forgotPassword(email, newPassword);
//     }

//     @GetMapping("/students")
//     @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOLADMIN','PRINCIPAL','TEACHER')")
//     public List<UserDTO> getStudentsBySchool(@RequestParam Long schoolId) {
//         return userService.getUsersBySchoolAndRole(schoolId, User.Role.STUDENT);
//     }

//     @GetMapping("/teachers")
//     @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOLADMIN','PRINCIPAL')")
//     public List<UserDTO> getTeachersBySchool(@RequestParam Long schoolId) {
//         return userService.getUsersBySchoolAndRole(schoolId, User.Role.TEACHER);
//     }
// }
package edu.example.edu.Controller;

import java.nio.file.AccessDeniedException;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import edu.example.edu.Config.JwtUtil;
import edu.example.edu.DTO.LoginDTO;
import edu.example.edu.DTO.RegisterDTO;
import edu.example.edu.DTO.UserDTO;
import edu.example.edu.Entity.School;
import edu.example.edu.Entity.User;
import edu.example.edu.Repository.SchoolRepository;
import edu.example.edu.Repository.UserRepository;
import edu.example.edu.Service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SchoolRepository schoolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // ------------------------------------------------------
    // REGISTER
    // ------------------------------------------------------
    @PostMapping("/register")
    public UserDTO register(@RequestBody RegisterDTO dto) {
        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setRole(User.Role.valueOf(dto.getRole().toUpperCase()));

        if (dto.getSchoolId() != null) {
            School school = schoolRepository.findById(dto.getSchoolId())
                    .orElseThrow(() -> new RuntimeException("School not found with ID: " + dto.getSchoolId()));
            user.setSchool(school);
        } else {
            user.setSchool(null);
        }

        userRepository.save(user);

        UserDTO userDTO = new UserDTO();
        userDTO.setUserId(user.getUserId());
        userDTO.setName(user.getName());
        userDTO.setEmail(user.getEmail());
        userDTO.setRole(user.getRole().name());
        userDTO.setSchoolId(user.getSchool() != null ? user.getSchool().getSchoolId() : null);
        userDTO.setApprovalStatus(user.getApprovalStatus().name());
        return userDTO;
    }

    // ------------------------------------------------------
    // LOGIN  🚨 BLOCK PENDING & REJECTED USERS
    // ------------------------------------------------------
    @PostMapping("/login")
    public String login(@RequestBody LoginDTO dto) {
        Optional<User> optionalUser = userRepository.findByEmail(dto.getEmail());
        User user = optionalUser.orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        // ❌ BLOCK PENDING OR REJECTED USERS (Skip for Admins)
        if (user.getRole() != User.Role.ADMIN && user.getRole() != User.Role.SCHOOLADMIN && user.getRole() != User.Role.PRINCIPAL) {
            if (user.getApprovalStatus() != User.ApprovalStatus.APPROVED) {
                throw new RuntimeException("Your account is " + user.getApprovalStatus() + ". Contact school admin.");
            }
        }

        Long schoolId = user.getSchool() != null ? user.getSchool().getSchoolId() : null;

        // Include classroomId if exists
        Long classroomId = null;
        try {
            if (user.getClassroom() != null) {
                classroomId = user.getClassroom().getClassId();
            }
        } catch (Exception e) {
            classroomId = null;
        }

        return jwtUtil.generateToken(
                user.getUserId(),
                user.getEmail(),
                user.getRole().name(),
                schoolId,
                classroomId,
                user.getName()
        );
    }

    // ------------------------------------------------------
    // CRUD & ADMIN ACTIONS
    // ------------------------------------------------------
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOLADMIN','PRINCIPAL')")
    public List<UserDTO> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOLADMIN','PRINCIPAL','TEACHER','STUDENT','DRIVER')")
    public UserDTO getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOLADMIN')")
    public String deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return "User deleted successfully with ID: " + id;
    }

    @GetMapping("/pending/{schoolId}")
    @PreAuthorize("hasAnyAuthority('SCHOOLADMIN','PRINCIPAL')")
    public List<UserDTO> getPendingUsers(@PathVariable Long schoolId) {
        return userService.getPendingUsersBySchool(schoolId);
    }

    @PutMapping("/{userId}/approve/{adminSchoolId}")
    @PreAuthorize("hasAnyAuthority('SCHOOLADMIN','PRINCIPAL')")
    public UserDTO approveUser(@PathVariable Long userId, @PathVariable Long adminSchoolId) throws AccessDeniedException {
        return userService.approveUser(userId, adminSchoolId);
    }

    @PutMapping("/{userId}/reject/{adminSchoolId}")
    @PreAuthorize("hasAnyAuthority('SCHOOLADMIN','PRINCIPAL')")
    public UserDTO rejectUser(@PathVariable Long userId, @PathVariable Long adminSchoolId) throws AccessDeniedException {
        return userService.rejectUser(userId, adminSchoolId);
    }

    @PutMapping("/{userId}/role/{principalId}")
    @PreAuthorize("hasAnyAuthority('PRINCIPAL','ADMIN')")
    public UserDTO updateUserRole(
            @PathVariable Long userId,
            @PathVariable Long principalId,
            @RequestBody String newRole) throws AccessDeniedException {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        User.Role roleEnum = User.Role.valueOf(newRole.toUpperCase());
        user.setRole(roleEnum);
        userRepository.save(user);

        UserDTO userDTO = new UserDTO();
        userDTO.setUserId(user.getUserId());
        userDTO.setName(user.getName());
        userDTO.setEmail(user.getEmail());
        userDTO.setRole(user.getRole().name());
        userDTO.setSchoolId(user.getSchool().getSchoolId());
        userDTO.setApprovalStatus(user.getApprovalStatus().name());

        return userDTO;
    }

    @PostMapping("/bulk-register")
    @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOLADMIN','PRINCIPAL')")
    public List<UserDTO> bulkRegister(@RequestBody List<RegisterDTO> usersDto) {
        return userService.bulkRegister(usersDto);
    }

    @PostMapping("/forgot-password")
    @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOLADMIN','PRINCIPAL','TEACHER','STUDENT')")
    public String forgotPassword(
            @RequestParam String email,
            @RequestParam String newPassword) {
        return userService.forgotPassword(email, newPassword);
    }

    @GetMapping("/students")
    @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOLADMIN','PRINCIPAL','TEACHER')")
    public List<UserDTO> getStudentsBySchool(@RequestParam Long schoolId) {
        return userService.getUsersBySchoolAndRole(schoolId, User.Role.STUDENT);
    }

    @GetMapping("/teachers")
    @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOLADMIN','PRINCIPAL')")
    public List<UserDTO> getTeachersBySchool(@RequestParam Long schoolId) {
        return userService.getUsersBySchoolAndRole(schoolId, User.Role.TEACHER);
    }

    @GetMapping("/drivers")
    @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOLADMIN','PRINCIPAL')")
    public List<UserDTO> getDriversBySchool(@RequestParam Long schoolId) {
        return userService.getUsersBySchoolAndRole(schoolId, User.Role.DRIVER);
    }
}
