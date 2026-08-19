# Pablo

Pablo is a fast-paced, multiplayer memory card game inspired by Golf. Build the lowest-scoring hand by remembering your hidden cards, making calculated swaps, using special abilities, and calling **PABLO** when you think you are ahead.

Create a room, share its six-character code, and play with 2 to 6 people in the browser. A local demo mode is also available from the home page.

## How to play

Each player starts with four face-down cards. At the beginning of every round, there is a 15-second preview phase: you may look at exactly two of your own cards, then they turn face-down again.

On your turn, you have 45 seconds to:

1. Draw from the face-down draw pile or take the top card of the discard pile.
2. Swap the drawn card with one of your hidden cards. A card drawn from the draw pile can instead be discarded.
3. If you select two or more cards when swapping, matching ranks are discarded and reduce your hand. A mismatch is a penalty: the drawn card is added to your hand.

Cards are worth their face value, with Aces worth 1, Jacks 11, Queens 12, and Kings 13. The King of Spades is worth **0** - the best card in the game. The player with the lowest score at the end wins.

### Special cards

Special abilities activate when you draw one of these cards from the draw pile and discard it:

| Card | Ability |
| --- | --- |
| 7 | Peek at one of your own hidden cards |
| 8 | Peek at one hidden card belonging to another player |
| 9 | Blind-swap one of your cards with an opponent's card |

### Calling PABLO

During the playing phase, any player can call **PABLO** when they believe their hand has the lowest score. The other players receive their final turns, then all hands are revealed and scored. You can vote for a rematch once the round ends.

## Multiplayer architecture

- **Next.js 16 + React 19** provide the game UI and API routes.
- **Upstash Redis** stores room and game state. Rooms expire after 24 hours.
- **Pusher Channels** sends lightweight room-update notifications, so clients refresh state when another player acts instead of continuously polling Redis.
- Game-state responses mask hidden opponent cards and the draw pile for each player.

## Run locally

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Create a `.env.local` file in the project root. Do not commit it.

```env
# Upstash Redis (server-only)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Pusher Channels (server-only)
PUSHER_APP_ID=""
PUSHER_KEY=""
PUSHER_SECRET=""
PUSHER_CLUSTER=""

# Required by the browser to connect to Pusher
NEXT_PUBLIC_PUSHER_KEY=""
NEXT_PUBLIC_PUSHER_CLUSTER=""
```

Get Redis credentials from the Upstash dashboard. Create a Channels app in the Pusher dashboard, then copy its App ID, Key, Secret, and Cluster from **App Keys**. The two `NEXT_PUBLIC_` values must match the Pusher Key and Cluster.

Without Pusher configured, the app uses a slow 15-second refresh fallback for local development. Configure both services for a responsive multiplayer deployment.

## Scripts

```bash
npm run dev    # Start the development server
npm run lint   # Run ESLint
npm run build  # Create a production build
npm run start  # Serve a production build
```

## Deploy to Vercel

Import the repository into Vercel, then add the eight environment variables above in the project's **Production** environment. Deploying from Git does not upload `.env.local`, which keeps the Redis token and Pusher secret private.
