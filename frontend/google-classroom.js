// google-classroom.js

window.fetchGoogleClasses = async function () {
  await ensureSignedIn();

  const res = await gapi.client.classroom.courses.list({
    courseStates: ['ACTIVE'],
    pageSize: 50
  });

  // 🔒 SAFETY CHECK
  if (!res || !res.result || !res.result.courses) {
    console.warn('No Google Classroom courses found or access denied', res);
    return [];
  }

  return res.result.courses;
};
// google-classroom.js

window.fetchClassroomAssignments = async function (courseId) {
  await ensureSignedIn();

  const res = await gapi.client.classroom.courses.courseWork.list({
    courseId,
    courseWorkStates: ['PUBLISHED']
  });

  return res.result.courseWork || [];
};
