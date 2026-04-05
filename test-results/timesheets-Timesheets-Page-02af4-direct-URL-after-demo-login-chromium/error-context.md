# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: timesheets.spec.ts >> Timesheets Page - Navigation >> timesheets page is accessible via direct URL after demo login
- Location: apps/web/e2e/timesheets.spec.ts:435:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/roster/
Received string:  "https://crewcircle.co/demo"

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    3 × unexpected value "https://crewcircle.co/demo"

```

```
Error: write EPIPE
```