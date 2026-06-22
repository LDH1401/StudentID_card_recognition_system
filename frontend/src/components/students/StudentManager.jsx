import React from 'react';
import AddStudent from './AddStudent';
import StudentList from './StudentList';

const StudentManager = ({
  students,
  searchTerm,
  isLoading,
  error,
  onSearchChange,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
}) => {
  return (
    <section className="dashboard-section">
      <div className="dashboard-content student-manager-content">
        <AddStudent onAddStudent={onAddStudent} />

        <StudentList
          students={students}
          searchTerm={searchTerm}
          isLoading={isLoading}
          error={error}
          onSearchChange={onSearchChange}
          onUpdateStudent={onUpdateStudent}
          onDeleteStudent={onDeleteStudent}
        />
      </div>
    </section>
  );
};

export default StudentManager;
