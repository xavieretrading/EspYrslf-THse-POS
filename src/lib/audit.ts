export async function logActivity(user: string, activity: string, details: string = '') {
  try {
    const activeBranchId = localStorage.getItem('activeBranchId');
    const branchId = activeBranchId ? parseInt(activeBranchId, 10) : null;

    await fetch('/api/audit-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user,
        activity,
        details,
        branch_id: branchId
      }),
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
