# PTL Manufacturing System - User Manual

## Table of Contents
1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Manager Functions](#manager-functions)
5. [Technician Functions](#technician-functions)
6. [Customer Functions](#customer-functions)
7. [Navigation Guide](#navigation-guide)
8. [Troubleshooting](#troubleshooting)

---

## System Overview

The PTL Manufacturing System is a comprehensive solution for managing electronic board testing and quality control in manufacturing environments. The system handles the complete workflow from hardware orders to final testing verification.

**Key Features:**
- Hardware order management
- PTL (Pick and Test Line) order creation and tracking
- Real-time board scanning and testing
- Quality control and repair logging
- User management with role-based access
- Real-time analytics and reporting

**Visual Needed:** Screenshot of the main dashboard showing the overall system interface

---

## Getting Started

### Logging In

1. Navigate to the login page
2. Enter your username and password
3. Click the **"Sign In"** button
4. You'll be redirected to your role-specific dashboard

**Visual Needed:** Screenshot of the login page

### Dashboard Overview

Upon login, you'll see your personalized dashboard with:
- **Statistics cards** showing key metrics for your role
- **Quick action buttons** for common tasks
- **Recent activity feed** (for managers)
- **Navigation sidebar** for accessing different modules

**Visual Needed:** Screenshots of manager and technician dashboards side-by-side

---

## User Roles & Permissions

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

**Visual Needed:** Diagram showing role hierarchy and permissions

---

## Manager Functions

### Hardware Orders Management

**Accessing Hardware Orders:**
1. Click **"Hardware Orders"** in the sidebar
2. View list of all hardware orders with status indicators

**Creating New Hardware Orders:**
1. Click the **"New Hardware Order"** button
2. Fill in required fields:
   - **PO Number:** Purchase order identifier
   - **Assembly Number:** Product assembly code
   - **Quantity:** Number of units
   - **Starting Sequence:** First sequence number
   - **Ending Sequence:** Last sequence number
   - **Notes:** Optional additional information
3. Click **"Create Order"** to save

**Managing Existing Orders:**
- **Edit:** Click the edit icon to modify order details
- **Delete:** Click the delete icon to remove orders (confirmation required)
- **View Details:** Click on any order to see complete information

**Visual Needed:** Screenshots of hardware orders list, new order form, and order details page

### PTL Orders Management

**Creating PTL Orders from Hardware Orders:**
1. Navigate to a hardware order details page
2. Click **"Create PTL Order"** button
3. Configure test parameters:
   - **PTL Order Number:** Unique identifier
   - **Board Type:** Type of board being tested
   - **Quantity:** Number of boards to test
   - **Test Parameters:** Scanning configuration
   - **Sale Code, Firmware Revision, Date Code:** Product specifications
4. Click **"Create PTL Order"**

**Monitoring PTL Progress:**
- View real-time progress bars showing completion percentage
- Monitor pass/fail rates
- Track testing time statistics
- See assigned technicians

**Visual Needed:** Screenshots of PTL order creation form, PTL orders list, and progress tracking interface

### User Account Management

**Accessing User Management:**
1. Click **"Account Management"** in the sidebar
2. View list of all system users

**Creating New Users:**
1. Click **"Add User"** button
2. Enter user details:
   - **Username:** Login identifier
   - **Password:** Initial password
   - **Full Name:** User's display name
   - **Role:** Manager, Technician, or Customer
   - **CW Stamp:** (Optional) Technician identifier
3. Click **"Create User"**

**Managing Existing Users:**
- **Toggle Active Status:** Enable/disable user accounts
- **Edit Details:** Modify user information
- **Reset Password:** Change user passwords
- **Delete Users:** Remove accounts (with confirmation)

**Visual Needed:** Screenshots of user management interface, add user form, and user edit dialog

### Analytics and Reporting

**Dashboard Metrics:**
- **Hardware Orders:** Total count and status breakdown
- **PTL Orders:** Active and completed counts
- **Technician Count:** Number of active technicians
- **Success Rate:** Overall pass percentage
- **Testing Statistics:** Detailed breakdown of passed, failed, and repaired boards
- **Average Test Time:** Performance metrics
- **Recent Activity:** Live feed of system events

**Order Archives:**
- Access historical data for completed orders
- Generate reports on testing performance
- Review past repair activities

**Visual Needed:** Screenshots of manager dashboard with all metrics, and archive pages

---

## Technician Functions

### Dashboard Overview

**Quick Statistics:**
- **Today's Tests:** Number of boards scanned today
- **Success Rate:** Your personal pass percentage
- **Average Test Time:** Your testing efficiency
- **PTL Orders Done:** Completed assignments

**Quick Actions Panel:**
- **CW PTL:** Start new scanning session
- **Repair Log:** Access repair activities
- **Scan History:** Review past sessions

**Visual Needed:** Screenshot of technician dashboard with highlighted quick actions

### Board Scanning (CW PTL)

**Starting a Scanning Session:**
1. Click **"CW PTL"** from dashboard or sidebar
2. Select a PTL order from available assignments
3. Configure tester settings:
   - **Tester Type:** Select appropriate testing equipment
   - **Scan Boxes:** Number of scanning positions
4. Click **"Start Session"**

**Pre-Test Verification:**
- Review PTL order details
- Confirm test parameters
- Check equipment readiness
- Click **"Begin Testing"** when ready

**Scanning Interface:**
- **QR Code Scanner:** Point camera at board QR code
- **Manual Entry:** Type QR code if scanning fails
- **Board Information Display:** Shows board details and test status
- **Progress Tracking:** Real-time session statistics

**During Testing:**
- **Pause/Resume:** Control session flow
- **Break Mode:** Log break times
- **Pass/Fail Recording:** Mark test results
- **Notes:** Add comments for failed boards

**Session Controls:**
- **Pause Session:** Temporarily stop testing
- **Resume Session:** Continue after pause
- **Take Break:** Log break time
- **End Session:** Complete and finalize testing

**Visual Needed:** Screenshots of PTL order selection, scanning interface, session controls, and real-time progress display

### Repair Log Management

**Accessing Repair Log:**
1. Click **"Repair Log"** from dashboard or sidebar
2. View assigned repair tasks

**Logging Repair Activities:**
1. Select a failed board from the list
2. Enter repair details:
   - **Failure Reason:** Description of issue
   - **Repair Actions:** Work performed
   - **Completion Status:** Update progress
   - **Retest Results:** Pass/fail after repair
3. Save repair log entry

**Visual Needed:** Screenshots of repair log interface and repair entry form

### Scan History Review

**Viewing Past Sessions:**
1. Click **"Scan History"** from dashboard or sidebar
2. Browse chronological list of completed sessions
3. Filter by date, PTL order, or status

**Session Details:**
- View detailed statistics for each session
- See boards scanned and results
- Review session timing and efficiency
- Access notes and comments

**Visual Needed:** Screenshots of scan history list and detailed session view

---

## Customer Functions

### Board Lookup

**Accessing Board Information:**
1. Navigate to **"Board Lookup"** page
2. Enter board QR code in search field
3. Click **"Search"** or press Enter

**Information Displayed:**
- **Board Details:** Type, assembly number, sequence
- **Test Status:** Pass/fail/pending status
- **Test Date:** When testing was performed
- **PTL Order Information:** Associated order details
- **Quality Metrics:** Test results and specifications

**Visual Needed:** Screenshots of board lookup interface and results display

---

## Navigation Guide

### Sidebar Navigation

**Main Menu Items:**
- **Dashboard:** Return to main overview
- **Hardware Orders:** Manage production orders (Manager only)
- **PTL Orders:** View and manage testing orders
- **Scan Validator/CW PTL:** Access testing interface (Technician)
- **Repair Log:** Manage repair activities (Technician)
- **Scan History:** Review past sessions (Technician)
- **Account Management:** Manage users (Manager only)
- **Board Lookup:** Search board information (Customer)

**User Menu (Top Right):**
- **Profile Information:** Current user and role
- **Logout:** Sign out of system

**Visual Needed:** Screenshots of sidebar navigation for different user roles

### Status Indicators and Colors

**Order Status Colors:**
- **Green:** Completed/Passed
- **Yellow:** In Progress/Pending
- **Red:** Failed/Error
- **Blue:** Active/Running

**Button Types:**
- **Primary (Blue):** Main actions (Create, Save, Start)
- **Secondary (Gray):** Secondary actions (Cancel, Back)
- **Destructive (Red):** Delete or dangerous actions
- **Success (Green):** Confirmation actions

**Visual Needed:** Color guide showing all status indicators and button types

---

## Troubleshooting

### Common Issues

**Login Problems:**
- Verify username and password spelling
- Check if account is active (contact manager)
- Clear browser cache and cookies
- Try different browser or incognito mode

**Scanning Issues:**
- Ensure camera permissions are enabled
- Clean QR code surface
- Adjust lighting conditions
- Use manual entry as backup
- Check tester equipment connections

**Performance Issues:**
- Refresh the page
- Check internet connection
- Clear browser cache
- Contact system administrator

**Data Not Updating:**
- Page refreshes automatically every 30 seconds
- Manual refresh with browser refresh button
- Check real-time connection status
- Verify user permissions for data access

### Getting Help

**For Technical Issues:**
- Contact your system administrator
- Check system status indicators
- Review error messages carefully
- Document steps that led to the problem

**For Training:**
- Refer to this user manual
- Ask experienced colleagues
- Contact management for additional training
- Practice with test data when available

**Visual Needed:** Screenshots of common error messages and help interfaces

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

**Visual Needed:** Printable quick reference card design

---

*This manual covers all major system functions. For additional support or feature requests, contact your system administrator.*