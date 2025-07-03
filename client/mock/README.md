# Mock Data

This folder contains all mock data used throughout the VeXeRe application for development and testing purposes.

## Structure

-   `tickets.ts` - Mock ticket data for the ticket management system
-   `chat.ts` - Mock chat session data for the customer support chat system
-   `index.ts` - Exports all mock data for easy importing

## Usage

To use mock data in your components:

```typescript
import { mockTickets, mockChatSessions } from '@/mock';
```

Or import specific types:

```typescript
import { type ChatMessage, type ChatSession } from '@/mock';
```

## Files Description

### tickets.ts

Contains sample ticket data with the following structure:

-   Customer information (name, phone, email)
-   Trip details (from, to, date, time, seat number)
-   Payment information and status
-   Company and trip metadata
-   Activity logs

### chat.ts

Contains sample chat session data including:

-   Chat session metadata
-   Message history between users and assistants
-   Different chat scenarios (booking inquiries, cancellations, complaints, etc.)
-   Message attachments (images, audio)

## Data Types

All mock data follows the same TypeScript interfaces used in the production application to ensure type safety and consistency.
