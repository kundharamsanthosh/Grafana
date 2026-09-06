# Grafana Integration Guide for Demoblaze Playwright Project

This document explains how to integrate Grafana with the Demoblaze Playwright automation project.

Current project:

```text
C:\Automation\DemoblazeGrafanaPractice
```

Current status:

```text
Only Playwright test automation is implemented.
Grafana integration is planned for later.
```

## 1. Why Grafana Is Needed

Grafana is used to visualize test execution results in dashboards.

Playwright can run tests and produce results, but Grafana cannot read Playwright test output directly.

So we need this flow:

```text
Playwright Tests
   ↓
Custom Metrics
   ↓
Prometheus
   ↓
Grafana Dashboard
```

## 2. Tools Involved

### Playwright

Used for test automation.

In this project, Playwright tests are available in:

```text
tests/demoblaze.spec.ts
```

### Prometheus

Used to collect and store metrics.

Prometheus reads metrics from an HTTP endpoint like:

```text
http://localhost:9464/metrics
```

### Grafana

Used to create dashboards using Prometheus data.

Grafana usually runs at:

```text
http://localhost:3000
```

### Loki

Used to collect and query logs.

For Playwright, Loki is useful for storing:

```text
Test execution logs
Failed test messages
Console logs
Error stack traces
Run status logs
```

Loki is different from Prometheus:

```text
Prometheus = metrics
Loki = logs
Grafana = dashboard for both
```

If you want to start with only Loki and Grafana, the flow will be:

```text
Playwright Tests
   ↓
Log File
   ↓
Promtail
   ↓
Loki
   ↓
Grafana
```

## 3. Metrics We Want From Playwright

Useful test metrics:

```text
Total tests
Passed tests
Failed tests
Skipped tests
Run duration
Individual test duration
Last run status
```

Example Prometheus metrics:

```text
playwright_tests_total 4
playwright_tests_passed_total 4
playwright_tests_failed_total 0
playwright_test_run_duration_seconds 20
```

## 4. Step-by-Step Implementation Plan

### Step 1: Add Custom Playwright Reporter

Create a new folder:

```text
reporters
```

Create a file:

```text
reporters/prometheusReporter.ts
```

Purpose of this file:

```text
Read Playwright test results
Convert results into Prometheus metric format
Save metrics into a .prom file
```

Expected output file:

```text
test-results/prometheus/playwright-metrics.prom
```

### Step 2: Add Test Metrics Script

In `package.json`, add a script like:

```json
"test:metrics": "playwright test --config=playwright.config.ts --reporter=list,./reporters/prometheusReporter.ts"
```

Then run:

```powershell
npm run test:metrics
```

Expected result:

```text
Tests should run
Metrics file should be generated
```

### Step 3: Add Metrics Server

Create file:

```text
metrics-server.js
```

Purpose:

```text
Read the generated .prom metrics file
Expose metrics using HTTP
```

Metrics URL:

```text
http://localhost:9464/metrics
```

In `package.json`, add:

```json
"metrics:server": "node metrics-server.js"
```

Run:

```powershell
npm run metrics:server
```

Open in browser:

```text
http://localhost:9464/metrics
```

You should see metrics like:

```text
playwright_tests_total 4
playwright_tests_passed_total 4
playwright_tests_failed_total 0
```

### Step 4: Add Prometheus Config

Create folder:

```text
prometheus
```

Create file:

```text
prometheus/prometheus.yml
```

Prometheus config example:

```yaml
global:
  scrape_interval: 5s

scrape_configs:
  - job_name: playwright-demoblaze
    static_configs:
      - targets:
          - host.docker.internal:9464
```

Purpose:

```text
Tell Prometheus to scrape Playwright metrics every 5 seconds
```

### Step 5: Add Docker Compose

Create file:

```text
docker-compose.yml
```

Purpose:

```text
Start Prometheus and Grafana using Docker
```

Docker Compose should contain:

```text
prometheus service
grafana service
```

Prometheus URL:

```text
http://localhost:9090
```

Grafana URL:

```text
http://localhost:3000
```

### Step 6: Start Prometheus and Grafana

Docker Desktop must be installed and running.

Run:

```powershell
docker compose up -d
```

To stop:

```powershell
docker compose down
```

### Step 7: Configure Grafana Data Source

Open Grafana:

```text
http://localhost:3000
```

Login:

```text
username: admin
password: admin
```

Add Prometheus data source:

```text
Connections
Data sources
Add data source
Prometheus
```

URL:

```text
http://prometheus:9090
```

Click:

```text
Save & test
```

### Step 8: Create Grafana Dashboard Panels

Create dashboard panels using these PromQL queries.

Total tests:

```promql
playwright_tests_total
```

Passed tests:

```promql
playwright_tests_passed_total
```

Failed tests:

```promql
playwright_tests_failed_total
```

Run duration:

```promql
playwright_test_run_duration_seconds
```

Individual test duration:

```promql
playwright_test_duration_seconds
```

## 4A. Loki + Grafana Implementation Plan

Use this section when you want logs first instead of metrics.

### Step 1: Generate Playwright Log File

Create one log file from test execution.

Example log path:

```text
logs/playwright-test.log
```

Later, the test command can redirect output into this file:

```powershell
npm test *> logs/playwright-test.log
```

Or for headed mode:

```powershell
npm run test:headed *> logs/playwright-test.log
```

Purpose:

```text
Save Playwright execution output into a file
```

### Step 2: Add Loki

Loki stores logs.

Loki usually runs on:

```text
http://localhost:3100
```

Grafana will connect to Loki using:

```text
http://loki:3100
```

### Step 3: Add Promtail

Promtail reads local log files and pushes them to Loki.

Promtail will watch:

```text
logs/playwright-test.log
```

Promtail will attach labels such as:

```text
job="playwright"
project="demoblaze"
```

These labels help you query logs in Grafana.

### Step 4: Add Docker Compose for Loki + Grafana

Later, create:

```text
docker-compose.yml
```

Services needed:

```text
loki
promtail
grafana
```

URLs:

```text
Grafana: http://localhost:3000
Loki: http://localhost:3100
```

### Step 5: Add Loki Config

Create:

```text
loki/loki-config.yml
```

Purpose:

```text
Configure Loki storage and server port
```

### Step 6: Add Promtail Config

Create:

```text
promtail/promtail-config.yml
```

Purpose:

```text
Tell Promtail which log file to read
Tell Promtail where Loki is running
Add labels to Playwright logs
```

Example labels:

```yaml
labels:
  job: playwright
  project: demoblaze
```

### Step 7: Connect Grafana to Loki

Open Grafana:

```text
http://localhost:3000
```

Login:

```text
username: admin
password: admin
```

Add Loki data source:

```text
Connections
Data sources
Add data source
Loki
```

URL:

```text
http://loki:3100
```

Click:

```text
Save & test
```

### Step 8: Query Logs in Grafana

Go to:

```text
Explore
```

Select:

```text
Loki
```

Try this LogQL query:

```logql
{job="playwright"}
```

For Demoblaze only:

```logql
{job="playwright", project="demoblaze"}
```

Search failed tests:

```logql
{job="playwright"} |= "failed"
```

Search passed tests:

```logql
{job="playwright"} |= "passed"
```

Search errors:

```logql
{job="playwright"} |= "Error"
```

### Step 9: Create Grafana Dashboard with Loki

Create a dashboard with these panels:

```text
Panel 1: Full Playwright logs
Panel 2: Error logs
Panel 3: Failed test logs
Panel 4: Passed test logs
```

Panel queries:

All logs:

```logql
{job="playwright", project="demoblaze"}
```

Errors:

```logql
{job="playwright", project="demoblaze"} |= "Error"
```

Failures:

```logql
{job="playwright", project="demoblaze"} |= "failed"
```

Passed:

```logql
{job="playwright", project="demoblaze"} |= "passed"
```

### Step 10: Loki + Grafana Run Order

Terminal 1:

```powershell
cd C:\Automation\DemoblazeGrafanaPractice
docker compose up -d
```

Terminal 2:

```powershell
cd C:\Automation\DemoblazeGrafanaPractice
New-Item -ItemType Directory -Force logs
npm test *> logs/playwright-test.log
```

Open Grafana:

```text
http://localhost:3000
```

Then query:

```logql
{job="playwright", project="demoblaze"}
```

## 4B. When To Use Loki vs Prometheus

Use Loki when you want:

```text
Execution logs
Failure messages
Console output
Debugging information
Stack traces
Text search
```

Use Prometheus when you want:

```text
Pass count
Fail count
Execution duration
Pass percentage
Trend charts
Alerts based on numbers
```

Best real company setup:

```text
Loki + Prometheus + Grafana
```

Best first learning setup:

```text
Loki + Grafana
```

## 5. Final Run Order After Integration

Terminal 1:

```powershell
cd C:\Automation\DemoblazeGrafanaPractice
npm run test:metrics
```

Terminal 2:

```powershell
cd C:\Automation\DemoblazeGrafanaPractice
npm run metrics:server
```

Terminal 3:

```powershell
cd C:\Automation\DemoblazeGrafanaPractice
docker compose up -d
```

Open Grafana:

```text
http://localhost:3000
```

## 6. Common Issues

### Issue: No Metrics in Grafana

Check metrics server first:

```text
http://localhost:9464/metrics
```

If this URL does not show metrics, Grafana will not show data.

### Issue: Prometheus Cannot Scrape Metrics

Open Prometheus:

```text
http://localhost:9090
```

Go to:

```text
Status > Targets
```

Check whether `playwright-demoblaze` is `UP`.

### Issue: Docker Command Not Found

Docker Desktop is not installed or not added to PATH.

Install Docker Desktop and restart the terminal.

### Issue: Browser Not Opening in Playwright

This project uses installed Google Chrome.

Run tests from project root:

```powershell
cd C:\Automation\DemoblazeGrafanaPractice
npm run test:headed
```

## 7. Practice Tasks

After Grafana is added, practice these:

```text
Create a total tests panel
Create passed and failed stat panels
Create a test duration graph
Intentionally fail one test and observe Grafana
Change dashboard refresh interval
Create a pass percentage panel
Create an alert for failed tests
Export dashboard JSON
Import dashboard JSON again
```

## 8. Learning Checklist

Use this checklist while learning:

```text
[ ] I can run Playwright tests
[ ] I understand test pass/fail output
[ ] I can generate Prometheus metrics
[ ] I can open the metrics endpoint
[ ] I can start Prometheus
[ ] I can query metrics in Prometheus
[ ] I can start Grafana
[ ] I can connect Grafana to Prometheus
[ ] I can create Grafana panels
[ ] I can modify dashboard queries
[ ] I can create a basic alert
```

## 9. Current Playwright Commands

Run all tests:

```powershell
cd C:\Automation\DemoblazeGrafanaPractice
npm test
```

Run in headed mode:

```powershell
cd C:\Automation\DemoblazeGrafanaPractice
npm run test:headed
```

Run in debug mode:

```powershell
cd C:\Automation\DemoblazeGrafanaPractice
npx playwright test --config=playwright.config.ts --debug
```
