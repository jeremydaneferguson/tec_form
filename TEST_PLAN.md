# TEC Form Test Plan

## 1. Purpose

Verify that users can access the TEC assessment form, complete and save assessments, submit valid assessments, and that administrators can manage users, departments, and roles.

## 2. Test Setup

- Application running locally or on the Linux server.
- PostgreSQL database available and configured through `DATABASE_URL`.
- Browser: current Chrome, Edge, or Firefox.
- Test email address available for saving a submission.
- Test accounts/data available for admin operations.

Local startup:

```bash
npm install
npm run dev
```

For the deployed application, test the configured URL, including the `/tec` path when applicable.

## 3. Functional Tests

| ID | Test | Steps | Expected result |
|---|---|---|---|
| T01 | Login gate | Open the application root in a new browser session or clear `tecFormLoggedIn` from local storage. | User is redirected to the login page. |
| T02 | Login without credentials | On the login page, click **Login** without entering credentials. | User is taken to the TEC assessment form. No username or password is requested. |
| T03 | Return to login when logged out | Clear `tecFormLoggedIn`, then open the form URL again. | User is redirected to login and cannot view the form until clicking Login. |
| T04 | Form navigation | Log in and move forward and backward through the form steps. | The correct step is displayed and navigation does not crash or lose entered values. |
| T05 | Reviewing Department required | On the Reviewing Department step, leave the department blank and attempt to continue or submit. | Submission/continuation is blocked and a clear required-field message is shown. |
| T06 | Email required | Leave the email blank and attempt to continue, save, or submit. | The action is blocked and the user is told to complete the Email field. |
| T07 | Valid department selection | Select each available reviewing department where practical. | The selected department is retained and the appropriate department assessment step opens. |
| T08 | Save draft | Enter an email and some form data, then use the save action. | A success message is shown and the draft is stored in the database. |
| T09 | Load saved draft | Reopen the form using the same email after saving a draft. | Previously saved form data is loaded. |
| T10 | Submit valid form | Complete all required fields and follow the form flow to submission. | The submission succeeds, the success state is shown, and the user is redirected to the thank-you page. |
| T11 | Export form | Enter an email and form data, then use the PDF/export action. | A printable export opens and contains the saved form values. |
| T12 | Admin navigation | Log in and open **Admin** from the sidebar. | The admin page opens with Users, Departments, and Roles tabs. |
| T13 | User management | Add, edit, search, and delete a test user. | Each operation succeeds and the displayed list reflects the change. |
| T14 | Department management | Add, edit, and delete a department that is not in use. | Each operation succeeds and the displayed department list updates. |
| T15 | Department delete protection | Attempt to delete a department referenced by existing data. | The delete is blocked with an explanatory message. |
| T16 | Role management | Add, edit, and delete a test role. | Each operation succeeds and the displayed role list updates. |
| T17 | API/database failure handling | Temporarily stop the database or use an invalid database configuration, then load/save data. | The application shows a useful error state and does not silently report success. |

## 4. Deployment Smoke Tests

Run these after deploying or rebuilding the application on Linux:

1. Confirm the process is running with PM2.
2. Open the configured Nginx URL and confirm the login page loads.
3. Click Login and confirm the form loads under the configured path.
4. Save a small draft and confirm it appears in PostgreSQL.
5. Submit a valid test form and confirm the thank-you page loads.
6. Open the Admin page and confirm users, departments, and roles load.
7. Review PM2 and Nginx logs for unexpected errors.

Useful commands:

```bash
pm2 status
pm2 logs tec-form --lines 50 --nostream
sudo nginx -t
```

## 5. Acceptance Criteria

- A user cannot access the form before clicking Login.
- Login works without credentials.
- Required-field validation prevents incomplete continuation and submission.
- Drafts save and reload correctly.
- Valid submissions reach the thank-you page and persist in the database.
- Admin CRUD operations work for users, departments, and roles.
- The deployed application works through the configured Nginx path.
- No blocking browser console, server, or database errors remain after the smoke test.

## 6. Test Result Record

| Test run date | Environment | Tester | Result | Notes |
|---|---|---|---|---|
|  |  |  |  |  |
