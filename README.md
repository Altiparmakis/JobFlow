# JobTrack

JobTrack is a modern job application tracker that helps users organize and manage their job search in one place.

Users can save job opportunities, track their progress through different application stages, add notes, edit application details, and manage their job search workflow with a clean Kanban-style board.

## Live Demo

[JobTrack Live App](https://jobtrack-opal.vercel.app/)

## Features

- User authentication with Clerk
- Protected application dashboard
- Add new job applications
- Edit existing applications
- Delete applications
- Drag and drop applications between status columns
- Optimistic UI updates for a smoother experience
- Confetti celebration when an application is accepted
- Notes / activity history for each application
- Edit and delete notes
- Application details modal
- Responsive and modern UI
- Total jobs counter
- Empty state for new users
- Neon PostgreSQL database
- Prisma ORM

## Application Statuses

Applications can be tracked through the following stages:

- Saved
- Applied
- Screen
- Interviewing
- Offer
- Rejected
- Accepted

## Tech Stack

- Next.js App Router
- JavaScript
- Tailwind CSS
- Clerk
- Prisma
- Neon PostgreSQL
- Vercel
- canvas-confetti
- pnpm

## Project Structure

```txt
app/
  applications/
    page.js
  layout.js
  page.js

components/
  Navbar
  Footer
  Application board components
  Modal components

lib/
  prisma.js
  confetti helpers

prisma/
  schema.prisma
  migrations/

public/
  logo.png
  favicon_io/
```
