# 🌿 EcoRoute - Sustainable Commute & Green Points Tracker

A responsive web application with a **clean green-and-white theme**, featuring an interactive transport mode selector (Walk, Cycle, Bus), a real-time carbon savings & Green Points calculator, a user profile dashboard with dynamic impact metrics, and a Node.js + Express + MongoDB/Mongoose backend.

---

## 🗄️ Database & Environment Configuration

The backend connects to MongoDB using **Mongoose** and **dotenv**.

### `.env` Setup
In your root directory, the [`.env`](file:///c:/HITAM/ecoroute-app/.env) file holds the environment variables:
```env
PORT=3000
MONGODB_URI=mongodb+srv://sairockers197_db_user:<db_password>@cluster0.yi5m9ry.mongodb.net/ecoroute?retryWrites=true&w=majority&appName=Cluster0
```

> **Note**: Replace `<db_password>` with your actual MongoDB Atlas database password. If not provided or while developing offline, the backend seamlessly falls back to in-memory state.

### Mongoose User Schema ([`models/User.js`](file:///c:/HITAM/ecoroute-app/models/User.js))
```javascript
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: 3
  },
  greenPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCo2SavedKg: { type: Number, default: 0 },
  totalDistanceKm: { type: Number, default: 0 },
  tripsCount: { type: Number, default: 0 },
  streakDays: { type: Number, default: 1 },
  badgeTier: { type: String, default: 'Sprout Explorer' },
  avatarUrl: { type: String }
}, { timestamps: true });
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database Password in `.env`
Update `<db_password>` in [`.env`](file:///c:/HITAM/ecoroute-app/.env).

### 3. Start the Server
```bash
node server.js
```
or
```bash
npm start
```

### 4. Open in Browser
Visit **[http://localhost:3000](http://localhost:3000)** (or `http://127.0.0.1:3000`).

---

## 📡 Backend REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/users` | Creates a new user with `username` and `greenPoints` in MongoDB |
| `GET` | `/api/profile` | Retrieves current user profile stats, points, tier, and streak |
| `GET` | `/api/commute-options` | Returns transport modes metadata and emission rates |
| `POST` | `/api/calculate` | Calculates estimated CO₂ saved and points for `{ mode, distanceKm }` |
| `POST` | `/api/trips` | Logs a new commute trip, awards points, and updates user profile in MongoDB |
| `GET` | `/api/trips` | Fetches recent logged trips history |
| `GET` | `/api/leaderboard` | Fetches community eco leaderboard |
| `POST` | `/api/profile/reset` | Resets user profile back to demo baseline |
