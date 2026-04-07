
import axios from "axios";

const API_BASE = "http://localhost:8080";

const config = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

// ---------------- AUTH ----------------
export const loginUser = (credentials) =>
  axios.post(`${API_BASE}/api/users/login`, credentials);

export const registerUser = (data) =>
  axios.post(`${API_BASE}/api/users/register`, data);

export const bulkRegister = (usersList) =>
  axios.post(`${API_BASE}/api/users/bulk-register`, usersList, config());

// ---------------- USER MANAGEMENT ----------------
export const getTeachersBySchool = (schoolId) =>
  axios.get(`${API_BASE}/api/users/teachers?schoolId=${schoolId}`, config());

export const getStudentsBySchool = (schoolId) =>
  axios.get(`${API_BASE}/api/users/students?schoolId=${schoolId}`, config());

export const getDriversBySchool = (schoolId) =>
  axios.get(`${API_BASE}/api/users/drivers?schoolId=${schoolId}`, config());

export const getPendingUsersBySchool = (schoolId) =>
  axios.get(`${API_BASE}/api/users/pending/${schoolId}`, config());

export const approveUser = (userId, adminSchoolId) =>
  axios.put(`${API_BASE}/api/users/${userId}/approve/${adminSchoolId}`, null, config());

export const rejectUser = (userId, adminSchoolId) =>
  axios.put(`${API_BASE}/api/users/${userId}/reject/${adminSchoolId}`, null, config());

export const deleteUser = (userId) =>
  axios.delete(`${API_BASE}/api/users/${userId}`, config());

export const getUserById = (userId) =>
  axios.get(`${API_BASE}/api/users/${userId}`, config());

// ---------------- CLASSROOMS ----------------
export const getAllClassrooms = (schoolId) =>
  axios.get(`${API_BASE}/api/classrooms?schoolId=${schoolId}`, config());

export const createClassroom = (data) =>
  axios.post(`${API_BASE}/api/classrooms`, data, config());

export const updateClassroom = (id, data) =>
  axios.put(`${API_BASE}/api/classrooms/${id}`, data, config());

export const deleteClassroom = (id) =>
  axios.delete(`${API_BASE}/api/classrooms/${id}`, config());

export const getClassroomById = (classId) =>
  axios.get(`${API_BASE}/api/classrooms/${classId}`, config());

// ---------------- SUBJECTS ----------------
export const getAllSubjects = () =>
  axios.get(`${API_BASE}/api/subjects`, config());

export const createSubject = (data) =>
  axios.post(`${API_BASE}/api/subjects`, data, config());

export const deleteSubject = (id) =>
  axios.delete(`${API_BASE}/api/subjects/${id}`, config());

// ---------------- CLASS-SUBJECTS ----------------
export const createClassSubject = (data) =>
  axios.post(`${API_BASE}/api/class-subjects/assign`, data, config());

export const getAllClassSubjects = () =>
  axios.get(`${API_BASE}/api/class-subjects/get`, config());

export const deleteClassSubject = (id) =>
  axios.delete(`${API_BASE}/api/class-subjects/delete/${id}`, config());

// ---------------- ENROLLMENTS ----------------
export const enrollStudent = (data) =>
  axios.post(`${API_BASE}/api/enrollments/enroll`, data, config());

export const getAllEnrollments = () =>
  axios.get(`${API_BASE}/api/enrollments`, config());

export const deleteEnrollment = (id) =>
  axios.delete(`${API_BASE}/api/enrollments/${id}`, config());

// ---------------- TIMETABLES ----------------
export const getAllTimetables = () =>
  axios.get(`${API_BASE}/api/timetables`, config());

export const createTimetable = (data) =>
  axios.post(`${API_BASE}/api/timetables`, data, config());

export const updateTimetable = (id, data) =>
  axios.put(`${API_BASE}/api/timetables/${id}`, data, config());

export const deleteTimetable = (id) =>
  axios.delete(`${API_BASE}/api/timetables/${id}`, config());

// ---------------- TEACHERS FOR CLASS/SUBJECT ----------------
export const getEnrolledTeachers = (classId, subjectId) =>
  axios.get(
    `${API_BASE}/api/timetables/teachers?classId=${classId}&subjectId=${subjectId}`,
    config()
  );

export const getTeachersForClassSubject = (classId, subjectId) =>
  axios.get(
    `${API_BASE}/api/timetables/teachers?classId=${classId}&subjectId=${subjectId}`,
    config()
  );

// ---------------- SCHOOL CALENDAR ----------------
export const createCalendarEntry = (data) =>
  axios.post(`${API_BASE}/api/school-calendar/create`, data, config());

export const generateSchoolCalendar = (schoolId, startDate, endDate, holidays = []) =>
  axios.post(
    `${API_BASE}/api/school-calendar/generate`,
    holidays,
    {
      ...config(),
      params: { schoolId, startDate, endDate },
    }
  );

export const getCalendarBySchool = (schoolId) =>
  axios.get(`${API_BASE}/api/school-calendar/school/${schoolId}`, config());

export const updateCalendarEntry = (calendarId, data) =>
  axios.put(`${API_BASE}/api/school-calendar/${calendarId}`, data, config());

// ---------------- SYLLABUS ----------------
export const getAllSyllabus = () =>
  axios.get(`${API_BASE}/api/syllabus`, config());

export const getSyllabusByClassSubject = (classSubjectId) =>
  axios.get(`${API_BASE}/api/syllabus/classSubject/${classSubjectId}`, config());

export const createOrUpdateSyllabus = (formData) =>
  axios.post(`${API_BASE}/api/syllabus`, formData, {
    ...config(),
  });

export const deleteSyllabus = (id) =>
  axios.delete(`${API_BASE}/api/syllabus/${id}`, config());

// ---------------- TEACHING LOGS ----------------
export const createOrUpdateTeachingLog = (data) =>
  axios.post(`${API_BASE}/api/teachinglogs`, data, config());

export const getTeachingLogsByClassSubject = (classSubjectId) =>
  axios.get(`${API_BASE}/api/teachinglogs/classSubject/${classSubjectId}`, config());

export const deleteTeachingLog = (id) =>
  axios.delete(`${API_BASE}/api/teachinglogs/${id}`, config());

// ---------------- ATTENDANCE ----------------
export const createAttendance = (data) =>
  axios.post(`${API_BASE}/api/attendance/create`, data, config());

export const getAttendanceByStudent = (studentId) =>
  axios.get(`${API_BASE}/api/attendance/student/${studentId}`, config());

export const getAttendanceByClassDatePeriod = (classId, subjectId, date, periodNumber) =>
  axios.get(
    `${API_BASE}/api/attendance/class/${classId}/subject/${subjectId}/date/${date}/period/${periodNumber}`,
    config()
  );

export const updateAttendance = (attendanceId, data) =>
  axios.put(`${API_BASE}/api/attendance/update/${attendanceId}`, data, config());

export const deleteAttendance = (attendanceId) =>
  axios.delete(`${API_BASE}/api/attendance/delete/${attendanceId}`, config());

// ---------------- ASSIGNMENTS ----------------
export const createAssignment = (data) =>
  axios.post(`${API_BASE}/api/assignments`, data, config());

export const getAssignmentsByClassroom = (classroomId) =>
  axios.get(`${API_BASE}/api/assignments/classroom/${classroomId}`, config());

export const getAssignmentsBySubject = (subjectId) =>
  axios.get(`${API_BASE}/api/assignments/subject/${subjectId}`, config());

export const getSubmissionsByAssignment = (assignmentId) =>
  axios.get(`${API_BASE}/api/submissions/assignment/${assignmentId}`, config());

export const getAssignmentCompliance = (assignmentId) =>
  axios.get(`${API_BASE}/api/submissions/assignment/${assignmentId}/compliance`, config());

export const getSubmissionsByStudent = (studentId) =>
  axios.get(`${API_BASE}/api/submissions/student/${studentId}`, config());

// ---------------- SUBMISSIONS ----------------
export const createSubmission = (formData) =>
  axios.post(`${API_BASE}/api/submissions`, formData, config());

export const getStudentSubmissions = (assignmentId, studentId) =>
  axios.get(
    `${API_BASE}/api/submissions/assignment/${assignmentId}/student/${studentId}`,
    config()
  );

export const updateGradeAndFeedback = (submissionId, grade, feedback) =>
  axios.put(
    `${API_BASE}/api/submissions/grade-feedback/${submissionId}?grade=${grade}&feedback=${feedback}`,
    null,
    config()
  );




// ---------------- ANNOUNCEMENTS ----------------
export const getAllAnnouncements = () =>
  axios.get(`${API_BASE}/api/announcements`, config());

export const getAnnouncementsByUser = (userId) =>
  axios.get(`${API_BASE}/api/announcements/user/${userId}`, config());

export const getAnnouncementsByClassroom = (classroomId) =>
  axios.get(`${API_BASE}/api/announcements/classroom/${classroomId}`, config());

export const getAnnouncementsBySchool = (schoolId) =>
  axios.get(`${API_BASE}/api/announcements/school/${schoolId}`, config());

export const createAnnouncement = (data) =>
  axios.post(`${API_BASE}/api/announcements`, data, config());

export const deleteAnnouncement = (announcementId) =>
  axios.delete(`${API_BASE}/api/announcements/${announcementId}`, config());

// ---------------- EXAM SCHEDULE ----------------
export const createOrUpdateExamSchedule = (data) =>
  axios.post(`${API_BASE}/api/exam-schedules`, data, config());

export const getAllExamSchedules = () =>
  axios.get(`${API_BASE}/api/exam-schedules`, config());

export const getExamSchedulesByClassroom = (classroomId) =>
  axios.get(`${API_BASE}/api/exam-schedules/classroom/${classroomId}`, config());

export const deleteExamSchedule = (id) =>
  axios.delete(`${API_BASE}/api/exam-schedules/${id}`, config());

export const updateMarks = (marksId, body) =>
  axios.put(`${API_BASE}/api/marks/${marksId}`, body, config());

// ---------------- MARKS ----------------
export const createMarks = (data) =>
  axios.post(`${API_BASE}/api/marks`, data, config());

export const getMarksByStudent = (studentId) =>
  axios.get(`${API_BASE}/api/marks/student/${studentId}`, config());

export const getMarksBySubject = (subjectId) =>
  axios.get(`${API_BASE}/api/marks/subject/${subjectId}`, config());

export const deleteMarks = (marksId) =>
  axios.delete(`${API_BASE}/api/marks/${marksId}`, config());

export const getAllMarks = () =>
  axios.get(`${API_BASE}/api/marks`, config());

export const getTimetableByClass = (classId) =>
  axios.get(`${API_BASE}/api/timetables/class/${classId}`, config());

export const getExamsForStudent = (classroomId) =>
  axios.get(`${API_BASE}/api/exam-schedules/classroom/${classroomId}`, config());


export const getAllSchools = () =>
  axios.get(`${API_BASE}/api/schools`);

// ---------------- SUBSTITUTIONS ----------------
export const getAllSubstitutions = () =>
  axios.get(`${API_BASE}/api/substitutions`, config());

export const createSubstitution = (data) =>
  axios.post(`${API_BASE}/api/substitutions`, data, config());

export const getSubstitutionsByDate = (date) =>
  axios.get(`${API_BASE}/api/substitutions/date/${date}`, config());

export const getFreeTeachers = (date, periodNumber) =>
  axios.get(
    `${API_BASE}/api/substitutions/free-teachers?date=${date}&periodNumber=${periodNumber}`,
    config()
  );

export const deleteSubstitution = (id) =>
  axios.delete(`${API_BASE}/api/substitutions/${id}`, config());

// ---------------- TRANSPORT (BUS TRACKING) ----------------
export const approveDriver = (userId) =>
  axios.post(`${API_BASE}/transport/admin/approve-driver/${userId}`, null, config());

export const createBus = (busNumber, capacity) =>
  axios.post(`${API_BASE}/transport/admin/create-bus?busNumber=${busNumber}&capacity=${capacity}`, null, config());

export const getAllBuses = () =>
  axios.get(`${API_BASE}/transport/admin/buses`, config());

export const getAllRoutes = () =>
  axios.get(`${API_BASE}/transport/admin/routes`, config());

export const getAllDriversList = () =>
  axios.get(`${API_BASE}/transport/admin/drivers-list`, config());

export const createRoute = (data) =>
  axios.post(`${API_BASE}/transport/admin/create-route`, data, config());

export const addStop = (data) =>
  axios.post(`${API_BASE}/transport/admin/add-stop`, data, config());

export const assignDriver = (data) =>
  axios.post(`${API_BASE}/transport/admin/assign-driver`, data, config());

export const assignBusToRoute = (busId, routeId) =>
  axios.post(`${API_BASE}/transport/admin/assign-bus/${busId}/route/${routeId}`, null, config());

export const deleteBus = (id) =>
  axios.delete(`${API_BASE}/transport/admin/bus/${id}`, config());

export const deleteRoute = (id) =>
  axios.delete(`${API_BASE}/transport/admin/route/${id}`, config());

export const startTrip = (userId) =>
  axios.post(`${API_BASE}/transport/driver/start-trip/${userId}`, null, config());

export const endTrip = (userId) =>
  axios.post(`${API_BASE}/transport/driver/end-trip/${userId}`, null, config());

export const updateLocation = (userId, locationData) =>
  axios.post(`${API_BASE}/transport/driver/location/update/${userId}`, locationData, config());

export const getDriverTripInfo = (userId) =>
  axios.get(`${API_BASE}/transport/driver/trip-info/${userId}`, config());

export const getBusStatus = (studentId) =>
  axios.get(`${API_BASE}/transport/student/${studentId}/bus-status`, config());

export const updateStudentType = (studentId, type) =>
  axios.post(`${API_BASE}/transport/admin/update-student-type?studentId=${studentId}&type=${type}`, null, config());

export const assignStudentStop = (studentId, stopId) =>
  axios.post(`${API_BASE}/transport/admin/assign-student-stop?studentId=${studentId}&stopId=${stopId}`, null, config());

export const getAllStudents = (schoolId) =>
  axios.get(`${API_BASE}/transport/admin/all-students/${schoolId}`, config());

export const getTripSummary = () =>
  axios.get(`${API_BASE}/transport/admin/trip-summary`, config());
