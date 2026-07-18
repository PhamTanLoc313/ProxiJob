import { MANAGEMENT_API_BASE_URL, getAuthHeader } from './apiConfig';

/**
 * Fetch staff roster (employees) for the business
 */
export async function getEmployees(status = '') {
  try {
    const headers = getAuthHeader();
    let url = `${MANAGEMENT_API_BASE_URL}/employees`;
    if (status) {
      url += `?status=${status}`;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch employees: ${response.status}`);
    }
    const resData = await response.json();
    const rawData = resData.data !== undefined ? resData.data : resData;
    const items = rawData?.items || (Array.isArray(rawData) ? rawData : []);
    
    const mapped = items.map(emp => ({
      id: emp.id,
      name: emp.fullName || emp.name || "Nhân viên",
      phone: emp.phoneNumber || emp.phone || "Không có số",
      role: emp.position || emp.role || "Nhân viên",
      employeeType: emp.isExternal === true ? "External" : "Internal",
      salaryPerHour: emp.hourlyRate !== undefined ? emp.hourlyRate : (emp.salaryPerHour || 0),
      status: emp.status || "Active"
    }));

    return {
      items: mapped,
      totalCount: rawData?.totalCount || mapped.length,
      pageNumber: rawData?.pageNumber || 1,
      pageSize: rawData?.pageSize || mapped.length
    };
  } catch (error) {
    console.log('[ProxiJob Management API] getEmployees error:', error);
    throw error;
  }
}

/**
 * Add a new employee manually to the HRM roster
 */
export async function createEmployee(payload) {
  try {
    const headers = getAuthHeader();
    const backendPayload = {
      fullName: payload.name,
      phoneNumber: payload.phone,
      position: payload.role,
      paymentType: payload.employeeType === "Monthly" ? 1 : 0,
      hourlyRate: payload.salaryPerHour || 0,
      monthlySalary: null,
      userId: null
    };

    const response = await fetch(`${MANAGEMENT_API_BASE_URL}/employees`, {
      method: 'POST',
      headers,
      body: JSON.stringify(backendPayload)
    });
    if (!response.ok) {
      throw new Error(`Failed to add employee: ${response.status}`);
    }
    const resData = await response.json();
    return resData.data !== undefined ? resData.data : resData;
  } catch (error) {
    console.log('[ProxiJob Management API] createEmployee error:', error);
    throw error;
  }
}

/**
 * Update an existing employee manually in the HRM roster
 */
export async function updateEmployee(id, payload) {
  try {
    const headers = getAuthHeader();
    const backendPayload = {
      fullName: payload.name,
      phoneNumber: payload.phone,
      position: payload.role,
      paymentType: payload.employeeType === "Monthly" ? 1 : 0,
      hourlyRate: payload.salaryPerHour || 0,
      monthlySalary: null,
      userId: null
    };

    const response = await fetch(`${MANAGEMENT_API_BASE_URL}/employees/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(backendPayload)
    });
    if (!response.ok) {
      throw new Error(`Failed to update employee: ${response.status}`);
    }
    const resData = await response.json();
    return resData.data !== undefined ? resData.data : resData;
  } catch (error) {
    console.log('[ProxiJob Management API] updateEmployee error:', error);
    throw error;
  }
}

/**
 * Terminate/Delete an employee from the roster
 */
export async function deleteEmployee(id) {
  try {
    const headers = getAuthHeader();
    const response = await fetch(`${MANAGEMENT_API_BASE_URL}/employees/${id}`, {
      method: 'DELETE',
      headers
    });
    if (!response.ok) {
      throw new Error(`Failed to delete employee: ${response.status}`);
    }
    const resData = await response.json();
    return resData.data !== undefined ? resData.data : resData;
  } catch (error) {
    console.log('[ProxiJob Management API] deleteEmployee error:', error);
    throw error;
  }
}

/**
 * Check-in a student using QR code token and GPS
 */
export async function checkInShiftApi(payload) {
  try {
    const headers = getAuthHeader();
    const response = await fetch(`${MANAGEMENT_API_BASE_URL}/timekeeping/check-in`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    const resData = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMsg = resData.message || 'Check-in thất bại. Vui lòng quét mã và thử lại.';
      throw new Error(errorMsg);
    }
    return resData.data !== undefined ? resData.data : resData;
  } catch (error) {
    console.log('[ProxiJob Management API] checkInShift API error:', error);
    throw error;
  }
}

/**
 * Check-out from a shift
 */
export async function checkOutShiftApi(payload) {
  try {
    const headers = getAuthHeader();
    const response = await fetch(`${MANAGEMENT_API_BASE_URL}/timekeeping/check-out`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    const resData = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMsg = resData.message || 'Check-out thất bại. Vui lòng thử lại.';
      throw new Error(errorMsg);
    }
    return resData.data !== undefined ? resData.data : resData;
  } catch (error) {
    console.log('[ProxiJob Management API] checkOutShift API error:', error);
    throw error;
  }
}

/**
 * Fetch the active business QR code settings
 */
export async function getQrCode() {
  try {
    const headers = getAuthHeader();
    const response = await fetch(`${MANAGEMENT_API_BASE_URL}/qr-code`, { headers });
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch QR Code: ${response.status}`);
    }
    const resData = await response.json();
    return resData.data !== undefined ? resData.data : resData;
  } catch (error) {
    console.log('[ProxiJob Management API] getQrCode error:', error);
    throw error;
  }
}

/**
 * Generate/Regenerate QR code token for checking in
 */
export async function generateQrCode() {
  try {
    const headers = getAuthHeader();
    const response = await fetch(`${MANAGEMENT_API_BASE_URL}/qr-code/generate`, {
      method: 'POST',
      headers
    });
    if (!response.ok) {
      throw new Error(`Failed to generate QR Code: ${response.status}`);
    }
    const resData = await response.json();
    return resData.data !== undefined ? resData.data : resData;
  } catch (error) {
    console.log('[ProxiJob Management API] generateQrCode error:', error);
    throw error;
  }
}

/**
 * Update the allowed radius for QR code checks
 */
export async function updateQrRadius(allowedRadiusMeters) {
  try {
    const headers = getAuthHeader();
    const response = await fetch(`${MANAGEMENT_API_BASE_URL}/qr-code/radius`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ allowedRadiusMeters })
    });
    if (!response.ok) {
      throw new Error(`Failed to update QR radius: ${response.status}`);
    }
    const resData = await response.json().catch(() => ({}));
    return resData.data !== undefined ? resData.data : resData;
  } catch (error) {
    console.log('[ProxiJob Management API] updateQrRadius error:', error);
    throw error;
  }
}

/**
 * Update the GPS coordinates for QR code location verification
 */
export async function updateQrLocation(latitude, longitude) {
  try {
    const headers = getAuthHeader();
    const response = await fetch(`${MANAGEMENT_API_BASE_URL}/qr-code/location`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ latitude, longitude })
    });
    if (!response.ok) {
      throw new Error(`Failed to update QR location: ${response.status}`);
    }
    const resData = await response.json().catch(() => ({}));
    return resData.data !== undefined ? resData.data : resData;
  } catch (error) {
    console.log('[ProxiJob Management API] updateQrLocation error:', error);
  }
}

/**
 * Fetch work schedules for a given date
 */
export async function getSchedules(date) {
  try {
    const headers = getAuthHeader();
    const response = await fetch(`${MANAGEMENT_API_BASE_URL}/schedules?date=${date}`, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch schedules: ${response.status}`);
    }
    const resData = await response.json();
    const rawList = resData.data !== undefined ? resData.data : resData;
    const list = Array.isArray(rawList) ? rawList : [];
    return list.map(s => ({
      id: s.id !== undefined ? s.id : s.Id,
      employeeId: s.employeeId !== undefined ? s.employeeId : s.EmployeeId,
      businessId: s.businessId !== undefined ? s.businessId : s.BusinessId,
      jobShiftId: s.jobShiftId !== undefined ? s.jobShiftId : s.JobShiftId,
      jobShiftSalary: s.jobShiftSalary !== undefined ? s.jobShiftSalary : s.JobShiftSalary,
      date: s.date !== undefined ? s.date : s.Date,
      startTime: s.startTime !== undefined ? s.startTime : s.StartTime,
      endTime: s.endTime !== undefined ? s.endTime : s.EndTime,
      note: s.note !== undefined ? s.note : s.Note,
    }));
  } catch (error) {
    console.log('[ProxiJob Management API] getSchedules error:', error);
    throw error;
  }
}

/**
 * Create a new schedule for an employee
 */
export async function createSchedule(employeeId, payload) {
  try {
    const headers = getAuthHeader();
    const response = await fetch(`${MANAGEMENT_API_BASE_URL}/employees/${employeeId}/schedules`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      let errMsg = `Failed to create schedule: ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson && errJson.message) {
          errMsg = errJson.message;
        }
      } catch (e) {}
      throw new Error(errMsg);
    }
    const resData = await response.json();
    return resData.data !== undefined ? resData.data : resData;
  } catch (error) {
    console.log('[ProxiJob Management API] createSchedule error:', error);
    throw error;
  }
}

/**
 * Get all payroll calculations
 */
export async function getPayrolls(status = '') {
  try {
    const headers = getAuthHeader();
    let url = `${MANAGEMENT_API_BASE_URL}/payrolls`;
    if (status) {
      url += `?status=${status}`;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch payrolls: ${response.status}`);
    }
    const resData = await response.json();
    return resData.data !== undefined ? resData.data : resData;
  } catch (error) {
    console.log('[ProxiJob Management API] getPayrolls error:', error);
    throw error;
  }
}

/**
 * Fetch payrolls for the student
 */
export async function getStudentPayrolls(status = '') {
  try {
    const headers = getAuthHeader();
    let url = `${MANAGEMENT_API_BASE_URL}/payrolls/student`;
    if (status) {
      url += `?status=${status}`;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch student payrolls: ${response.status}`);
    }
    const resData = await response.json();
    return resData.data !== undefined ? resData.data : resData;
  } catch (error) {
    console.log('[ProxiJob Management API] getStudentPayrolls error:', error);
    throw error;
  }
}

/**
 * Calculate payroll for employees
 */
export async function calculatePayroll(command) {
  try {
    const headers = getAuthHeader();
    const response = await fetch(`${MANAGEMENT_API_BASE_URL}/payrolls/calculate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(command)
    });
    if (!response.ok) {
      throw new Error(`Failed to calculate payroll: ${response.status}`);
    }
    const resData = await response.json();
    return resData.data !== undefined ? resData.data : resData;
  } catch (error) {
    console.log('[ProxiJob Management API] calculatePayroll error:', error);
    throw error;
  }
}

/**
 * Approve and paid payroll
 */
export async function approvePayroll(id, command = {}) {
  try {
    const headers = getAuthHeader();
    const response = await fetch(`${MANAGEMENT_API_BASE_URL}/payrolls/${id}/approve`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ payrollId: id, ...command })
    });
    if (!response.ok) {
      throw new Error(`Failed to approve payroll: ${response.status}`);
    }
    const resData = await response.json().catch(() => ({}));
    return resData.data !== undefined ? resData.data : resData;
  } catch (error) {
    console.log('[ProxiJob Management API] approvePayroll error:', error);
    throw error;
  }
}

/**
 * Get timekeeping check-in log details for real-time monitoring
 */
export async function getTimekeepingLogs(date) {
  try {
    const headers = getAuthHeader();
    const response = await fetch(`${MANAGEMENT_API_BASE_URL}/timekeeping?date=${date}`, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch timekeeping logs: ${response.status}`);
    }
    const resData = await response.json();
    return resData.data !== undefined ? resData.data : resData;
  } catch (error) {
    console.log('[ProxiJob Management API] getTimekeepingLogs error:', error);
    throw error;
  }
}

/**
 * Delete a work schedule
 */
export async function deleteSchedule(id) {
  try {
    const headers = getAuthHeader();
    const response = await fetch(`${MANAGEMENT_API_BASE_URL}/schedules/${id}`, {
      method: 'DELETE',
      headers
    });
    if (!response.ok) {
      let errMsg = `Failed to delete schedule: ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson && errJson.message) {
          errMsg = errJson.message;
        }
      } catch (e) {}
      throw new Error(errMsg);
    }
    const resData = await response.json().catch(() => ({}));
    return resData.data !== undefined ? resData.data : resData;
  } catch (error) {
    console.log('[ProxiJob Management API] deleteSchedule error:', error);
    throw error;
  }
}

/**
 * Fetch employee's own schedules
 */
export async function getMySchedules(fromDate, toDate) {
  try {
    const headers = getAuthHeader();
    const response = await fetch(`${MANAGEMENT_API_BASE_URL}/schedules/my-schedules?fromDate=${fromDate}&toDate=${toDate}`, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch my schedules: ${response.status}`);
    }
    const resData = await response.json();
    return resData.data !== undefined ? resData.data : resData;
  } catch (error) {
    console.log('[ProxiJob Management API] getMySchedules error:', error);
    throw error;
  }
}

/**
 * Get aggregated payroll analytics
 */
export async function getPayrollAnalytics(period = 'week') {
  try {
    const headers = getAuthHeader();
    const response = await fetch(`${MANAGEMENT_API_BASE_URL}/payrolls/analytics?period=${period}`, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch payroll analytics: ${response.status}`);
    }
    const resData = await response.json();
    return resData.data !== undefined ? resData.data : resData;
  } catch (error) {
    console.log('[ProxiJob Management API] getPayrollAnalytics error:', error);
    throw error;
  }
}

/**
 * Approve payroll interim and submit student rating/comments
 */
export async function approveInterimPayroll(id, command = {}) {
  try {
    const headers = getAuthHeader();
    const response = await fetch(`${MANAGEMENT_API_BASE_URL}/payrolls/${id}/approve-interim`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ payrollId: id, ...command })
    });
    if (!response.ok) {
      throw new Error(`Failed to approve interim payroll: ${response.status}`);
    }
    const resData = await response.json().catch(() => ({}));
    return resData.data !== undefined ? resData.data : resData;
  } catch (error) {
    console.log('[ProxiJob Management API] approveInterimPayroll error:', error);
    throw error;
  }
}

/**
 * Confirm payroll payment receipt and submit employer rating/comments
 */
export async function confirmReceiptPayroll(id, command = {}) {
  try {
    const headers = getAuthHeader();
    const response = await fetch(`${MANAGEMENT_API_BASE_URL}/payrolls/${id}/confirm-receipt`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ payrollId: id, ...command })
    });
    if (!response.ok) {
      throw new Error(`Failed to confirm receipt payroll: ${response.status}`);
    }
    const resData = await response.json().catch(() => ({}));
    return resData.data !== undefined ? resData.data : resData;
  } catch (error) {
    console.log('[ProxiJob Management API] confirmReceiptPayroll error:', error);
    throw error;
  }
}
