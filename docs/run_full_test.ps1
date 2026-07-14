$ErrorActionPreference = "Continue"

# ========================================
# ProxiJob Full System Test Script v2
# Date: 2026-07-07
# Tests ALL real API endpoints with correct routes
# ========================================

$results = @()
$testNum = 0

function Log-Test {
    param($category, $name, $status, $detail, $responseBody)
    $script:testNum++
    $emoji = if ($status -eq "PASS") { "[PASS]" } elseif ($status -eq "FAIL") { "[FAIL]" } else { "[WARN]" }
    $line = "$emoji [$script:testNum] [$category] $name"
    Write-Host $line
    if ($detail) { Write-Host "   => $detail" }
    $script:results += [PSCustomObject]@{
        No=$script:testNum; Category=$category; Name=$name; Status=$status; Detail=$detail; ResponseSnippet=$responseBody
    }
}

function Safe-Json {
    param($obj)
    try { $obj | ConvertTo-Json -Depth 3 -Compress } catch { "$obj" }
}

Write-Host "`n================================================================"
Write-Host "  ProxiJob API Integration Test Suite v2 - REAL ENDPOINTS"
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "================================================================`n"

# ============================================================
# PHASE 1: AUTHENTICATION (Identity :5231)
# ============================================================
Write-Host "`n=== PHASE 1: Authentication (Identity API :5231) ===`n"

# 1.1 Student login - SUCCESS
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"locptse184400@fpt.edu.vn","password":"Locptse184400"}'
    $studentToken = $r.data.accessToken
    $studentRefresh = $r.data.refreshToken
    Log-Test "AUTH" "Student Login (locptse184400@fpt.edu.vn)" "PASS" "statusCode=$($r.statusCode), token_len=$($studentToken.Length), expiration=$($r.data.expiration)"
} catch {
    Log-Test "AUTH" "Student Login" "FAIL" $_.Exception.Message
    $studentToken = $null
}

# 1.2 Student login - WRONG PASSWORD
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"locptse184400@fpt.edu.vn","password":"WrongPassword"}'
    Log-Test "AUTH" "Student Login WRONG PASSWORD" "FAIL" "Expected 401, got 200"
} catch {
    if ($_.Exception.Message -match "401") {
        Log-Test "AUTH" "Student Login WRONG PASSWORD" "PASS" "Correctly returned 401 Unauthorized"
    } else {
        Log-Test "AUTH" "Student Login WRONG PASSWORD" "WARN" $_.Exception.Message
    }
}

# 1.3 Non-existent account login
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"nobody@test.com","password":"test"}'
    Log-Test "AUTH" "Non-existent Account Login" "FAIL" "Expected error, got 200"
} catch {
    Log-Test "AUTH" "Non-existent Account Login" "PASS" "Correctly rejected: $($_.Exception.Message)"
}

# 1.4 Trial Employer login
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"business_trial@proxijob.test","password":"12345678"}'
    $trialToken = $r.data.accessToken
    $trialRefresh = $r.data.refreshToken
    Log-Test "AUTH" "Trial Employer Login" "PASS" "statusCode=$($r.statusCode)"
} catch {
    Log-Test "AUTH" "Trial Employer Login" "FAIL" $_.Exception.Message
    $trialToken = $null
}

# 1.5 Recruit Employer login
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"business_recruit@proxijob.test","password":"12345678"}'
    $recruitToken = $r.data.accessToken
    Log-Test "AUTH" "Recruit Employer Login" "PASS" "statusCode=$($r.statusCode)"
} catch {
    Log-Test "AUTH" "Recruit Employer Login" "FAIL" $_.Exception.Message
    $recruitToken = $null
}

# 1.6 HRM Employer login
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"business_hrm@proxijob.test","password":"12345678"}'
    $hrmToken = $r.data.accessToken
    Log-Test "AUTH" "HRM Employer Login" "PASS" "statusCode=$($r.statusCode)"
} catch {
    Log-Test "AUTH" "HRM Employer Login" "FAIL" $_.Exception.Message
    $hrmToken = $null
}

# 1.7 Refresh Token
if ($studentRefresh) {
    try {
        $r = Invoke-RestMethod -Uri "http://localhost:5231/api/auth/refresh-token" -Method POST -ContentType "application/json" -Body "{`"refreshToken`":`"$studentRefresh`"}"
        if ($r.data.accessToken) {
            $studentToken = $r.data.accessToken
            Log-Test "AUTH" "Refresh Token (Student)" "PASS" "New token issued successfully"
        } else {
            Log-Test "AUTH" "Refresh Token (Student)" "FAIL" "No new accessToken"
        }
    } catch {
        Log-Test "AUTH" "Refresh Token (Student)" "WARN" $_.Exception.Message
    }
}

# 1.8 Invalid Refresh Token
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/auth/refresh-token" -Method POST -ContentType "application/json" -Body '{"refreshToken":"totally_invalid_refresh_token_12345"}'
    Log-Test "AUTH" "Invalid Refresh Token" "FAIL" "Expected error"
} catch {
    Log-Test "AUTH" "Invalid Refresh Token" "PASS" "Correctly rejected invalid refresh token"
}

$studentHeaders = @{Authorization="Bearer $studentToken"}
$trialHeaders = @{Authorization="Bearer $trialToken"}
$recruitHeaders = @{Authorization="Bearer $recruitToken"}
$hrmHeaders = @{Authorization="Bearer $hrmToken"}

# ============================================================
# PHASE 2: STUDENT PROFILE (Identity :5231)
# ============================================================
Write-Host "`n=== PHASE 2: Student Profile ===`n"

# 2.1 Get student profile
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/student/profile" -Headers $studentHeaders
    $p = if ($r.data) { $r.data } else { $r }
    Log-Test "PROFILE" "GET Student Profile" "PASS" "fullName=$($p.fullName), readiness=$($p.readinessStatus), reputation=$($p.reputationScore), reviewCount=$($p.reviewCount)" (Safe-Json $p)
} catch {
    Log-Test "PROFILE" "GET Student Profile" "FAIL" $_.Exception.Message
}

# 2.2 Get student profile - no auth
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/student/profile"
    Log-Test "PROFILE" "GET Student Profile NO AUTH" "FAIL" "Expected 401"
} catch {
    if ($_.Exception.Message -match "401") {
        Log-Test "PROFILE" "GET Student Profile NO AUTH" "PASS" "Correctly returned 401"
    } else {
        Log-Test "PROFILE" "GET Student Profile NO AUTH" "WARN" $_.Exception.Message
    }
}

# 2.3 Get student active status
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/student/profile/active" -Headers $studentHeaders
    $a = if ($r.data) { $r.data } else { $r }
    Log-Test "PROFILE" "GET Student Active Status" "PASS" "response=$(Safe-Json $a)"
} catch {
    Log-Test "PROFILE" "GET Student Active Status" "FAIL" $_.Exception.Message
}

# ============================================================
# PHASE 3: BUSINESS PROFILE (Identity :5231)
# ============================================================
Write-Host "`n=== PHASE 3: Business Profile ===`n"

# 3.1 Trial business profile
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/business/profile" -Headers $trialHeaders
    $bp = if ($r.data) { $r.data } else { $r }
    Log-Test "PROFILE" "GET Business Profile (Trial)" "PASS" "businessName=$($bp.businessName), readiness=$($bp.readinessStatus), address=$($bp.address)" (Safe-Json $bp)
} catch {
    Log-Test "PROFILE" "GET Business Profile (Trial)" "FAIL" $_.Exception.Message
}

# 3.2 Recruit business profile
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/business/profile" -Headers $recruitHeaders
    $bp = if ($r.data) { $r.data } else { $r }
    Log-Test "PROFILE" "GET Business Profile (Recruit)" "PASS" "businessName=$($bp.businessName), readiness=$($bp.readinessStatus)" (Safe-Json $bp)
} catch {
    Log-Test "PROFILE" "GET Business Profile (Recruit)" "FAIL" $_.Exception.Message
}

# 3.3 HRM business profile
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/business/profile" -Headers $hrmHeaders
    $bp = if ($r.data) { $r.data } else { $r }
    Log-Test "PROFILE" "GET Business Profile (HRM)" "PASS" "businessName=$($bp.businessName), readiness=$($bp.readinessStatus)" (Safe-Json $bp)
} catch {
    Log-Test "PROFILE" "GET Business Profile (HRM)" "FAIL" $_.Exception.Message
}

# ============================================================
# PHASE 4: SUBSCRIPTION & QUOTA (Identity :5231)
# ============================================================
Write-Host "`n=== PHASE 4: Subscription & Quota ===`n"

# 4.1 Plans list
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/plans" -Headers $trialHeaders
    $plans = if ($r.data) { $r.data } else { $r }
    $planCount = if ($plans -is [array]) { $plans.Count } else { 1 }
    $planNames = ($plans | ForEach-Object { $_.name }) -join ", "
    Log-Test "PLANS" "GET Plans List" "PASS" "count=$planCount, names=[$planNames]"
} catch {
    Log-Test "PLANS" "GET Plans List" "FAIL" $_.Exception.Message
}

# 4.2 Trial quota
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/plans/job-posts/quota" -Headers $trialHeaders
    $q = if ($r.data) { $r.data } else { $r }
    Log-Test "PLANS" "GET Quota (Trial)" "PASS" "tier=$($q.subscriptionTier), limit=$($q.jobPostLimit), used=$($q.jobPostsUsed), remaining=$($q.jobPostsRemaining), canPost=$($q.canPostJob)"
} catch {
    Log-Test "PLANS" "GET Quota (Trial)" "FAIL" $_.Exception.Message
}

# 4.3 Recruit quota
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/plans/job-posts/quota" -Headers $recruitHeaders
    $q = if ($r.data) { $r.data } else { $r }
    Log-Test "PLANS" "GET Quota (Recruit)" "PASS" "tier=$($q.subscriptionTier), limit=$($q.jobPostLimit), used=$($q.jobPostsUsed), remaining=$($q.jobPostsRemaining), canPost=$($q.canPostJob)"
} catch {
    Log-Test "PLANS" "GET Quota (Recruit)" "FAIL" $_.Exception.Message
}

# 4.4 HRM quota
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/plans/job-posts/quota" -Headers $hrmHeaders
    $q = if ($r.data) { $r.data } else { $r }
    Log-Test "PLANS" "GET Quota (HRM)" "PASS" "tier=$($q.subscriptionTier), limit=$($q.jobPostLimit), used=$($q.jobPostsUsed), remaining=$($q.jobPostsRemaining), canPost=$($q.canPostJob)"
} catch {
    Log-Test "PLANS" "GET Quota (HRM)" "FAIL" $_.Exception.Message
}

# 4.5 Current plan
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/plans/current" -Headers $trialHeaders
    $cp = if ($r.data) { $r.data } else { $r }
    Log-Test "PLANS" "GET Current Plan (Trial)" "PASS" "response=$(Safe-Json $cp)"
} catch {
    Log-Test "PLANS" "GET Current Plan (Trial)" "WARN" $_.Exception.Message
}

# ============================================================
# PHASE 5: JOB POSTS (Job API :5021)
# ============================================================
Write-Host "`n=== PHASE 5: Job Posts (Job API :5021) ===`n"

# 5.1 Categories
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5021/api/categories"
    $cats = if ($r.data) { $r.data } else { $r }
    $catCount = if ($cats -is [array]) { $cats.Count } else { 1 }
    $catNames = ($cats | ForEach-Object { $_.name }) -join ", "
    Log-Test "JOB" "GET Categories" "PASS" "count=$catCount, names=[$catNames]"
} catch {
    Log-Test "JOB" "GET Categories" "FAIL" $_.Exception.Message
}

# 5.2 Skills
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5021/api/skills"
    $sk = if ($r.data) { $r.data } else { $r }
    $skCount = if ($sk -is [array]) { $sk.Count } else { 1 }
    Log-Test "JOB" "GET Skills" "PASS" "count=$skCount"
} catch {
    Log-Test "JOB" "GET Skills" "FAIL" $_.Exception.Message
}

# 5.3 Published jobs (no GPS)
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5021/api/job-posts/published?pageNumber=1&pageSize=10"
    $jobs = if ($r.data) { $r.data } else { $r }
    $jobItems = if ($jobs.items) { $jobs.items } elseif ($jobs -is [array]) { $jobs } else { @($jobs) }
    Log-Test "JOB" "GET Published Jobs" "PASS" "count=$($jobItems.Count), totalPages=$($jobs.totalPages), totalCount=$($jobs.totalCount)"
} catch {
    Log-Test "JOB" "GET Published Jobs" "FAIL" $_.Exception.Message
}

# 5.4 Published jobs with GPS
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5021/api/job-posts/published?pageNumber=1&pageSize=10&latitude=10.8412&longitude=106.8096"
    $jobs = if ($r.data) { $r.data } else { $r }
    $jobItems = if ($jobs.items) { $jobs.items } elseif ($jobs -is [array]) { $jobs } else { @($jobs) }
    Log-Test "JOB" "GET Published Jobs with GPS" "PASS" "count=$($jobItems.Count)"
} catch {
    Log-Test "JOB" "GET Published Jobs with GPS" "FAIL" $_.Exception.Message
}

# 5.5 Get job posts by business ID (Trial: sub=29)
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5021/api/job-posts/business/29" -Headers $trialHeaders
    $myJobs = if ($r.data) { $r.data } else { $r }
    $myCount = if ($myJobs -is [array]) { $myJobs.Count } elseif ($myJobs.items) { $myJobs.items.Count } else { 0 }
    Log-Test "JOB" "GET Jobs by Business (Trial, id=29)" "PASS" "count=$myCount"
} catch {
    Log-Test "JOB" "GET Jobs by Business (Trial, id=29)" "FAIL" $_.Exception.Message
}

# 5.6 Get job posts by business ID (Recruit: sub=30)
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5021/api/job-posts/business/30" -Headers $recruitHeaders
    $myJobs = if ($r.data) { $r.data } else { $r }
    $myCount = if ($myJobs -is [array]) { $myJobs.Count } elseif ($myJobs.items) { $myJobs.items.Count } else { 0 }
    Log-Test "JOB" "GET Jobs by Business (Recruit, id=30)" "PASS" "count=$myCount"
} catch {
    Log-Test "JOB" "GET Jobs by Business (Recruit, id=30)" "FAIL" $_.Exception.Message
}

# 5.7 Get single job post (first published ID)
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5021/api/job-posts/published?pageNumber=1&pageSize=1"
    $firstJob = if ($r.data.items) { $r.data.items[0] } elseif ($r.items) { $r.items[0] } elseif ($r.data -is [array]) { $r.data[0] } else { $r.data }
    $jobId = $firstJob.id
    if ($jobId) {
        $r2 = Invoke-RestMethod -Uri "http://localhost:5021/api/job-posts/$jobId"
        $jp = if ($r2.data) { $r2.data } else { $r2 }
        Log-Test "JOB" "GET Single Job Post (id=$jobId)" "PASS" "title=$($jp.title), status=$($jp.status), businessId=$($jp.businessId)"
    } else {
        Log-Test "JOB" "GET Single Job Post" "WARN" "No job posts found to test"
    }
} catch {
    Log-Test "JOB" "GET Single Job Post" "FAIL" $_.Exception.Message
}

# ============================================================
# PHASE 6: APPLICATIONS (Job API :5021)
# ============================================================
Write-Host "`n=== PHASE 6: Applications ===`n"

# 6.1 Student's applications
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5021/api/applications/my" -Headers $studentHeaders
    $apps = if ($r.data) { $r.data } else { $r }
    $appCount = if ($apps -is [array]) { $apps.Count } else { 0 }
    Log-Test "APP" "GET My Applications (Student)" "PASS" "count=$appCount"
} catch {
    Log-Test "APP" "GET My Applications (Student)" "FAIL" $_.Exception.Message
}

# 6.2 Get applications for a shift (find a shift first)
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5021/api/job-posts/published?pageNumber=1&pageSize=1"
    $firstJob = if ($r.data.items) { $r.data.items[0] } elseif ($r.items) { $r.items[0] } else { $null }
    if ($firstJob -and $firstJob.id) {
        $r2 = Invoke-RestMethod -Uri "http://localhost:5021/api/job-posts/$($firstJob.id)"
        $jp = if ($r2.data) { $r2.data } else { $r2 }
        $shifts = $jp.shifts
        if ($shifts -and $shifts.Count -gt 0) {
            $shiftId = $shifts[0].id
            $r3 = Invoke-RestMethod -Uri "http://localhost:5021/api/shifts/$shiftId/applications" -Headers $trialHeaders
            $shiftApps = if ($r3.data) { $r3.data } else { $r3 }
            $appCount = if ($shiftApps -is [array]) { $shiftApps.Count } else { 0 }
            Log-Test "APP" "GET Shift Applications (shiftId=$shiftId)" "PASS" "count=$appCount"
        } else {
            Log-Test "APP" "GET Shift Applications" "WARN" "No shifts found in first job"
        }
    } else {
        Log-Test "APP" "GET Shift Applications" "WARN" "No jobs found"
    }
} catch {
    Log-Test "APP" "GET Shift Applications" "FAIL" $_.Exception.Message
}

# ============================================================
# PHASE 7: MANAGEMENT - EMPLOYEES (Management :5057)
# ============================================================
Write-Host "`n=== PHASE 7: Management - Employees (Management :5057) ===`n"

# 7.1 Get employees (Trial)
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5057/api/employees" -Headers $trialHeaders
    $emps = if ($r.data) { $r.data } else { $r }
    $empCount = if ($emps -is [array]) { $emps.Count } else { 0 }
    $empNames = if ($emps -is [array]) { ($emps | ForEach-Object { $_.fullName }) -join ", " } else { "" }
    Log-Test "MGMT" "GET Employees (Trial)" "PASS" "count=$empCount, names=[$empNames]"
} catch {
    Log-Test "MGMT" "GET Employees (Trial)" "FAIL" $_.Exception.Message
}

# 7.2 Get employees (HRM)
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5057/api/employees" -Headers $hrmHeaders
    $emps = if ($r.data) { $r.data } else { $r }
    $empCount = if ($emps -is [array]) { $emps.Count } else { 0 }
    Log-Test "MGMT" "GET Employees (HRM)" "PASS" "count=$empCount"
} catch {
    Log-Test "MGMT" "GET Employees (HRM)" "FAIL" $_.Exception.Message
}

# ============================================================
# PHASE 8: MANAGEMENT - SCHEDULES (Management :5057)
# ============================================================
Write-Host "`n=== PHASE 8: Management - Schedules ===`n"

# 8.1 Get all schedules for business (Trial)
try {
    $today = Get-Date -Format "yyyy-MM-dd"
    $r = Invoke-RestMethod -Uri "http://localhost:5057/api/schedules?date=$today" -Headers $trialHeaders
    $scheds = if ($r.data) { $r.data } else { $r }
    $schedCount = if ($scheds -is [array]) { $scheds.Count } else { 0 }
    Log-Test "MGMT" "GET Schedules (Trial, date=$today)" "PASS" "count=$schedCount"
} catch {
    Log-Test "MGMT" "GET Schedules (Trial)" "FAIL" $_.Exception.Message
}

# 8.2 Get my schedules (Student)
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5057/api/schedules/my-schedules" -Headers $studentHeaders
    $myScheds = if ($r.data) { $r.data } else { $r }
    $mySchedCount = if ($myScheds -is [array]) { $myScheds.Count } else { 0 }
    Log-Test "MGMT" "GET My Schedules (Student)" "PASS" "count=$mySchedCount"
} catch {
    Log-Test "MGMT" "GET My Schedules (Student)" "FAIL" $_.Exception.Message
}

# ============================================================
# PHASE 9: MANAGEMENT - TIMEKEEPING (Management :5057)
# ============================================================
Write-Host "`n=== PHASE 9: Management - Timekeeping ===`n"

# 9.1 Get timekeeping logs (Trial)
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5057/api/timekeeping" -Headers $trialHeaders
    $tks = if ($r.data) { $r.data } else { $r }
    $tkCount = if ($tks -is [array]) { $tks.Count } else { 0 }
    Log-Test "MGMT" "GET Timekeeping Logs (Trial)" "PASS" "count=$tkCount"
} catch {
    Log-Test "MGMT" "GET Timekeeping Logs (Trial)" "FAIL" $_.Exception.Message
}

# 9.2 Get suspicious timekeeping
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5057/api/timekeeping/suspicious" -Headers $trialHeaders
    $sus = if ($r.data) { $r.data } else { $r }
    $susCount = if ($sus -is [array]) { $sus.Count } else { 0 }
    Log-Test "MGMT" "GET Suspicious Timekeeping (Trial)" "PASS" "count=$susCount"
} catch {
    Log-Test "MGMT" "GET Suspicious Timekeeping (Trial)" "FAIL" $_.Exception.Message
}

# 9.3 Check-in with invalid QR token
try {
    $body = '{"latitude":10.858689,"longitude":106.800238,"qrToken":"invalid-token-12345"}'
    $r = Invoke-RestMethod -Uri "http://localhost:5057/api/timekeeping/check-in" -Method POST -ContentType "application/json" -Body $body -Headers $studentHeaders
    Log-Test "MGMT" "Check-in Invalid QR" "FAIL" "Expected error, got success"
} catch {
    Log-Test "MGMT" "Check-in Invalid QR" "PASS" "Correctly rejected: $($_.Exception.Message)"
}

# ============================================================
# PHASE 10: MANAGEMENT - PAYROLLS (Management :5057)
# ============================================================
Write-Host "`n=== PHASE 10: Management - Payrolls ===`n"

# 10.1 Get payrolls (business)
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5057/api/payrolls" -Headers $trialHeaders
    $pays = if ($r.data) { $r.data } else { $r }
    $payCount = if ($pays -is [array]) { $pays.Count } else { 0 }
    Log-Test "MGMT" "GET Payrolls (Trial Business)" "PASS" "count=$payCount"
} catch {
    Log-Test "MGMT" "GET Payrolls (Trial Business)" "FAIL" $_.Exception.Message
}

# 10.2 Get payrolls analytics
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5057/api/payrolls/analytics" -Headers $trialHeaders
    $ana = if ($r.data) { $r.data } else { $r }
    Log-Test "MGMT" "GET Payrolls Analytics (Trial)" "PASS" "response=$(Safe-Json $ana)"
} catch {
    Log-Test "MGMT" "GET Payrolls Analytics (Trial)" "FAIL" $_.Exception.Message
}

# 10.3 Get student payrolls
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5057/api/payrolls/student" -Headers $studentHeaders
    $sPays = if ($r.data) { $r.data } else { $r }
    $sPayCount = if ($sPays -is [array]) { $sPays.Count } else { 0 }
    Log-Test "MGMT" "GET Payrolls (Student)" "PASS" "count=$sPayCount"
} catch {
    Log-Test "MGMT" "GET Payrolls (Student)" "FAIL" $_.Exception.Message
}

# ============================================================
# PHASE 11: MANAGEMENT - QR CODES (Management :5057)
# ============================================================
Write-Host "`n=== PHASE 11: Management - QR Codes ===`n"

# 11.1 Generate QR code
try {
    $body = '{"latitude":10.858689,"longitude":106.800238}'
    $r = Invoke-RestMethod -Uri "http://localhost:5057/api/qr-code/generate" -Method POST -ContentType "application/json" -Body $body -Headers $trialHeaders
    $qr = if ($r.data) { $r.data } else { $r }
    Log-Test "QR" "Generate QR Token (Trial)" "PASS" "token=$($qr.token), expiresAt=$($qr.expiresAt)"
} catch {
    Log-Test "QR" "Generate QR Token (Trial)" "FAIL" $_.Exception.Message
}

# 11.2 Get current QR settings
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5057/api/qr-code" -Headers $trialHeaders
    $qrSettings = if ($r.data) { $r.data } else { $r }
    Log-Test "QR" "GET QR Settings (Trial)" "PASS" "response=$(Safe-Json $qrSettings)"
} catch {
    Log-Test "QR" "GET QR Settings (Trial)" "FAIL" $_.Exception.Message
}

# ============================================================
# PHASE 12: CHAT / MESSAGES (Identity :5231)
# ============================================================
Write-Host "`n=== PHASE 12: Chat / Messages ===`n"

# 12.1 Get conversations (student)
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/messages/conversations" -Headers $studentHeaders
    $convos = if ($r.data) { $r.data } else { $r }
    $convoCount = if ($convos -is [array]) { $convos.Count } else { 0 }
    Log-Test "CHAT" "GET Conversations (Student)" "PASS" "count=$convoCount"
} catch {
    Log-Test "CHAT" "GET Conversations (Student)" "FAIL" $_.Exception.Message
}

# 12.2 Get conversations (employer)
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/messages/conversations" -Headers $trialHeaders
    $convos = if ($r.data) { $r.data } else { $r }
    $convoCount = if ($convos -is [array]) { $convos.Count } else { 0 }
    Log-Test "CHAT" "GET Conversations (Trial Employer)" "PASS" "count=$convoCount"
} catch {
    Log-Test "CHAT" "GET Conversations (Trial Employer)" "FAIL" $_.Exception.Message
}

# ============================================================
# PHASE 13: PUBLIC APIs (No Auth)
# ============================================================
Write-Host "`n=== PHASE 13: Public APIs ===`n"

# 13.1 Public student CV
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/public/students/16/cv"
    $cv = if ($r.data) { $r.data } else { $r }
    Log-Test "PUBLIC" "GET Student CV (id=16)" "PASS" "fullName=$($cv.fullName), bio=$($cv.bio), skills=$($cv.skills)"
} catch {
    Log-Test "PUBLIC" "GET Student CV (id=16)" "FAIL" $_.Exception.Message
}

# 13.2 Non-existent student CV
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/public/students/99999/cv"
    Log-Test "PUBLIC" "GET Non-existent Student CV (id=99999)" "WARN" "Got 200 (may be empty response)"
} catch {
    if ($_.Exception.Message -match "404") {
        Log-Test "PUBLIC" "GET Non-existent Student CV" "PASS" "Correctly returned 404"
    } else {
        Log-Test "PUBLIC" "GET Non-existent Student CV" "WARN" $_.Exception.Message
    }
}

# 13.3 Admin payments (no auth - should fail)
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/admin/payments/pending"
    Log-Test "PUBLIC" "Admin Payments NO AUTH" "FAIL" "Expected 401"
} catch {
    if ($_.Exception.Message -match "401|403") {
        Log-Test "PUBLIC" "Admin Payments NO AUTH" "PASS" "Correctly denied: $($_.Exception.Message)"
    } else {
        Log-Test "PUBLIC" "Admin Payments NO AUTH" "WARN" $_.Exception.Message
    }
}

# 13.4 Health checks
try {
    $r = Invoke-WebRequest -Uri "http://localhost:5231/" -UseBasicParsing
    Log-Test "PUBLIC" "Identity Service Health" "PASS" "status=$($r.StatusCode)"
} catch {
    Log-Test "PUBLIC" "Identity Service Health" "WARN" $_.Exception.Message
}

try {
    $r = Invoke-WebRequest -Uri "http://localhost:5021/" -UseBasicParsing
    Log-Test "PUBLIC" "Job Service Health" "PASS" "status=$($r.StatusCode)"
} catch {
    Log-Test "PUBLIC" "Job Service Health" "WARN" $_.Exception.Message
}

try {
    $r = Invoke-WebRequest -Uri "http://localhost:5057/" -UseBasicParsing
    Log-Test "PUBLIC" "Management Service Health" "PASS" "status=$($r.StatusCode)"
} catch {
    Log-Test "PUBLIC" "Management Service Health" "WARN" $_.Exception.Message
}

# ============================================================
# PHASE 14: SECURITY EDGE CASES
# ============================================================
Write-Host "`n=== PHASE 14: Security Edge Cases ===`n"

# 14.1 Fake JWT token
try {
    $fakeH = @{Authorization="Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5OTkifQ.fakesignature"}
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/student/profile" -Headers $fakeH
    Log-Test "SECURITY" "Fake JWT Token" "FAIL" "Expected 401"
} catch {
    if ($_.Exception.Message -match "401") {
        Log-Test "SECURITY" "Fake JWT Token" "PASS" "Correctly rejected"
    } else {
        Log-Test "SECURITY" "Fake JWT Token" "WARN" $_.Exception.Message
    }
}

# 14.2 SQL Injection in login email
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin'' OR 1=1--","password":"test"}'
    Log-Test "SECURITY" "SQL Injection Login" "FAIL" "Expected rejection"
} catch {
    Log-Test "SECURITY" "SQL Injection Login" "PASS" "Correctly rejected"
}

# 14.3 Student token accessing employer endpoints
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5057/api/employees" -Headers $studentHeaders
    $emps = if ($r.data) { $r.data } else { $r }
    $empCount = if ($emps -is [array]) { $emps.Count } else { 0 }
    if ($empCount -eq 0) {
        Log-Test "SECURITY" "Student Access Employees" "PASS" "Returns empty (no business profile for student)"
    } else {
        Log-Test "SECURITY" "Student Access Employees" "WARN" "Student got $empCount employees (review role-gating)"
    }
} catch {
    if ($_.Exception.Message -match "401|403") {
        Log-Test "SECURITY" "Student Access Employees" "PASS" "Correctly denied"
    } else {
        Log-Test "SECURITY" "Student Access Employees" "WARN" $_.Exception.Message
    }
}

# 14.4 Employer accessing student profile
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/student/profile" -Headers $trialHeaders
    Log-Test "SECURITY" "Employer Access Student Profile" "WARN" "Returned 200 (review role-gating)"
} catch {
    if ($_.Exception.Message -match "401|403") {
        Log-Test "SECURITY" "Employer Access Student Profile" "PASS" "Correctly denied"
    } else {
        Log-Test "SECURITY" "Employer Access Student Profile" "WARN" $_.Exception.Message
    }
}

# ============================================================
# PHASE 15: ADMIN APIs (Identity :5231) - using student token (should fail)
# ============================================================
Write-Host "`n=== PHASE 15: Admin API Access Control ===`n"

# 15.1 Student trying admin endpoint
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/admin/payments/pending" -Headers $studentHeaders
    Log-Test "ADMIN" "Student Access Admin Payments" "FAIL" "Expected 403, student should not access admin"
} catch {
    if ($_.Exception.Message -match "403|401") {
        Log-Test "ADMIN" "Student Access Admin Payments" "PASS" "Correctly denied"
    } else {
        Log-Test "ADMIN" "Student Access Admin Payments" "WARN" $_.Exception.Message
    }
}

# 15.2 Employer trying admin endpoint
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5231/api/admin/payments/pending" -Headers $trialHeaders
    Log-Test "ADMIN" "Employer Access Admin Payments" "FAIL" "Expected 403, employer should not access admin"
} catch {
    if ($_.Exception.Message -match "403|401") {
        Log-Test "ADMIN" "Employer Access Admin Payments" "PASS" "Correctly denied"
    } else {
        Log-Test "ADMIN" "Employer Access Admin Payments" "WARN" $_.Exception.Message
    }
}

# ============================================================
# SUMMARY
# ============================================================
Write-Host "`n`n================================================================"
Write-Host "  TEST SUMMARY"
Write-Host "================================================================`n"

$passCount = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$warnCount = ($results | Where-Object { $_.Status -eq "WARN" }).Count

Write-Host "TOTAL: $($results.Count) tests"
Write-Host "  PASS: $passCount"
Write-Host "  FAIL: $failCount"
Write-Host "  WARN: $warnCount"
Write-Host ""

if ($failCount -gt 0) {
    Write-Host "FAILED TESTS:"
    $results | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object { Write-Host "  [FAIL] [$($_.No)] $($_.Category) - $($_.Name): $($_.Detail)" }
}

if ($warnCount -gt 0) {
    Write-Host "`nWARNING TESTS:"
    $results | Where-Object { $_.Status -eq "WARN" } | ForEach-Object { Write-Host "  [WARN] [$($_.No)] $($_.Category) - $($_.Name): $($_.Detail)" }
}

Write-Host "`n================================================================"
Write-Host "  Test completed at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "================================================================`n"

# Export results
$results | ConvertTo-Json -Depth 5 | Out-File -FilePath "d:\ProxiJob\docs\test_results_raw_v2.json" -Encoding UTF8
Write-Host "Raw results saved to d:\ProxiJob\docs\test_results_raw_v2.json"
