export async function logActivity(user: string, activity: string, details: string = '') {
  try {
    await fetch('/api/audit-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user,
        activity,
        details,
      }),
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
