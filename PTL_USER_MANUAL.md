# PTL Manufacturing System - User Manual

![System Logo](images/logo.png)
*Add your company logo here*

## Table of Contents
- [System Overview](#system-overview)
- [Getting Started](#getting-started)
- [User Roles & Permissions](#user-roles--permissions)
- [Manager Functions](#manager-functions)
- [Technician Functions](#technician-functions)
- [Customer Functions](#customer-functions)
- [Navigation Guide](#navigation-guide)
- [Troubleshooting](#troubleshooting)

---

## System Overview

The PTL Manufacturing System is a comprehensive solution for managing electronic board testing and quality control in manufacturing environments. The system handles the complete workflow from hardware orders to final testing verification.

### Key Features:
- Hardware order management
- PTL (Pick and Test Line) order creation and tracking
- Real-time board scanning and testing
- Quality control and repair logging
- User management with role-based access
- Real-time analytics and reporting

![Main Dashboard Overview](images/main-dashboard.png)
*Screenshot Instructions: Capture the main dashboard showing the overall system interface*

---

## Getting Started

### Logging In

1. Navigate to the login page
2. Enter your username and password
3. Click the **"Sign In"** button
4. You'll be redirected to your role-specific dashboard

![Login Page](images/login-page.png)
*Screenshot Instructions: Capture the login page at `/login`*

### Dashboard Overview

Upon login, you'll see your personalized dashboard with:
- **Statistics cards** showing key metrics for your role
- **Quick action buttons** for common tasks
- **Recent activity feed** (for managers)
- **Navigation sidebar** for accessing different modules

![Manager Dashboard](images/manager-dashboard.png)
*Screenshot Instructions: Login as a manager and capture the full dashboard at `/app/dashboard`*

![Technician Dashboard](images/technician-dashboard.png)
*Screenshot Instructions: Login as a technician and capture the full dashboard at `/app/dashboard`*

---

## User Roles & Permissions

### Role Hierarchy

![User Roles Diagram](images/user-roles-diagram.png)
*Create a diagram showing: Manager (top) → Technician → Customer with permission levels*

| Role | Hardware Orders | PTL Orders | Scanning | User Management | Repairs |
|------|----------------|------------|----------|-----------------|---------|
| Manager | ✅ Full Access | ✅ Full Access | ❌ View Only | ✅ Full Access | ✅ View All |
| Technician | ❌ No Access | ✅ View Assigned | ✅ Full Access | ❌ No Access | ✅ Log Own |
| Customer | ❌ No Access | ❌ No Access | ❌ No Access | ❌ No Access | ❌ No Access |

### Manager Role
- Full system access
- Create and manage hardware orders
- Create and manage PTL orders
- View all testing data and analytics
- Manage user accounts
- Access repair logs and archives

### Technician Role
- Access scanning interface for testing boards
- Log repair activities
- View scan history
- Access assigned PTL orders

### Customer Role
- Look up board information using QR codes
- View testing status and results
- Read-only access to relevant data

---

## Manager Functions

### Hardware Orders Management

![Hardware Orders List](images/hardware-orders-list.png)
*Screenshot Instructions: Navigate to `/app/hardware-orders` as a manager*

#### Accessing Hardware Orders:
1. Click **"Hardware Orders"** in the sidebar
2. View list of all hardware orders with status indicators

#### Creating New Hardware Orders:

![New Hardware Order Form](images/new-hardware-order.png)
*Screenshot Instructions: Click "New Hardware Order" button and capture the form*

1. Click the **"New Hardware Order"** button
2. Fill in required fields:
   - **PO Number:** Purchase order identifier
   - **Assembly Number:** Product assembly code
   - **Quantity:** Number of units
   - **Starting Sequence:** First sequence number
   - **Ending Sequence:** Last sequence number
   - **Notes:** Optional additional information
3. Click **"Create Order"** to save

#### Managing Existing Orders:

![Hardware Order Details](images/hardware-order-details.png)
*Screenshot Instructions: Click on any hardware order to view details page*

- **Edit:** Click the edit icon to modify order details
- **Delete:** Click the delete icon to remove orders (confirmation required)
- **View Details:** Click on any order to see complete information

### PTL Orders Management

![PTL Orders Interface](images/ptl-orders-interface.png)
*Screenshot Instructions: Navigate to `/app/ptl-orders` as a manager*

#### Creating PTL Orders from Hardware Orders:

![Create PTL Order Form](images/create-ptl-order.png)
*Screenshot Instructions: From hardware order details, click "Create PTL Order"*

1. Navigate to a hardware order details page
2. Click **"Create PTL Order"** button
3. Configure test parameters:
   - **PTL Order Number:** Unique identifier
   - **Board Type:** Type of board being tested
   - **Quantity:** Number of boards to test
   - **Test Parameters:** Scanning configuration
   - **Sale Code, Firmware Revision, Date Code:** Product specifications
4. Click **"Create PTL Order"**

#### Monitoring PTL Progress:

![PTL Progress Tracking](images/ptl-progress.png)
*Screenshot Instructions: Capture PTL orders page showing progress bars and statistics*

- View real-time progress bars showing completion percentage
- Monitor pass/fail rates
- Track testing time statistics
- See assigned technicians

### User Account Management

![User Management Interface](images/user-management.png)
*Screenshot Instructions: Navigate to `/app/account-management` as a manager*

#### Accessing User Management:
1. Click **"Account Management"** in the sidebar
2. View list of all system users

#### Creating New Users:

![Add User Form](images/add-user-form.png)
*Screenshot Instructions: Click "Add User" button and capture the form*

1. Click **"Add User"** button
2. Enter user details:
   - **Username:** Login identifier
   - **Password:** Initial password
   - **Full Name:** User's display name
   - **Role:** Manager, Technician, or Customer
   - **CW Stamp:** (Optional) Technician identifier
3. Click **"Create User"**

#### Managing Existing Users:

![User Edit Dialog](images/user-edit-dialog.png)
*Screenshot Instructions: Click edit on any user to show the edit dialog*

- **Toggle Active Status:** Enable/disable user accounts
- **Edit Details:** Modify user information
- **Reset Password:** Change user passwords
- **Delete Users:** Remove accounts (with confirmation)

### Analytics and Reporting

![Manager Analytics Dashboard](images/manager-analytics.png)
*Screenshot Instructions: Capture the full manager dashboard showing all statistics cards*

#### Dashboard Metrics:
- **Hardware Orders:** Total count and status breakdown
- **PTL Orders:** Active and completed counts
- **Technician Count:** Number of active technicians
- **Success Rate:** Overall pass percentage
- **Testing Statistics:** Detailed breakdown of passed, failed, and repaired boards
- **Average Test Time:** Performance metrics
- **Recent Activity:** Live feed of system events

![Order Archives](images/order-archives.png)
*Screenshot Instructions: Navigate to any archive page (hardware or PTL order archives)*

#### Order Archives:
- Access historical data for completed orders
- Generate reports on testing performance
- Review past repair activities

---

## Technician Functions

### Dashboard Overview

![Technician Dashboard Detail](images/technician-dashboard-detail.png)
*Screenshot Instructions: Login as technician, capture dashboard with Quick Actions highlighted*

#### Quick Statistics:
- **Today's Tests:** Number of boards scanned today
- **Success Rate:** Your personal pass percentage
- **Average Test Time:** Your testing efficiency
- **PTL Orders Done:** Completed assignments

#### Quick Actions Panel:
- **CW PTL:** Start new scanning session
- **Repair Log:** Access repair activities
- **Scan History:** Review past sessions

### Board Scanning (CW PTL)

![PTL Order Selection](images/ptl-order-selection.png)
*Screenshot Instructions: Navigate to `/app/scan-validator` as technician, capture order selection*

#### Starting a Scanning Session:
1. Click **"CW PTL"** from dashboard or sidebar
2. Select a PTL order from available assignments
3. Configure tester settings:
   - **Tester Type:** Select appropriate testing equipment
   - **Scan Boxes:** Number of scanning positions
4. Click **"Start Session"**

![Pre-Test Verification](images/pre-test-verification.png)
*Screenshot Instructions: Capture the pre-test verification screen*

#### Pre-Test Verification:
- Review PTL order details
- Confirm test parameters
- Check equipment readiness
- Click **"Begin Testing"** when ready

![Scanning Interface](images/scanning-interface.png)
*Screenshot Instructions: Capture the main scanning interface with camera view*

#### Scanning Interface:
- **QR Code Scanner:** Point camera at board QR code
- **Manual Entry:** Type QR code if scanning fails
- **Board Information Display:** Shows board details and test status
- **Progress Tracking:** Real-time session statistics

![Session Controls](images/session-controls.png)
*Screenshot Instructions: Capture the session control buttons during an active session*

#### During Testing:
- **Pause/Resume:** Control session flow
- **Break Mode:** Log break times
- **Pass/Fail Recording:** Mark test results
- **Notes:** Add comments for failed boards

#### Session Controls:
- **Pause Session:** Temporarily stop testing
- **Resume Session:** Continue after pause
- **Take Break:** Log break time
- **End Session:** Complete and finalize testing

![Real-time Progress](images/realtime-progress.png)
*Screenshot Instructions: Capture the progress tracking display during scanning*

### Repair Log Management

![Repair Log Interface](images/repair-log.png)
*Screenshot Instructions: Navigate to `/app/repair-log` as technician*

#### Accessing Repair Log:
1. Click **"Repair Log"** from dashboard or sidebar
2. View assigned repair tasks

![Repair Entry Form](images/repair-entry-form.png)
*Screenshot Instructions: Click on a repair task to show the repair entry form*

#### Logging Repair Activities:
1. Select a failed board from the list
2. Enter repair details:
   - **Failure Reason:** Description of issue
   - **Repair Actions:** Work performed
   - **Completion Status:** Update progress
   - **Retest Results:** Pass/fail after repair
3. Save repair log entry

### Scan History Review

![Scan History List](images/scan-history.png)
*Screenshot Instructions: Navigate to `/app/scan-history` as technician*

#### Viewing Past Sessions:
1. Click **"Scan History"** from dashboard or sidebar
2. Browse chronological list of completed sessions
3. Filter by date, PTL order, or status

![Session Details View](images/session-details.png)
*Screenshot Instructions: Click on any session to view detailed information*

#### Session Details:
- View detailed statistics for each session
- See boards scanned and results
- Review session timing and efficiency
- Access notes and comments

---

## Customer Functions

### Board Lookup

![Board Lookup Interface](images/board-lookup.png)
*Screenshot Instructions: Navigate to `/app/board-lookup` as customer*

#### Accessing Board Information:
1. Navigate to **"Board Lookup"** page
2. Enter board QR code in search field
3. Click **"Search"** or press Enter

![Board Lookup Results](images/board-lookup-results.png)
*Screenshot Instructions: Enter a valid QR code and capture the results display*

#### Information Displayed:
- **Board Details:** Type, assembly number, sequence
- **Test Status:** Pass/fail/pending status
- **Test Date:** When testing was performed
- **PTL Order Information:** Associated order details
- **Quality Metrics:** Test results and specifications

---

## Navigation Guide

### Sidebar Navigation

![Manager Sidebar](images/manager-sidebar.png)
*Screenshot Instructions: Capture the sidebar navigation when logged in as manager*

![Technician Sidebar](images/technician-sidebar.png)
*Screenshot Instructions: Capture the sidebar navigation when logged in as technician*

![Customer Sidebar](images/customer-sidebar.png)
*Screenshot Instructions: Capture the sidebar navigation when logged in as customer*

#### Main Menu Items:
- **Dashboard:** Return to main overview
- **Hardware Orders:** Manage production orders (Manager only)
- **PTL Orders:** View and manage testing orders
- **Scan Validator/CW PTL:** Access testing interface (Technician)
- **Repair Log:** Manage repair activities (Technician)
- **Scan History:** Review past sessions (Technician)
- **Account Management:** Manage users (Manager only)
- **Board Lookup:** Search board information (Customer)

![User Menu](images/user-menu.png)
*Screenshot Instructions: Click on the user profile area in top right to show dropdown*

#### User Menu (Top Right):
- **Profile Information:** Current user and role
- **Logout:** Sign out of system

### Status Indicators and Colors

![Status Colors Guide](images/status-colors.png)
*Create a color guide showing all status indicators:*
- 🟢 **Green:** Completed/Passed
- 🟡 **Yellow:** In Progress/Pending  
- 🔴 **Red:** Failed/Error
- 🔵 **Blue:** Active/Running

![Button Types Guide](images/button-types.png)
*Create a guide showing different button styles:*
- **Primary (Blue):** Main actions (Create, Save, Start)
- **Secondary (Gray):** Secondary actions (Cancel, Back)
- **Destructive (Red):** Delete or dangerous actions
- **Success (Green):** Confirmation actions

---

## Troubleshooting

### Common Issues

![Error Message Examples](images/error-messages.png)
*Screenshot Instructions: Capture examples of common error messages*

#### Login Problems:
- Verify username and password spelling
- Check if account is active (contact manager)
- Clear browser cache and cookies
- Try different browser or incognito mode

#### Scanning Issues:
- Ensure camera permissions are enabled
- Clean QR code surface
- Adjust lighting conditions
- Use manual entry as backup
- Check tester equipment connections

#### Performance Issues:
- Refresh the page
- Check internet connection
- Clear browser cache
- Contact system administrator

#### Data Not Updating:
- Page refreshes automatically every 30 seconds
- Manual refresh with browser refresh button
- Check real-time connection status
- Verify user permissions for data access

### Getting Help

![Help Interface](images/help-interface.png)
*Screenshot Instructions: Capture any help or support interface if available*

#### For Technical Issues:
- Contact your system administrator
- Check system status indicators
- Review error messages carefully
- Document steps that led to the problem

#### For Training:
- Refer to this user manual
- Ask experienced colleagues
- Contact management for additional training
- Practice with test data when available

---

## Quick Reference Cards

### Manager Quick Actions
- **Ctrl+N:** New hardware order
- **Ctrl+P:** New PTL order
- **Ctrl+U:** User management
- **Ctrl+D:** Dashboard

### Technician Quick Actions
- **Ctrl+S:** Start scanning session
- **Ctrl+R:** Repair log
- **Ctrl+H:** Scan history
- **Space:** Pause/resume session (when scanning)

### Universal Shortcuts
- **Ctrl+Home:** Return to dashboard
- **Ctrl+L:** Logout
- **F5:** Refresh page
- **Esc:** Cancel current action

![Quick Reference Card](images/quick-reference-card.png)
*Create a printable quick reference card design with all shortcuts*

---

## Installation Instructions for Images

To complete this manual, create an `images/` folder and add screenshots according to the instructions provided with each image placeholder. Here's the complete list:

### Required Screenshots:
1. `logo.png` - Company logo
2. `main-dashboard.png` - Overall system interface
3. `login-page.png` - Login screen
4. `manager-dashboard.png` - Manager dashboard
5. `technician-dashboard.png` - Technician dashboard
6. `hardware-orders-list.png` - Hardware orders page
7. `new-hardware-order.png` - New order form
8. `hardware-order-details.png` - Order details page
9. `ptl-orders-interface.png` - PTL orders page
10. `create-ptl-order.png` - PTL order creation form
11. `ptl-progress.png` - Progress tracking
12. `user-management.png` - User management page
13. `add-user-form.png` - Add user form
14. `user-edit-dialog.png` - Edit user dialog
15. `manager-analytics.png` - Analytics dashboard
16. `order-archives.png` - Archive pages
17. `technician-dashboard-detail.png` - Technician dashboard detail
18. `ptl-order-selection.png` - Order selection screen
19. `pre-test-verification.png` - Pre-test screen
20. `scanning-interface.png` - Main scanning interface
21. `session-controls.png` - Session control buttons
22. `realtime-progress.png` - Progress tracking
23. `repair-log.png` - Repair log interface
24. `repair-entry-form.png` - Repair entry form
25. `scan-history.png` - Scan history page
26. `session-details.png` - Session details view
27. `board-lookup.png` - Board lookup interface
28. `board-lookup-results.png` - Lookup results
29. `manager-sidebar.png` - Manager navigation
30. `technician-sidebar.png` - Technician navigation
31. `customer-sidebar.png` - Customer navigation
32. `user-menu.png` - User dropdown menu
33. `error-messages.png` - Error examples
34. `help-interface.png` - Help interface

### Required Diagrams:
1. `user-roles-diagram.png` - Role hierarchy
2. `status-colors.png` - Color guide
3. `button-types.png` - Button styles guide
4. `quick-reference-card.png` - Printable reference

---

*This manual covers all major system functions. For additional support or feature requests, contact your system administrator.*

---

### Document Information
- **Created:** [Date]
- **Version:** 1.0
- **Last Updated:** [Date]
- **Document Owner:** [Your Company Name]