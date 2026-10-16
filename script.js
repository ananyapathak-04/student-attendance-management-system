
const studentName = document.getElementById("studentName");
const addStudentBtn = document.getElementById("addStudentBtn");
const studentList = document.getElementById("studentList");
const attendanceDate = document.getElementById("attendanceDate");
const searchStudent = document.getElementById("searchStudent");
const exportBtn = document.getElementById("exportBtn");

// Load students from localStorage
let students = JSON.parse(localStorage.getItem("students")) || [];

// Set today's date if no date is selected
if (attendanceDate && !attendanceDate.value) {
    attendanceDate.value = new Date().toISOString().split("T")[0];
}

// Save students to localStorage
function saveStudents() {
    localStorage.setItem("students", JSON.stringify(students));
}

// Get attendance record for a particular date
function getAttendanceRecord(student, date) {
    if (!student.attendance) {
        student.attendance = {};
    }

    return student.attendance[date] || "";
}

// Calculate attendance statistics for a student
function getStudentStats(student) {
    const attendance = student.attendance || {};

    const records = Object.values(attendance).filter(
        status => status === "Present" || status === "Absent"
    );

    const present = records.filter(status => status === "Present").length;
    const absent = records.filter(status => status === "Absent").length;
    const total = present + absent;

    const percentage = total > 0
        ? (present / total) * 100
        : 0;

    return {
        present,
        absent,
        total,
        percentage
    };
}

// Add a new student
if (addStudentBtn) {
    addStudentBtn.addEventListener("click", function () {
        const name = studentName.value.trim();

        if (name === "") {
            alert("Please enter a student name!");
            return;
        }

        // Duplicate names are allowed
        const highestRollNo = students.reduce((max, student) => {
            return Math.max(max, Number(student.rollNo) || 0);
        }, 0);

        const newStudent = {
            rollNo: highestRollNo + 1,
            name: name,
            attendance: {}
        };

        students.push(newStudent);

        saveStudents();
        displayStudents();
        updateDashboard();

        studentName.value = "";
        studentName.focus();
    });
}

// Display students in the table
function displayStudents() {
    studentList.innerHTML = "";

    const selectedDate = attendanceDate.value;
    const searchText = searchStudent.value.trim().toLowerCase();

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchText)
    );

    if (filteredStudents.length === 0) {
        studentList.innerHTML = `
            <tr>
                <td colspan="7">No students found.</td>
            </tr>
        `;
        return;
    }

    filteredStudents.forEach(student => {
        const stats = getStudentStats(student);
        const todayStatus = getAttendanceRecord(student, selectedDate);

        const row = document.createElement("tr");

        let statusText = "Not Marked";

        if (todayStatus === "Present") {
            statusText = "Present";
        } else if (todayStatus === "Absent") {
            statusText = "Absent";
        }

        const attendanceClass =
            stats.total > 0 && stats.percentage < 75
                ? "low-attendance"
                : "";

        const warningText =
            stats.total > 0 && stats.percentage < 75
                ? '<span class="warning">Low Attendance!</span>'
                : "";

        row.innerHTML = `
            <td>${student.rollNo}</td>

            <td>
                <span>${escapeHTML(student.name)}</span>
                ${warningText}
            </td>

            <td>${stats.present}</td>

            <td>${stats.absent}</td>

            <td class="${attendanceClass}">
                ${stats.percentage.toFixed(1)}%
            </td>

            <td>${statusText}</td>

            <td>
                <button class="edit-btn">Edit</button>
                <button class="present-btn">Present</button>
                <button class="absent-btn">Absent</button>
                <button class="delete-btn">Delete</button>
            </td>
        `;

        // Edit student name
        const editBtn = row.querySelector(".edit-btn");

        editBtn.addEventListener("click", function () {
            const newName = prompt(
                "Enter updated student name:",
                student.name
            );

            if (newName === null) {
                return;
            }

            const trimmedName = newName.trim();

            if (trimmedName === "") {
                alert("Student name cannot be empty!");
                return;
            }

            student.name = trimmedName;

            saveStudents();
            displayStudents();
            updateDashboard();

            alert("Student name updated successfully!");
        });

        // Mark student Present
        const presentBtn = row.querySelector(".present-btn");

        presentBtn.addEventListener("click", function () {
            if (!selectedDate) {
                alert("Please select an attendance date!");
                return;
            }

            if (!student.attendance) {
                student.attendance = {};
            }

            student.attendance[selectedDate] = "Present";

            saveStudents();
            displayStudents();
            updateDashboard();
        });

        // Mark student Absent
        const absentBtn = row.querySelector(".absent-btn");

        absentBtn.addEventListener("click", function () {
            if (!selectedDate) {
                alert("Please select an attendance date!");
                return;
            }

            if (!student.attendance) {
                student.attendance = {};
            }

            student.attendance[selectedDate] = "Absent";

            saveStudents();
            displayStudents();
            updateDashboard();
        });

        // Delete student
        const deleteBtn = row.querySelector(".delete-btn");

        deleteBtn.addEventListener("click", function () {
            const confirmDelete = confirm(
                `Are you sure you want to delete ${student.name}?`
            );

            if (!confirmDelete) {
                return;
            }

            students = students.filter(
                item => item !== student
            );

            saveStudents();
            displayStudents();
            updateDashboard();
        });

        studentList.appendChild(row);
    });
}

// Prevent student names from being interpreted as HTML
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return replacements[character];
    });
}

// Update dashboard statistics
function updateDashboard() {
    const totalStudentsElement = document.getElementById("totalStudents");
    const presentTodayElement = document.getElementById("presentToday");
    const absentTodayElement = document.getElementById("absentToday");
    const overallAttendanceElement = document.getElementById("overallAttendance");

    const selectedDate = attendanceDate.value;

    let presentToday = 0;
    let absentToday = 0;

    let totalPresent = 0;
    let totalRecords = 0;

    students.forEach(student => {
        const status = getAttendanceRecord(student, selectedDate);

        if (status === "Present") {
            presentToday++;
        } else if (status === "Absent") {
            absentToday++;
        }

        const stats = getStudentStats(student);

        totalPresent += stats.present;
        totalRecords += stats.total;
    });

    const overallPercentage = totalRecords > 0
        ? (totalPresent / totalRecords) * 100
        : 0;

    if (totalStudentsElement) {
        totalStudentsElement.textContent = students.length;
    }

    if (presentTodayElement) {
        presentTodayElement.textContent = presentToday;
    }

    if (absentTodayElement) {
        absentTodayElement.textContent = absentToday;
    }

    if (overallAttendanceElement) {
        overallAttendanceElement.textContent =
            overallPercentage.toFixed(1) + "%";
    }
}

// Search students by name
if (searchStudent) {
    searchStudent.addEventListener("input", function () {
        displayStudents();
    });
}

// Refresh table and dashboard when date changes
if (attendanceDate) {
    attendanceDate.addEventListener("change", function () {
        displayStudents();
        updateDashboard();
    });
}

// Export attendance summary to CSV
if (exportBtn) {
    exportBtn.addEventListener("click", function () {
        if (students.length === 0) {
            alert("No students available to export!");
            return;
        }

        const headers = [
            "Roll No",
            "Student Name",
            "Total Present",
            "Total Absent",
            "Attendance Percentage"
        ];

        const rows = students.map(student => {
            const stats = getStudentStats(student);

            return [
                student.rollNo,
                student.name,
                stats.present,
                stats.absent,
                stats.percentage.toFixed(1) + "%"
            ];
        });

        const csvContent = [headers, ...rows]
            .map(row =>
                row.map(value =>
                    `"${String(value).replace(/"/g, '""')}"`
                ).join(",")
            )
            .join("\n");

        const blob = new Blob(
            ["\uFEFF" + csvContent],
            { type: "text/csv;charset=utf-8;" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "student_attendance.csv";

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    });
}

// Initial display
displayStudents();
updateDashboard();
