# CW PTL (Circuit Works Production Test Line) - User Feature Guide

This comprehensive guide explains how to use each feature of the CW PTL system for all user roles. The system provides different functionality based on your role: Manager, Technician, or Customer.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Manager Role Features](#manager-role-features)
3. [Technician Role Features](#technician-role-features)
4. [Customer Role Features](#customer-role-features)
5. [Common Navigation](#common-navigation)

---

## Getting Started

### Login
1. Navigate to the login page
2. Enter your username and password
3. Click **Login** button
4. You will be redirected to the appropriate dashboard based on your role

### Navigation
- Use the **sidebar menu** on the left to navigate between features
- The sidebar can be collapsed by clicking the collapse icon
- Your current role is displayed in the top right corner
- Use the **logout button** in the header to sign out

---

## Manager Role Features

Managers have access to all system features for complete oversight and administration.

### 1. Dashboard
**Purpose:** Get an overview of system performance and recent activity

**Available Metrics:**
- **Hardware Orders:** Total count of hardware orders in the system
- **PTL Orders:** Total count of PTL orders
- **Technicians:** Number of active technician accounts
- **Success Rate:** Overall percentage of boards passing tests

**Testing Statistics Panel:**
- **Passed:** Number of boards that passed testing
- **Failed:** Number of boards that failed testing  
- **Repaired:** Number of boards that were repaired
- **Avg. Test Time:** Average time per board test
- **Total Tested:** Total number of boards tested

**Recent Activity Panel:**
- Shows the last 4 testing activities
- Displays time, technician name, and test results
- Updates in real-time

### 2. Hardware Orders
**Purpose:** Manage hardware orders that will be used for PTL testing

**Main Actions:**
- **New Hardware Order** button: Create a new hardware order

**Creating a Hardware Order:**
1. Click **New Hardware Order**
2. Fill in the form:
   - **PO Number:** Purchase order number (e.g., PO-2024-001)
   - **Assembly Number:** Assembly number with revision (e.g., 257411E)
   - **Quantity:** Number of boards in the order
   - **Starting Sequence:** Starting sequence number (e.g., 411E0000001)
3. The **ending sequence** is automatically calculated
4. Click **Create Order** to save

**Order Management:**
- **Search bar:** Filter orders by PO number, assembly, or sequence
- **View PTL Orders** (eye icon): See associated PTL orders for a hardware order
- **Edit** (pencil icon): Modify order details
- **Delete** (trash icon): Remove order (with confirmation)

**Order Status Indicators:**
- **Pending:** Order created but not started
- **Active:** Order is being processed
- **Completed:** Order has been finished
- **Cancelled:** Order was cancelled

### 3. PTL Orders
**Purpose:** Create and manage PTL orders linked to hardware orders

**Main Actions:**
- **New PTL Order** button: Create a new PTL order

**Creating a PTL Order:**
1. Click **New PTL Order**
2. Fill in the form:
   - **Hardware Order:** Select from dropdown of available hardware orders
   - **PTL Order Number:** Auto-generated or custom (e.g., PTL-2024-001)
   - **Board Type:** Description of the board (e.g., Main Board, Control Board)
   - **Number of Boards to Test:** Quantity to test
   - **Sale Code:** Product sale code (e.g., 1234-ABC)
   - **Firmware Revision:** Firmware version (e.g., 1.3 or 14)
   - **Date Code:** 4-digit date code (e.g., 2501)
   - **Notes:** Optional additional information
3. Click **Create Order** to save

**Order Management:**
- **Search bar:** Filter by PTL order number, board type, sale code, firmware, or date code
- **Progress tracking:** Real-time counts of scanned, passed, and failed boards
- **View Details** (eye icon): See complete order information and test results
- **Edit** (pencil icon): Modify order details
- **Delete** (trash icon): Remove order (with confirmation)

**Progress Indicators:**
- **Scanned/Passed/Failed counts:** Live tracking of test progress
- **Status badges:** Visual indication of order status
- **Completion percentage:** Progress toward completion

### 4. Order Overview
**Purpose:** Get a comprehensive view of all orders and their relationships

**Features:**
- Combined view of hardware and PTL orders
- Cross-reference between hardware orders and their PTL orders
- Overall system status and progress tracking
- Export capabilities for reporting

### 5. Account Management
**Purpose:** Create and manage user accounts for the system

**Creating New Accounts:**
1. Fill in the **Create New Account** form:
   - **First Name:** User's first name (not required for customers)
   - **Last Name:** User's last name (not required for customers)
   - **Username:** Unique login username (minimum 3 characters)
   - **Password:** Account password (minimum 6 characters)
   - **Role:** Select Manager, Technician, or Customer
   - **CW Stamp:** For technicians only, their identification stamp
2. Click **Create Account**

**Account Management Actions:**
- **Toggle Status:** Activate/deactivate accounts using the switch
- **Edit Password:** Click the edit icon to change a user's password
- **Edit CW Stamp:** Modify technician's CW stamp
- **Delete Account:** Remove account permanently (with confirmation)

**Account Information Displayed:**
- Username and full name
- Role and status (active/inactive)
- Creation date
- Current password (for internal reference)
- CW stamp (for technicians)

### 6. Log History
**Purpose:** Review system logs and audit trails

**Features:**
- View all system activities and changes
- Filter by date range, user, or action type
- Export logs for compliance and auditing
- Detailed timestamps and user attribution

### 7. Barcode Generator
**Purpose:** Generate barcodes for board identification

**Features:**
- Generate individual or batch barcodes
- Support for various barcode formats
- Print-ready output
- Integration with order sequences

### 8. PTL Order Archive
**Purpose:** View completed PTL orders

**Features:**
- Browse historical PTL orders
- Search and filter completed orders
- View final test results and statistics
- Export historical data

### 9. Hardware Order Archive
**Purpose:** View completed hardware orders

**Features:**
- Browse historical hardware orders
- Track order completion history
- View associated PTL orders
- Export historical data

---

## Technician Role Features

Technicians focus on the actual testing process and have access to testing tools and their personal performance data.

### 1. Dashboard (Technician View)
**Purpose:** Monitor personal performance and daily progress

**Personal Metrics:**
- **Today's Tests:** Number of boards tested today
- **Success Rate:** Personal pass rate percentage
- **Avg. Test Time:** Personal average time per board
- **PTL Orders Done:** Number of completed PTL orders

**Quick Actions:**
- **Start CW PTL** button: Quick access to begin testing
- **View Repair Log** button: Access repair tracking
- **Check Scan History** button: Review testing history

### 2. CW PTL (Scan Validator)
**Purpose:** Main testing interface for scanning and validating boards

**Testing Workflow:**

**Step 1: Select PTL Order**
1. View available PTL orders with progress indicators
2. Search orders by number, board type, or other criteria
3. Select an order to begin or continue testing
4. Click **Start New Session** or **Continue Session**

**Step 2: Pre-Test Verification**
1. Review PTL order requirements displayed on screen
2. Complete verification checklist:
   - ✓ **Tester calibration verified:** Confirm tester is properly calibrated
   - ✓ **Firmware version verified:** Confirm correct firmware is loaded
3. Click **Complete Pre-Test Verification** when both checks are done

**Step 3: Tester Configuration**
1. Select tester type from radio buttons:
   - **1-up:** Single board testing
   - **4-up:** Four boards simultaneously  
   - **5-up:** Five boards simultaneously
   - **10-up:** Ten boards simultaneously
2. View scan box layout preview
3. Click **Continue** to proceed

**Step 4: Scanning Interface**
1. **Real-time tracking panel** shows:
   - Session duration and status
   - Boards scanned in current session
   - Session quality (pass/fail rate)
   - Productivity (scans per hour)
   - Overall PTL order progress

2. **Scanning controls:**
   - **QR Code input field:** Scan or type board QR codes
   - **Pause Session:** Temporarily stop scanning
   - **Take Break:** Log break time
   - **Resume:** Continue after pause or break
   - **Finish PTL:** Complete the current PTL order

3. **Progress tracking:**
   - Visual indicators for each scan box
   - Pass/fail results in real-time
   - Recent scan history
   - Trend analysis (improving/declining quality)

**Step 5: Post-Test Verification**
1. Review expected vs. actual counts
2. Complete verification checklist:
   - **Final Count Verification:** Confirm total boards tested
   - **Product Count Verified:** Verify against expected quantity
   - **AxxessUpdater:** System update confirmation
3. Click **Complete Session** when all verification is done

**Session Management:**
- **Pause:** Use when temporarily stopping work
- **Break:** Log official break times
- **Resume:** Continue from pause or break
- **Finish:** Complete PTL order testing

### 3. Repair Log
**Purpose:** Track board repairs and rework

**Features:**
- Log failed boards that need repair
- Track repair status and completion
- Record repair methods and technician notes
- View repair history and statistics

**Actions:**
- **Add Repair Entry:** Log a new board for repair
- **Update Status:** Mark repairs as completed
- **Add Notes:** Document repair procedures
- **Search/Filter:** Find specific repair entries

### 4. Scan History
**Purpose:** Review personal scanning history and performance

**Features:**
- View all previous scanning sessions
- Filter by date range or PTL order
- See detailed session statistics
- Export personal performance data

**Information Displayed:**
- Session date and duration
- PTL order details
- Boards scanned, passed, and failed
- Session efficiency metrics

---

## Customer Role Features

Customers have limited access focused on looking up information about their boards.

### 1. Dashboard (Customer View)
**Purpose:** Overview of customer-specific information

**Features:**
- Welcome message
- Quick access to board lookup
- Summary of recent board activity (if applicable)

### 2. Board Lookup
**Purpose:** Search for information about specific boards

**How to Use:**
1. **Enter Search Criteria:**
   - Board QR code or sequence number
   - Date range
   - Assembly number
   - Other identifying information

2. **Search Results:**
   - Board test status (pass/fail)
   - Test date and time
   - Associated PTL order information
   - Repair status (if applicable)

3. **Actions:**
   - **View Details:** See complete board test information
   - **Download Report:** Get PDF report of board status
   - **Request Update:** Contact for additional information

**Search Tips:**
- Use partial QR codes for broader searches
- Filter by date ranges for recent activity
- Combine multiple criteria for precise results

---

## Common Navigation

### Header Functions
- **User Menu:** Access profile settings and logout
- **Role Badge:** Shows current user role
- **System Status:** Displays system health indicators

### Sidebar Menu
- **Collapsible:** Click icon to expand/collapse
- **Role-based:** Only shows features available to your role
- **Active Indicator:** Highlights current page
- **Quick Navigation:** Click any item to navigate instantly

### Search and Filtering
- **Universal Search:** Most pages include search functionality
- **Filter Options:** Use dropdown filters for specific criteria
- **Clear Filters:** Reset button to clear all filters
- **Real-time Results:** Updates as you type

### Data Export
- **Export Buttons:** Available on most data tables
- **Format Options:** CSV, PDF, or Excel formats
- **Date Range Selection:** Choose specific time periods
- **Custom Reports:** Generate tailored reports

### Help and Support
- **Tooltips:** Hover over icons for quick help
- **Field Descriptions:** Form fields include helpful placeholder text
- **Error Messages:** Clear feedback for any issues
- **Status Indicators:** Visual feedback for all actions

---

## Tips for Efficient Use

### For Managers:
- Review dashboard daily for system health
- Set up regular PTL orders in advance
- Monitor technician performance through logs
- Use archives for historical analysis

### For Technicians:
- Complete pre-test verification every time
- Take breaks when needed to maintain quality
- Use pause function for temporary interruptions
- Review scan history to track improvement

### For Customers:
- Bookmark board lookup page for quick access
- Use specific QR codes for fastest results
- Contact support for detailed board history
- Check regularly for updated board status

---

## Troubleshooting

### Common Issues:
1. **Can't see expected features:** Check your user role permissions
2. **Search not working:** Clear filters and try broader criteria  
3. **Scanning issues:** Verify QR code format and tester calibration
4. **Session problems:** Use pause/resume rather than browser refresh
5. **Login problems:** Contact administrator for password reset

### Getting Help:
- Check this guide first for feature explanations
- Use tooltips and help text in the interface
- Contact your system administrator for account issues
- Report bugs or feature requests to the development team

---

*This guide covers all current features of the CW PTL system. Features and interfaces may be updated over time, so refer to the latest version of this documentation for the most current information.*