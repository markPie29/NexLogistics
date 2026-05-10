You are a Principal UI/UX Developer, Senior Product Designer, and Full-Stack SaaS Architect specializing in enterprise logistics systems, transportation management systems (TMS), fleet management platforms, and modern B2B SaaS dashboards.

Your task is to design and build a modern, enterprise-grade logistics and fleet management MVP platform called Nex Logistics.

The platform must visually feel like a premium B2B SaaS product similar to:

Uber Freight
Samsara
Motive
Fleetio
SAP Transportation Management
Oracle Logistics Cloud

The product must NOT look like:

a student project
a generic admin template
a low-quality CRUD system

The experience must feel:

premium
modern
sleek
corporate
operationally realistic
presentation-ready for enterprise clients and investors
BRANDING DIRECTION

Follow the branding and visual identity of NexVision Innovations.

Brand Personality
Premium
Corporate
Futuristic
Clean
Logistics-tech
Intelligent
Professional
Minimal yet powerful
DESIGN SYSTEM
Primary Colors

Use these consistently across the system.

Primary Teal
#66B2B2
Dark Navy / Sidebar
#0B1220
Dark Gray
#333333
Accent Black
#000000
White
#FFFFFF
Light Gray Background
#F5F7FA
Border Gray
#E5E7EB
UI STYLE REQUIREMENTS

The UI must:

use clean spacing
have modern dashboard cards
soft shadows
subtle gradients
rounded corners
elegant tables
premium typography
smooth hover animations
professional status badges
glassmorphism/light elevation where appropriate
clean chart styling
minimal clutter

Use:

cards
KPI widgets
charts
Kanban boards
live map UI
activity timelines
modern tables
modal forms
filter panels
analytics widgets

Avoid:

overly colorful UI
childish icons
cluttered layouts
harsh shadows
outdated admin template appearance
TYPOGRAPHY

Use:

Inter
OR
Roboto

Typography should feel:

enterprise-grade
clean
readable
modern

Use strong visual hierarchy:

bold page headers
medium-weight section titles
clean body text
muted metadata labels
TECH STACK

Build the MVP using:

Frontend
Next.js 14 App Router
TypeScript
Tailwind CSS
ShadCN UI
Lucide Icons
Backend
Supabase
Database
PostgreSQL
Auth
Supabase Auth
Storage
Supabase Storage
Charts
Recharts
Maps
Mapbox
OR
Google Maps API
Deployment
Vercel (frontend)
Supabase (backend/database)
MAIN GOAL

Build a professional logistics and fleet management demo system where:

core modules are functional
future modules are visible as premium preview/demo tabs
the system looks production-ready

The platform must position Nex Logistics as:

Fleet + Trip + Driver + Payroll + PMS + GPS Tracking + Reports in One Enterprise System

USER ROLES

Implement role-based access.

1. Super Admin

Access to everything.

2. Company Admin

Can manage:

company
users
vehicles
drivers
payroll
reports
3. Dispatcher

Can manage:

trips
dispatching
assignments
trip statuses
4. Driver

Can:

view assigned trips
update delivery status
upload proof of delivery
5. Accounting / HR

Can manage:

payroll
attendance
expenses
salary records
6. Client / Customer

Demo-only role.

Can:

track deliveries
view invoices
download proof of delivery
APPLICATION LAYOUT
SIDEBAR

Create a premium left sidebar similar to modern enterprise SaaS systems.

Use:

dark navy background
teal active indicators
collapsible menus
elegant icons
hover states
active state glow

Sidebar modules:

Dashboard
Fleet Management
Driver Management
Trip & Dispatch
Live GPS Tracking
PMS / Maintenance
Fuel & Expenses
Payroll
Attendance
Client Portal
Proof of Delivery
Reports & Analytics
Documents
Billing & Invoices
Warehouse
Route Optimization
AI Insights
Settings

For future modules:
show labels:

“Demo Preview”
OR
“Coming in Full Version”

DO NOT hide future modules.

TOP NAVBAR

Include:

global search
notifications
profile dropdown
company selector
fullscreen button
dark/light mode toggle
quick actions button
MAIN DASHBOARD

The dashboard must immediately impress users.

It should feel:

alive
data-driven
enterprise-grade
DASHBOARD KPI CARDS

Create premium animated KPI cards.

Show:

Total Vehicles
Active Vehicles
Vehicles Under Maintenance
Active Trips
Completed Trips
Delayed Trips
Fuel Cost This Month
Payroll Cost This Month
Revenue This Month
Pending PMS Reminders

Each card should include:

icon
trend indicator
percentage change
mini sparkline graph
clean shadows
hover effect
CHARTS SECTION

Use realistic mixed dummy data.

Include:

Monthly Trip Volume
Revenue vs Expenses
Fuel Consumption Trend
Vehicle Utilization
Driver Performance Ranking
Delayed vs On-Time Deliveries

Charts must:

be modern
responsive
animated
visually clean
use teal + neutral palette
LIVE GPS SECTION

Create a premium live tracking section.

Use:

Mapbox or Google Maps
simulated moving vehicle markers
animated route movement

Vehicle marker colors:

Green = Active
Yellow = Idle
Red = Delayed
Gray = Offline

Vehicle popup must show:

plate number
driver
trip ID
speed
last update
GPS status
engine status

Important:
Design architecture must support future integration with:

Traccar
Teltonika
third-party GPS APIs

For MVP:
use simulated GPS data only.

MODULE REQUIREMENTS
1. FLEET MANAGEMENT

Functional CRUD module.

Features:

Add vehicle
Edit vehicle
Archive vehicle
Assign driver
Upload documents
Track status

Vehicle fields:

Vehicle ID
Plate Number
Vehicle Type
Brand
Model
Year
Color
Capacity
Fuel Type
Odometer
Assigned Driver
GPS Device ID
Registration Expiry
Insurance Expiry
Permit Expiry
Notes

Vehicle profile page must include:

overview
maintenance history
expense history
assigned driver
current trip
GPS info
odometer timeline
uploaded documents
2. DRIVER MANAGEMENT

Functional CRUD module.

Features:

Add driver
Assign vehicle
Upload license
Track license expiry
View performance
View payroll

Driver profile page must show:

personal info
assigned vehicle
active trip
completed trips
attendance summary
payroll summary
performance analytics
uploaded documents
3. TRIP & DISPATCH MANAGEMENT

This is the core operational module.

Features:

create trip
assign vehicle
assign driver
pickup/dropoff
cargo details
delivery status updates
proof of delivery upload

Statuses:

Scheduled
Driver Assigned
Vehicle Dispatched
Loaded
In Transit
Delivered
Delayed
Completed
Cancelled

Create:

Kanban dispatch board
trip timeline
route map
trip activity feed
trip detail page

The Kanban board must feel like:

Jira
Monday.com
logistics dispatch software
4. PMS / MAINTENANCE

Features:

maintenance schedules
mileage reminders
overdue alerts
repair logs
receipt uploads

Dashboard alerts:

PMS due this week
overdue maintenance
expiring insurance
expiring registration
5. FUEL & EXPENSE TRACKING

Features:

fuel entries
repair expenses
toll expenses
cash advances
receipt uploads

Reports:

fuel cost per vehicle
monthly expenses
highest expense vehicles
6. PAYROLL MODULE

Simple but realistic payroll system.

Features:

salary computation
incentives
overtime
deductions
payroll summary
payslip preview

Status:

Draft
Approved
Paid
7. PROOF OF DELIVERY

Features:

delivery photo upload
signature pad
receiver details
GPS timestamp

Include:

clean upload UI
mobile-friendly interface
8. REPORTS & ANALYTICS

Create visually impressive report pages.

Reports:

Trip Report
Vehicle Report
Driver Performance
Fuel Expense
Maintenance
Payroll
Delivery Performance

Each report must include:

filters
charts
tables
export button
summary metrics

Export button may be dummy for MVP.

DEMO-ONLY MODULES

These modules should open beautiful preview pages with realistic dummy data.

Include:

Attendance
Client Portal
Billing & Invoices
Warehouse
Route Optimization
AI Insights

Show premium placeholder experiences.

AI INSIGHTS PAGE

This page must feel futuristic and executive-level.

Show insight cards such as:

“Truck NEX-104 has unusually high fuel usage.”
“Driver Mark Santos has 96% on-time delivery.”
“Vehicle NEX-110 may require PMS soon.”
“Route Manila → Pampanga has recurring delays.”

Use:

AI-style cards
gradient accents
analytics widgets
predictive-style UI

Even if dummy data.

DRIVER MOBILE VIEW

Responsive mobile-first interface.

Driver can:

view assigned trip
update status
upload POD
view cargo details
navigate route

Driver action buttons:

Accept Trip
Arrived at Pickup
Loaded
Start Trip
Arrived at Destination
Delivered
Upload POD

Must feel like:

a real delivery operations app
DEMO DATA

Preload realistic demo data.

VEHICLES

Create:

NEX-101 Truck
NEX-102 Truck
NEX-103 Van
NEX-104 Reefer Van
NEX-105 Wing Van
NEX-106 Motorcycle
NEX-107 Truck
NEX-108 Closed Van
NEX-109 Trailer
NEX-110 Pickup
DRIVERS

Create:

Mark Santos
John Cruz
Allan Reyes
Carlo Mendoza
Ryan Garcia
Joseph Tan
Miguel Dela Cruz
Ronnie Bautista
Edwin Ramos
Paolo Lim
CLIENTS

Create:

ABC Construction
Manila Fresh Foods
Northline Distribution
QuickMart Retail
Prime Medical Supply
Pampanga Builders Depot
TRIPS

Generate:

at least 20 trips
mixed statuses
realistic delivery schedules
realistic fuel/toll expenses
DATABASE TABLES

Prepare complete PostgreSQL schema for:

users
companies
vehicles
drivers
trips
trip_status_logs
maintenance
expenses
payroll
proof_of_delivery
documents

Include:

foreign keys
indexes
timestamps
status enums
relational integrity

Use Supabase-compatible schema.

DEVELOPMENT PRIORITY

Follow this exact build order.

PRIORITY 1
authentication
layout
dashboard
sidebar
fleet CRUD
driver CRUD
PRIORITY 2
trip management
dispatch board
trip detail pages
status updates
PRIORITY 3
GPS simulation
PMS reminders
expenses
PRIORITY 4
payroll
POD
reports
PRIORITY 5
demo-only future modules
RESPONSIVENESS

The platform must:

work beautifully on desktop
support tablets
support driver mobile view
ANIMATION & MICROINTERACTIONS

Use:

Framer Motion
subtle transitions
smooth hover states
loading skeletons
animated charts
map movement animations

Avoid:

excessive motion
distracting effects
FINAL MVP DELIVERABLES

Deliver:

deployed frontend
Supabase backend
seeded demo database
responsive UI
demo role accounts
premium dashboard
live simulated GPS map
fleet management
driver management
dispatch board
PMS module
fuel & expenses
payroll
POD
reports
preview modules
admin guide
IMPORTANT DESIGN DIRECTION

The final system should visually feel like:

“A real enterprise logistics operating system used by large transportation companies.”

It must feel:

scalable
operational
investor-ready
enterprise-grade
modern SaaS
premium tech platform

Focus heavily on:

dashboard quality
spacing
typography
information hierarchy
clean enterprise UI
believable operational workflows
polished demo experience

Build this MVP as if presenting to:

enterprise logistics companies
investors
corporate procurement teams
transportation operators
B2B SaaS clients