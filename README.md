# Content Broadcasting System Backend

Backend service for a content broadcasting workflow where teachers upload media, principals approve or reject it, and a public endpoint returns the currently active content for a teacher based on subject-level rotation rules.

## Tech Stack

- Node.js
- Express
- PostgreSQL (Neon.tech)
- Sequelize
- JWT
- Multer

## Quick Start

```bash
git clone <repository-url>
cd <project-folder>
npm install
```

Create a `.env` file in the project root:

```env
PORT=3000
DATABASE_URL=your_neon_postgres_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
```

Start the server in development mode:

```bash
npm run dev
```

## Assumptions & Architecture

- The broadcast selection logic is stateless. It does not depend on cron jobs, background workers, or any persisted rotation state.
- Rotation is calculated at request time using the current epoch time and modulo arithmetic against the total duration of each subject slot cycle.
- Each subject is represented as a slot, and each uploaded content item is attached to that slot through a schedule record with `rotation_order` and `duration`.
- Teacher-defined `start_time` and `end_time` are enforced during the live query. If a content item is outside its time window, it is ignored completely.
- Only content with `approved` status is eligible for the live broadcast endpoint.
- Uploaded files are stored locally on disk through Multer and served from the local `uploads/` directory.

## Links

- [GitHub Repository](https://github.com/amarjec/grobpac-backend-assignment-Broadcasting-system-)
- [Live Deployment URL](https://grubpac-assignment-amar-agrawal.onrender.com/)
- [Postman API Docs](https://documenter.getpostman.com/view/47511143/2sBXqGr2TJ)
- [Demo Video](https://drive.google.com/drive/folders/1njN0xt6zisIt_PyA-7P869mGJpwo6-Mb?usp=share_link)
