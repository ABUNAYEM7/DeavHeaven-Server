# DevHeaven Backend

## Overview

DevHeaven is a job-searching platform where job seekers can apply for their dream jobs, and HR professionals can create job vacancies. This backend handles CRUD operations for jobs and applications, user authentication using JWT tokens, and integrates with MongoDB for storing job data and applications.

---

## Features

- **Job Management**: HR professionals can create, edit, delete, and view job listings.
- **Job Applications**: Job seekers can apply to jobs, view their applications, and update them.
- **JWT Authentication**: Secure login and registration with JWT tokens stored in HTTP-only cookies.
- **MongoDB Integration**: All job and application data is stored in MongoDB.

---

## Technologies Used

### Backend:
- **Node.js**: JavaScript runtime environment.
- **Express.js**: Web framework for Node.js.
- **MongoDB**: Database for storing job and application data.
- **JWT**: Authentication mechanism for secure API access.
- **CookieParser**: Middleware for parsing cookies.

### Security:
- **JWT (JSON Web Token)**: Used for authentication and authorization.
- **Cookies**: Secure JWT tokens are stored using HTTP-only cookies to prevent cross-site scripting (XSS) attacks.

---

## API Endpoints

### Job Endpoints:

- **GET `/jobs`**: Get all jobs with optional filtering, searching, and sorting.
- **GET `/details/:id`**: Get details of a specific job.
- **POST `/newJob`**: Create a new job (requires authentication).
- **PATCH `/updateJob/:id`**: Update job details.
- **DELETE `/myPostedJob/:id`**: Delete a job post.

### Application Endpoints:

- **POST `/applyJobs`**: Apply for a job (requires authentication).
- **GET `/myApplications`**: View job applications of a specific user.
- **GET `/view-candidate/jobs/:jobId`**: View candidates who applied to a specific job.
- **PATCH `/updateApplication/:id`**: Update application details.
- **PATCH `/review-application/:id`**: Change application status (e.g., accepted, rejected).
- **DELETE `/delete-application/:id`**: Delete a job application.

### Authentication:

- **POST `/jwt`**: Get a JWT token for user authentication.
- **POST `/logout`**: Logout the user by clearing the JWT cookie.
